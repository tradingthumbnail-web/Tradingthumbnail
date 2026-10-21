#!/usr/bin/env python3
import json
import sys
import argparse
import logging
import os
import re
from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path
import psycopg2
import psycopg2.extras
import boto3
from botocore.exceptions import ClientError
from dateutil.relativedelta import relativedelta

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def _load_dotenv(env_path: Path) -> None:
    """Load KEY=VALUE pairs from a .env file without overriding existing env vars."""
    if not env_path.is_file():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        if key and key not in os.environ:
            os.environ[key] = value


_load_dotenv(Path(__file__).resolve().parent / ".env")


def _env(name: str, default: str = "") -> str:
    value = os.environ.get(name, default)
    return value.strip() if value is not None else default


class MigrationConfig:
    # === PHASE CONTROL FLAGS ===
    MIGRATE_USERS = True
    MIGRATE_SUBSCRIPTIONS = True
    COPY_AVATAR_FILES = True
    MIGRATE_AVATARS = True
    COPY_IMAGE_FILES = True
    MIGRATE_IMAGES = True

    def __init__(self) -> None:
        self.OLD_DB_CONNECTION_STRING = _env("OLD_DB_CONNECTION_STRING")
        self.NEW_DB_CONNECTION_STRING = _env("NEW_DB_CONNECTION_STRING")
        # Migration uses separate source/destination keys. Do not hardcode credentials in this file.
        self.OLD_AWS_ACCESS_KEY = _env("OLD_AWS_ACCESS_KEY")
        self.OLD_AWS_SECRET_KEY = _env("OLD_AWS_SECRET_KEY")
        self.OLD_AWS_REGION = _env("OLD_AWS_REGION", "eu-west-1")
        self.OLD_BUCKET = _env("OLD_BUCKET")
        self.NEW_AWS_ACCESS_KEY = _env("NEW_AWS_ACCESS_KEY")
        self.NEW_AWS_SECRET_KEY = _env("NEW_AWS_SECRET_KEY")
        self.NEW_AWS_REGION = _env("NEW_AWS_REGION", "eu-west-1")
        self.NEW_BUCKET = _env("NEW_BUCKET")
        self.ENVIRONMENT = _env("ENVIRONMENT", "production")
        self.USER_ID_FILTER = None


class MigrationState:
    def __init__(self):
        self.avatars_processed = 0
        self.avatars_failed = 0
        self.images_processed = 0
        self.images_failed = 0
        self.failed_avatars = []
        self.failed_images = []
        self.users_processed = 0
        self.users_failed = 0
        self.failed_users = []
        self.subscriptions_processed = 0
        self.subscriptions_failed = 0
        self.failed_subscriptions = []


def get_db_connection(connection_string: str):
    try:
        conn = psycopg2.connect(
            connection_string,
            connect_timeout=30,
            keepalives=1,
            keepalives_idle=60,
            keepalives_interval=30,
            keepalives_count=5,
            application_name="kithumbs-migration"
        )
        with conn.cursor() as cur:
            cur.execute("SET statement_timeout TO 0")
            cur.execute("SET idle_in_transaction_session_timeout TO 0")
        return conn
    except psycopg2.Error as e:
        logger.error(f"Failed to connect to database: {e}")
        raise


def ensure_connection(conn: Any, connection_string: str, operation_name: str = "operation") -> Any:
    """Ensure connection is alive, reconnect if needed."""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        return conn
    except psycopg2.Error as e:
        logger.warning(f"Connection lost during {operation_name}, reconnecting...")
        try:
            conn.close()
        except:
            pass
        return get_db_connection(connection_string)


def get_s3_client(
    access_key: str,
    secret_key: str,
    region: str,
    *,
    credential_hint: str,
) -> Any:
    """Build an S3 client from explicit keys or the standard AWS credential chain."""
    if access_key and secret_key:
        return boto3.client(
            's3',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region or None,
        )

    session = boto3.Session(region_name=region or None)
    credentials = session.get_credentials()
    if credentials is None:
        logger.error(
            "Missing AWS credentials for %s. Set %s, or configure the default chain "
            "(AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY, ~/.aws/credentials, or IAM role).",
            credential_hint,
            credential_hint,
        )
        raise RuntimeError(f"AWS credentials not configured ({credential_hint})")

    return session.client('s3')


def generate_avatar_storage_key(user_id: str, avatar_id: str, environment: str) -> str:
    return f"{user_id}/avatars/{environment}/{avatar_id}"


def generate_image_storage_key(user_id: str, image_type: str, image_id: str, environment: str) -> str:
    return f"{user_id}/images/{environment}/{image_type}/{image_id}.png"


def copy_s3_file(
    source_client: Any,
    dest_client: Any,
    source_bucket: str,
    dest_bucket: str,
    source_key: str,
    dest_key: str
) -> bool:
    try:
        copy_source = {'Bucket': source_bucket, 'Key': source_key}
        dest_client.copy_object(
            CopySource=copy_source,
            Bucket=dest_bucket,
            Key=dest_key
        )
        logger.debug(f"Copied {source_key} to {dest_key}")
        return True
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            logger.warning(f"Source file not found: {source_key}")
        else:
            logger.error(f"Failed to copy file from {source_key} to {dest_key}: {e}")
        return False


def singular_type(plural_type: str) -> str:
    type_map = {
        'backgrounds': 'background',
        'characters': 'character',
        'avatars': 'avatar',
        'compositions': 'composition',
        'alls': 'all',
    }
    return type_map.get(plural_type, plural_type)


def copy_avatar_files(
    old_s3_client: Any,
    new_s3_client: Any,
    old_bucket: str,
    new_bucket: str,
    user_id: str,
    environment: str
) -> tuple[int, int]:
    try:
        prefix = f"{user_id}/avatars-{environment}/"
        response = old_s3_client.list_objects_v2(
            Bucket=old_bucket,
            Prefix=prefix
        )
        
        if 'Contents' not in response:
            logger.debug(f"No avatar files found for user {user_id}")
            return 0, 0
        
        objects = response['Contents']
        copied = 0
        failed = 0
        
        for obj in objects:
            if obj['Key'].endswith('/'):
                continue
            
            try:
                source_key = obj['Key']
                filename = source_key.split('/')[-1]
                
                if filename.startswith('reference-DIVINEDEPARTURE-'):
                    match = re.match(r'reference-DIVINEDEPARTURE-(\d+)\..+', filename)
                    if match:
                        index = match.group(1)
                        avatar_id = source_key.split('/')[-2]
                        dest_key = f"{user_id}/avatars/{environment}/{avatar_id}/training-images/{index}.jpg"
                        logger.debug(f"Transforming training image {filename} to {dest_key}")
                    else:
                        logger.warning(f"Could not extract index from training image {filename}, skipping")
                        failed += 1
                        continue
                elif filename.startswith('reference_'):
                    filename = filename.replace('reference_', '', 1)
                    avatar_id = source_key.split('/')[-2]
                    dest_key = f"{user_id}/avatars/{environment}/{avatar_id}/{filename}"
                    logger.debug(f"Renamed {source_key.split('/')[-1]} to {filename}")
                elif filename == 'weights.safetensors':
                    avatar_id = source_key.split('/')[-2]
                    dest_key = f"{user_id}/avatars/{environment}/{avatar_id}/model.safetensors"
                    logger.debug(f"Renamed weights.safetensors to model.safetensors")
                else:
                    avatar_id = source_key.split('/')[-2]
                    dest_key = f"{user_id}/avatars/{environment}/{avatar_id}/{filename}"
                
                copy_source = {'Bucket': old_bucket, 'Key': source_key}
                new_s3_client.copy_object(
                    CopySource=copy_source,
                    Bucket=new_bucket,
                    Key=dest_key
                )
                copied += 1
                logger.debug(f"Copied avatar file {source_key} to {dest_key}")
            except ClientError as e:
                failed += 1
                logger.error(f"Failed to copy avatar file {obj['Key']}: {e}")
        
        return copied, failed
        
    except Exception as e:
        logger.error(f"Error copying avatar files for user {user_id}: {e}")
        return 0, 1


def copy_image_files(
    old_s3_client: Any,
    new_s3_client: Any,
    old_bucket: str,
    new_bucket: str,
    user_id: str,
    environment: str
) -> tuple[int, int]:
    try:
        image_types = ['backgrounds', 'characters', 'avatars', 'compositions', 'alls']
        total_copied = 0
        total_failed = 0
        
        for type_plural in image_types:
            try:
                prefix = f"{user_id}/{type_plural}-{environment}/"
                response = old_s3_client.list_objects_v2(
                    Bucket=old_bucket,
                    Prefix=prefix
                )
                
                if 'Contents' not in response:
                    continue
                
                type_singular = singular_type(type_plural)
                objects = response['Contents']
                
                for obj in objects:
                    if obj['Key'].endswith('/'):
                        continue
                    
                    try:
                        source_key = obj['Key']
                        filename = source_key.split('/')[-1]
                        dest_key = f"{user_id}/images/{environment}/{type_singular}/{filename}"
                        
                        copy_source = {'Bucket': old_bucket, 'Key': source_key}
                        new_s3_client.copy_object(
                            CopySource=copy_source,
                            Bucket=new_bucket,
                            Key=dest_key
                        )
                        total_copied += 1
                        logger.debug(f"Copied image file {source_key} to {dest_key}")
                    except ClientError as e:
                        total_failed += 1
                        logger.error(f"Failed to copy image file {obj['Key']}: {e}")
            except Exception as e:
                logger.error(f"Error copying {type_plural} files for user {user_id}: {e}")
                total_failed += 1
        
        return total_copied, total_failed
        
    except Exception as e:
        logger.error(f"Error copying image files for user {user_id}: {e}")
        return 0, 1


def migrate_users(
    old_conn: Any,
    new_conn: Any,
    state: MigrationState,
    user_id_filter: Optional[str] = None
):
    logger.info("Starting user migration...")
    
    try:
        old_cursor = old_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        new_cursor = new_conn.cursor()
        
        query = "SELECT * FROM users"
        params = []
        
        if user_id_filter:
            query += " WHERE id = %s"
            params.append(user_id_filter)
        
        old_cursor.execute(query, params)
        users = old_cursor.fetchall()
        logger.info(f"Found {len(users)} users to migrate")
        
        for user in users:
            try:
                user_id = user['id']
                
                validation_date = None
                if user.get('is_validated'):
                    validation_date = user.get('updated_at')
                
                locale = 'en'
                
                new_cursor.execute("""
                    INSERT INTO "user" (id, name, username, email, hashed_password, credit, avatar_credit, stripe_customer_id, role, validation_date, notifications, locale, created_at, updated_at, last_signed_in_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, (
                    user_id,
                    user['name'],
                    user['username'],
                    user['email'],
                    user['hashed_password'],
                    user.get('credit', 0),
                    user.get('avatar_credit', 0),
                    user.get('stripe_customer_id'),
                    user.get('role', 'user').upper() if user.get('role') else 'USER',
                    validation_date,
                    user.get('notifications', True),
                    locale,
                    user['created_at'],
                    user['updated_at'],
                    user.get('last_signed_in_at')
                ))
                new_conn.commit()
                state.users_processed += 1
                logger.info(f"Migrated user {user_id}")
                
            except Exception as e:
                new_conn.rollback()
                state.failed_users.append({
                    'user_id': str(user.get('id', 'unknown')),
                    'error': str(e)
                })
                state.users_failed += 1
                logger.error(f"Error migrating user {user.get('id')}: {e}")
        
        old_cursor.close()
        new_cursor.close()
        
    except Exception as e:
        logger.error(f"User migration failed: {e}")
        raise


def migrate_subscriptions(
    old_conn: Any,
    new_conn: Any,
    config: MigrationConfig,
    state: MigrationState,
    user_id_filter: Optional[str] = None
):
    logger.info("Starting subscription migration...")
    
    try:
        old_cursor = old_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        new_cursor = new_conn.cursor()
        
        query = "SELECT * FROM users WHERE tier IS NOT NULL"
        params = []
        
        if user_id_filter:
            query += " AND id = %s"
            params.append(user_id_filter)
        
        old_cursor.execute(query, params)
        users_with_subs = old_cursor.fetchall()
        logger.info(f"Found {len(users_with_subs)} users with subscriptions")
        
        for user in users_with_subs:
            try:
                user_id = user['id']
                old_tier_id = user['tier']
                
                new_tier_id = map_tier_id(old_tier_id, old_conn, new_conn)
                if not new_tier_id:
                    logger.warning(f"Could not map tier {old_tier_id} for user {user_id}, skipping")
                    continue
                
                subscription_data = user.get('subscription_data', {}) or {}
                stripe_subscription_id = subscription_data.get('subscriptionId')
                
                old_status = user.get('subscription_status', 'inactive')
                new_status = map_subscription_status(old_status)
                
                next_renewal = user.get('next_renewal')
                subscription_interval = user.get('subscription_interval')
                
                if next_renewal and subscription_interval:
                    if subscription_interval == 'month':
                        starts_at = next_renewal - relativedelta(months=1)
                    elif subscription_interval == 'year':
                        starts_at = next_renewal - relativedelta(years=1)
                    else:
                        starts_at = user['created_at']
                else:
                    starts_at = user['created_at']
                
                ends_at = next_renewal if next_renewal else starts_at + relativedelta(months=1)
                
                new_cursor.execute("""
                    INSERT INTO subscription (tier_id, user_id, stripe_subscription_id, status, starts_at, ends_at, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (stripe_subscription_id) DO NOTHING
                """, (
                    new_tier_id,
                    user_id,
                    stripe_subscription_id,
                    new_status,
                    starts_at,
                    ends_at,
                    user['created_at']
                ))
                new_conn.commit()
                state.subscriptions_processed += 1
                logger.info(f"Migrated subscription for user {user_id}")
                
            except Exception as e:
                new_conn.rollback()
                state.failed_subscriptions.append({
                    'user_id': str(user.get('id', 'unknown')),
                    'error': str(e)
                })
                state.subscriptions_failed += 1
                logger.error(f"Error migrating subscription for user {user.get('id')}: {e}")
        
        old_cursor.close()
        new_cursor.close()
        
    except Exception as e:
        logger.error(f"Subscription migration failed: {e}")
        raise


def migrate_avatars(
    old_conn: Any,
    new_conn: Any,
    old_s3_client: Any,
    new_s3_client: Any,
    config: MigrationConfig,
    state: MigrationState,
    user_id_filter: Optional[str] = None
):
    logger.info("Starting avatar migration...")
    
    try:
        old_cursor = old_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        new_cursor = new_conn.cursor()
        
        query = "SELECT * FROM avatar"
        params = []
        
        if user_id_filter:
            query += " WHERE user_id = %s"
            params.append(user_id_filter)
        
        old_cursor.execute(query, params)
        avatars = old_cursor.fetchall()
        logger.info(f"Found {len(avatars)} avatars to migrate")
        
        for avatar in avatars:
            try:
                avatar_id = avatar['id']
                user_id = avatar['user_id']
                
                old_cursor_files = old_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
                new_cursor_db = new_conn.cursor()
                
                gender = map_avatar_gender(avatar.get('gender', 'other'))
                status = map_avatar_status(avatar.get('status', 'available'))
                
                old_metadata = avatar.get('metadata', {}) or {}
                training_metadata = {
                    'isOriginal': old_metadata.get('isOriginal', True),
                }
                
                new_cursor_db.execute("""
                    INSERT INTO avatar (id, user_id, owner_id, name, storage_key, training_metadata, status, gender, created_at, trained_at, deleted_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, (
                    avatar_id,
                    user_id,
                    user_id,
                    avatar['name'],
                    f"{user_id}/avatars/{config.ENVIRONMENT}/{avatar_id}",
                    json.dumps(training_metadata),
                    status,
                    gender,
                    avatar['created_at'],
                    avatar['created_at'],
                    None
                ))
                new_conn.commit()
                state.avatars_processed += 1
                logger.info(f"Migrated avatar {avatar_id} for user {user_id}")
                
            except Exception as e:
                new_conn.rollback()
                state.failed_avatars.append({
                    'avatar_id': str(avatar.get('id', 'unknown')),
                    'user_id': str(avatar.get('user_id', 'unknown')),
                    'error': str(e)
                })
                state.avatars_failed += 1
                logger.error(f"Error migrating avatar {avatar.get('id')}: {e}")
        
        old_cursor.close()
        new_cursor.close()
        
    except Exception as e:
        logger.error(f"Avatar migration failed: {e}")
        raise


def find_root_image(
    old_cursor: Any,
    image_id: str,
    visited: set = None
) -> Optional[str]:
    if visited is None:
        visited = set()
    
    if image_id in visited:
        return None
    visited.add(image_id)
    
    old_cursor.execute("SELECT version_parent_id FROM generated_image WHERE id = %s", (image_id,))
    result = old_cursor.fetchone()
    
    if not result or result[0] is None:
        return image_id
    
    return find_root_image(old_cursor, result[0], visited)


def calculate_depth(
    old_cursor: Any,
    image_id: str,
    visited: set = None
) -> int:
    if visited is None:
        visited = set()
    
    if image_id in visited:
        return 0
    visited.add(image_id)
    
    old_cursor.execute("SELECT version_parent_id FROM generated_image WHERE id = %s", (image_id,))
    result = old_cursor.fetchone()
    
    if not result or result[0] is None:
        return 0
    
    return 1 + calculate_depth(old_cursor, result[0], visited)


def map_status(old_status: str) -> str:
    status_map = {
        'completed': 'GENERATED',
        'pending': 'DRAFT',
        'failed': 'FAILED'
    }
    return status_map.get(old_status, 'DRAFT')


def map_avatar_gender(old_gender: str) -> str:
    gender_map = {
        'male': 'MALE',
        'female': 'FEMALE',
        'other': 'OTHER'
    }
    return gender_map.get(old_gender.lower(), 'OTHER')


def map_avatar_status(old_status: str) -> str:
    status_map = {
        'available': 'TRAINED',
        'training': 'TRAINING',
        'failed': 'FAILED'
    }
    return status_map.get(old_status.lower(), 'TRAINING')


def map_image_type(old_type: str) -> str:
    type_map = {
        'background': 'BACKGROUND',
        'character': 'CHARACTER',
        'avatar': 'CHARACTER',
        'composition': 'THUMBNAIL',
        'all': 'GENERATION'
    }
    return type_map.get(old_type.lower(), 'GENERATION')


def map_subscription_status(old_status: str) -> str:
    status_map = {
        'active': 'ACTIVE',
        'cancelled': 'CANCELLED',
        'inactive': 'EXPIRED'
    }
    return status_map.get(old_status.lower(), 'EXPIRED')


def get_manual_tier_mapping() -> Dict[int, int]:
    """
    Manual mapping of old tier IDs to new tier IDs.
    Update this dictionary with the correct mappings for your databases.
    
    Format: {old_tier_id: new_tier_id}
    
    Current new tier IDs (from tier-seed.sql):
    - 3: KiThumbs Pro
    - 5: KiThumbs Max
    - 7: KiThumbs Plus
    """
    return {
        4: 7,
        5: 5,
        6: 3,
    }


def map_tier_id(old_tier_id: int, old_conn: Any, new_conn: Any) -> Optional[int]:
    tier_mapping = get_manual_tier_mapping()
    
    if old_tier_id in tier_mapping:
        new_tier_id = tier_mapping[old_tier_id]
        logger.debug(f"Mapped tier {old_tier_id} -> {new_tier_id}")
        return new_tier_id
    else:
        logger.warning(f"No mapping found for old tier ID {old_tier_id}")
        return None


def map_generation_metadata(version_data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not version_data:
        return None
    
    return {
        'prompt': version_data.get('prompt'),
        'model': version_data.get('model'),
        'steps': version_data.get('steps'),
        'guidanceScale': version_data.get('guidanceScale'),
        'strength': version_data.get('strength'),
        'seed': version_data.get('seed'),
        'size': version_data.get('size'),
        'aspectRatio': version_data.get('aspectRatio'),
    }


def migrate_images(
    old_conn: Any,
    new_conn: Any,
    old_s3_client: Any,
    new_s3_client: Any,
    config: MigrationConfig,
    state: MigrationState,
    user_id_filter: Optional[str] = None
):
    logger.info("Starting image migration...")
    
    try:
        old_cursor = old_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        new_cursor = new_conn.cursor()
        
        query = "SELECT * FROM generated_image"
        params = []
        
        if user_id_filter:
            query += " WHERE user_id = %s"
            params.append(user_id_filter)
        
        old_cursor.execute(query, params)
        images = old_cursor.fetchall()
        logger.info(f"Found {len(images)} images to migrate")
        
        for image in images:
            try:
                image_id = image['id']
                user_id = image['user_id']
                old_image_type = image['type']
                image_type = map_image_type(old_image_type)
                
                root_id = None
                parent_id = image.get('version_parent_id')
                depth = 0
                
                old_metadata = image.get('metadata', {}) or {}
                image_metadata = {
                    'isFavorite': old_metadata.get('isFavorite', False),
                    'rating': old_metadata.get('rating', 0),
                    'isFinalThumbnail': old_metadata.get('isFinalThumbnail', False),
                    'styleId': old_metadata.get('styleId'),
                    'versionBranch': image.get('version_branch'),
                    'versionMessage': image.get('version_message'),
                    'cost': image.get('cost', -1),
                    'isPrimary': image.get('is_primary', True),
                    'expirationDate': str(image.get('expiration_date')) if image.get('expiration_date') else None,
                }
                
                version_data = old_metadata.get('versionData', {}) or {}
                generation_metadata = map_generation_metadata(version_data if version_data else None)
                
                new_storage_key = f"{user_id}/images/{config.ENVIRONMENT}/{old_image_type}/{image_id}.png"
                
                new_cursor.execute("""
                    INSERT INTO image (id, state, is_public, user_id, storage_key, type, metadata, generation_metadata, tool_id, project_id, branch_id, root_id, parent_id, depth, ordinal, created_at, deleted_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, (
                    image_id,
                    map_status(image['status']),
                    image.get('is_public', False),
                    user_id,
                    new_storage_key,
                    image_type,
                    json.dumps(image_metadata),
                    json.dumps(generation_metadata) if generation_metadata else None,
                    None,
                    None,
                    None,
                    root_id,
                    parent_id,
                    depth,
                    0,
                    image['created_at'],
                    None
                ))
                new_conn.commit()
                state.images_processed += 1
                logger.info(f"Migrated image {image_id} for user {user_id}")
                
            except Exception as e:
                new_conn.rollback()
                state.failed_images.append({
                    'image_id': str(image.get('id', 'unknown')),
                    'user_id': str(image.get('user_id', 'unknown')),
                    'error': str(e),
                    'error_type': 'database'
                })
                state.images_failed += 1
                logger.error(f"Error migrating image {image.get('id')}: {e}")
        
        old_cursor.close()
        new_cursor.close()
        
    except Exception as e:
        logger.error(f"Image migration failed: {e}")
        raise


def save_failed_records(state: MigrationState, output_file: str = "failed_records.json"):
    failed_records = {
        'timestamp': datetime.now().isoformat(),
        'avatars_failed': state.failed_avatars,
        'images_failed': state.failed_images,
        'users_failed': state.failed_users,
        'subscriptions_failed': state.failed_subscriptions,
        'summary': {
            'total_avatars_processed': state.avatars_processed,
            'total_avatars_failed': state.avatars_failed,
            'total_images_processed': state.images_processed,
            'total_images_failed': state.images_failed,
            'total_users_processed': state.users_processed,
            'total_users_failed': state.users_failed,
            'total_subscriptions_processed': state.subscriptions_processed,
            'total_subscriptions_failed': state.subscriptions_failed,
        }
    }
    
    output_path = Path(output_file)
    with open(output_path, 'w') as f:
        json.dump(failed_records, f, indent=2, default=str)
    
    logger.info(f"Failed records saved to {output_path}")


def validate_config(config: MigrationConfig):
    required_fields = [
        'OLD_DB_CONNECTION_STRING',
        'NEW_DB_CONNECTION_STRING',
        'OLD_AWS_ACCESS_KEY',
        'OLD_AWS_SECRET_KEY',
        'OLD_BUCKET',
        'NEW_AWS_ACCESS_KEY',
        'NEW_AWS_SECRET_KEY',
        'NEW_BUCKET',
    ]

    for field in required_fields:
        value = getattr(config, field)
        if not value or value.startswith('YOUR_'):
            logger.error(
                "Configuration error: %s is not set. Copy _db_migrations/.env.example to "
                "_db_migrations/.env and provide values locally (never commit .env).",
                field,
            )
            return False

    return True


def main():
    parser = argparse.ArgumentParser(description='Migrate database from old to new schema')
    parser.add_argument('--user-id', type=str, default=None, help='Optional user ID to filter migration')
    args = parser.parse_args()
    
    config = MigrationConfig()
    
    if not validate_config(config):
        logger.error("Configuration validation failed. Set the required environment variables (see .env.example).")
        sys.exit(1)
    
    state = MigrationState()
    
    logger.info("=== Starting Migration Process ===")
    if args.user_id:
        logger.info(f"Filtering migration to user: {args.user_id}")
    
    try:
        logger.info("Connecting to databases...")
        old_conn = get_db_connection(config.OLD_DB_CONNECTION_STRING)
        new_conn = get_db_connection(config.NEW_DB_CONNECTION_STRING)
        
        logger.info("Connecting to S3 buckets...")
        old_s3_client = get_s3_client(
            config.OLD_AWS_ACCESS_KEY,
            config.OLD_AWS_SECRET_KEY,
            config.OLD_AWS_REGION,
            credential_hint="OLD_AWS_ACCESS_KEY and OLD_AWS_SECRET_KEY",
        )
        new_s3_client = get_s3_client(
            config.NEW_AWS_ACCESS_KEY,
            config.NEW_AWS_SECRET_KEY,
            config.NEW_AWS_REGION,
            credential_hint="NEW_AWS_ACCESS_KEY and NEW_AWS_SECRET_KEY",
        )
        
        if config.MIGRATE_USERS:
            migrate_users(old_conn, new_conn, state, args.user_id)
        
        logger.info("=== Phase 1.5: Migrating Subscriptions ===")
        if config.MIGRATE_SUBSCRIPTIONS:
            logger.info("Validating database connections before subscription migration...")
            old_conn = ensure_connection(old_conn, config.OLD_DB_CONNECTION_STRING, "Phase 1 -> Phase 1.5 transition")
            new_conn = ensure_connection(new_conn, config.NEW_DB_CONNECTION_STRING, "Phase 1 -> Phase 1.5 transition")
            logger.info("Connections validated, proceeding with subscription migration...")
            migrate_subscriptions(old_conn, new_conn, config, state, args.user_id)
        
        logger.info("=== Phase 2: Copying Avatar Files ===")
        if config.COPY_AVATAR_FILES:
            old_cursor_users = old_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
            old_cursor_users.execute("SELECT DISTINCT user_id FROM avatar")
            users = old_cursor_users.fetchall()
            
            for user_row in users:
                user_id = user_row['user_id']
                if args.user_id and str(user_id) != args.user_id:
                    continue
                
                copied, failed = copy_avatar_files(
                    old_s3_client,
                    new_s3_client,
                    config.OLD_BUCKET,
                    config.NEW_BUCKET,
                    str(user_id),
                    config.ENVIRONMENT
                )
                if failed > 0:
                    logger.warning(f"User {user_id}: {copied} avatar files copied, {failed} failed")
                else:
                    logger.info(f"User {user_id}: {copied} avatar files copied")
            
            old_cursor_users.close()
        
        logger.info("=== Phase 3: Migrating Avatar Records ===")
        if config.MIGRATE_AVATARS:
            logger.info("Validating database connections before avatar migration...")
            old_conn = ensure_connection(old_conn, config.OLD_DB_CONNECTION_STRING, "Phase 2 -> Phase 3 transition")
            new_conn = ensure_connection(new_conn, config.NEW_DB_CONNECTION_STRING, "Phase 2 -> Phase 3 transition")
            logger.info("Connections validated, proceeding with avatar migration...")
            migrate_avatars(old_conn, new_conn, old_s3_client, new_s3_client, config, state, args.user_id)
        
        logger.info("=== Phase 4: Copying Image Files ===")
        if config.COPY_IMAGE_FILES:
            old_cursor_users2 = old_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
            old_cursor_users2.execute("SELECT DISTINCT user_id FROM generated_image")
            image_users = old_cursor_users2.fetchall()
            
            for user_row in image_users:
                user_id = user_row['user_id']
                if args.user_id and str(user_id) != args.user_id:
                    continue
                
                copied, failed = copy_image_files(
                    old_s3_client,
                    new_s3_client,
                    config.OLD_BUCKET,
                    config.NEW_BUCKET,
                    str(user_id),
                    config.ENVIRONMENT
                )
                if failed > 0:
                    logger.warning(f"User {user_id}: {copied} image files copied, {failed} failed")
                else:
                    logger.info(f"User {user_id}: {copied} image files copied")
            
            old_cursor_users2.close()
        
        logger.info("=== Phase 5: Migrating Image Records ===")
        logger.info("Validating database connections before image migration...")
        old_conn = ensure_connection(old_conn, config.OLD_DB_CONNECTION_STRING, "Phase 4 -> Phase 5 transition")
        new_conn = ensure_connection(new_conn, config.NEW_DB_CONNECTION_STRING, "Phase 4 -> Phase 5 transition")
        logger.info("Connections validated, proceeding with image migration...")
        
        if config.MIGRATE_IMAGES:
            migrate_images(old_conn, new_conn, old_s3_client, new_s3_client, config, state, args.user_id)
        
        old_conn.close()
        new_conn.close()
        
        logger.info("=== Migration Complete ===")
        logger.info(f"Users: {state.users_processed} processed, {state.users_failed} failed")
        logger.info(f"Subscriptions: {state.subscriptions_processed} processed, {state.subscriptions_failed} failed")
        logger.info(f"Avatars: {state.avatars_processed} processed, {state.avatars_failed} failed")
        logger.info(f"Images: {state.images_processed} processed, {state.images_failed} failed")
        
        save_failed_records(state)
        
        exit_code = 0 if (state.avatars_failed == 0 and state.images_failed == 0 and state.users_failed == 0 and state.subscriptions_failed == 0) else 1
        sys.exit(exit_code)
        
    except Exception as e:
        logger.error(f"Migration failed with error: {e}")
        save_failed_records(state)
        sys.exit(1)


if __name__ == "__main__":
    main()
