# Database Migration Script

This directory contains the migration script for transferring avatars and images from the old database schema to the new schema.

## Overview

The migration script (`migrate_old_db.py`) performs the following tasks:

1. **Avatar Migration**: Copies avatar files from old S3 storage to new S3 storage and inserts records into the new database
2. **Image Migration**: Migrates images from `generatedImageTable` to `imageTable`, including:
   - Field mapping and schema transformation
   - File copying from old to new S3 storage
   - Version tree structure preservation (maintains parent-child relationships and calculates depth)
   - Comprehensive error tracking

## Prerequisites

- Python 3.11+
- `uv` package manager
- AWS S3 credentials for both old and new AWS accounts
- PostgreSQL connection strings for both old and new databases

## Installation

Install dependencies using `uv`:

```bash
cd /path/to/kithumbs-app
uv sync
```

## Configuration

Copy the example env file and fill in real credentials. The script reads these from the environment (`os.environ`), loading `_db_migrations/.env` if present.

```bash
cp .env.example .env
```

Required variables (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `OLD_DB_CONNECTION_STRING` | Source Postgres |
| `NEW_DB_CONNECTION_STRING` | Destination Postgres |
| `OLD_AWS_ACCESS_KEY` / `OLD_AWS_SECRET_KEY` | Source S3 credentials |
| `OLD_AWS_REGION` / `OLD_BUCKET` | Source S3 region and bucket |
| `NEW_AWS_ACCESS_KEY` / `NEW_AWS_SECRET_KEY` | Destination S3 credentials |
| `NEW_AWS_REGION` / `NEW_BUCKET` | Destination S3 region and bucket |
| `ENVIRONMENT` | Object-key prefix (`production` or `development`) |

Never commit real credentials in Python source or Git history. If keys were ever pushed or shared, **deactivate them in AWS IAM immediately** and issue new access keys.

When explicit `OLD_*` / `NEW_*` keys are omitted, the script can use the standard boto3 credential chain (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, shared credentials file, or IAM role) only if validation allows empty keys for your run mode.

## Usage

### Full Migration

Migrate all avatars and images from all users:

```bash
uv run src/migrate_old_db.py
```

### User-Specific Migration

Migrate only avatars and images for a specific user:

```bash
uv run src/migrate_old_db.py --user-id <user-id>
```

Example:
```bash
uv run src/migrate_old_db.py --user-id 550e8400-e29b-41d4-a716-446655440000
```

## Migration Details

### Avatar Migration

- **Source Key Format**: `{user_id}/avatars-{environment}/{avatarId}`
- **Destination Key Format**: `{user_id}/avatars/{environment}/{avatarId}`
- **Database Schema**: Remains unchanged; only storage key is updated

### Image Migration

#### Field Mapping

| Old Field | New Field | Transformation |
|-----------|-----------|---|
| id | id | Direct copy |
| userId | userId | Direct copy |
| status | state | pending→DRAFT, completed→GENERATED, failed→FAILED |
| type | type | Direct copy (background, character, avatar, composition) |
| createdAt | createdAt | Direct copy |
| - | isPublic | Default to false |
| metadata.key | storageKey | Regenerated with new pattern |
| metadata | imageMetadata | All metadata preserved with additional fields |
| versionData | generationMetadata | Prompt, model, steps, etc. extracted and preserved |
| versionParentId | parentId | Direct copy (maintains direct parent) |
| - | rootId | Calculated by traversing parent chain backwards |
| versionNumber | depth | Calculated from parent chain depth |
| - | toolId, projectId, branchId | Set to NULL |
| - | ordinal | Set to 0 |

#### Version Tree Structure

The migration preserves the version tree structure from the old schema:
- Each image maintains its direct parent via `parentId`
- `rootId` is calculated by traversing the entire parent chain to find the root image
- `depth` is calculated as the distance from the root image
- This creates a navigable tree structure in the new schema

#### File Keys

- **Source Key Format**: `{user_id}/{type}s-{environment}/{imageId}.png`
- **Destination Key Format**: `{user_id}/images/{environment}/{type}/{imageId}.png`

## Output

Upon completion, the script generates a `failed_records.json` file containing:

- **avatars_failed**: List of avatars that failed migration with avatarId, userId, and error details
- **images_failed**: List of images that failed migration with imageId, userId, error type, and details
- **summary**: Total counts of processed and failed records

Example:
```json
{
  "timestamp": "2024-10-17T14:30:00.123456",
  "avatars_failed": [
    {
      "avatar_id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "660e8400-e29b-41d4-a716-446655440001",
      "error": "Failed to copy file from old S3",
      "old_key": "660e8400-e29b-41d4-a716-446655440001/avatars-production/550e8400-e29b-41d4-a716-446655440000",
      "new_key": "660e8400-e29b-41d4-a716-446655440001/avatars/production/550e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "images_failed": [],
  "summary": {
    "total_avatars_processed": 15,
    "total_avatars_failed": 1,
    "total_images_processed": 150,
    "total_images_failed": 0
  }
}
```

## Error Handling

The script uses comprehensive error handling:

- **File Copy Errors**: Logs warnings if source files don't exist; skips the record and continues
- **Database Errors**: Rolls back transactions on insert failures; records are logged for manual review
- **Connection Errors**: Fails immediately with clear error messages if database or S3 connections fail
- **Configuration Errors**: Validates all configuration before starting migration

All failed records are saved to `failed_records.json` for manual review and remediation.

## Exit Codes

- **0**: Migration completed successfully (no failures)
- **1**: Migration completed with failures or encountered an error

## Logs

The script outputs detailed logs to the console including:
- Connection status
- Migration progress (processed count, failure count)
- Individual record migration details
- Error messages with context

## Troubleshooting

### Connection Errors
- Verify database connection strings are correct and databases are accessible
- Check that firewall rules allow connections from your machine
- Ensure credentials have proper permissions

### AWS S3 Errors
- Verify AWS credentials are correct
- Check that buckets exist and are in the specified regions
- Ensure IAM policies allow `s3:GetObject` and `s3:PutObject` actions

### Missing Files
- Some source files may have been deleted; these are logged as warnings
- The script continues processing other records
- Review `failed_records.json` after migration completion

## Backup Recommendations

Before running the migration:
1. Backup both old and new databases
2. Backup both S3 buckets or create snapshots
3. Test migration on a staging environment first using the `--user-id` flag with a test user
