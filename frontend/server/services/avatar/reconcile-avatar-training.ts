import { and, eq, ne } from 'drizzle-orm';
import { fal } from '@fal-ai/client';

import { db } from '~~/server/database';
import { avatarTable, type Avatar } from '~~/server/database/schemas/avatar.schema';
import { userTable } from '~~/server/database/schemas/user.schema';
import { storage } from '~~/server/storage';
import { generateAvatarWeightsKey } from '~~/server/storage/keys';
import { FAL_AVATAR_LORA_TRAINING_MODEL_ENDPOINT } from '~~/server/constants/avatar-training';
import { sendAvatarTrainingCompleteEmail } from '~~/server/services/emails/avatar-training-complete';
import { log } from '~~/server/utils/logger';

export interface FalLoraResultPayload {
    diffusers_lora_file?: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
    };
    config_file?: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
    };
    [key: string]: unknown;
}

const inFlightReconciliations = new Map<string, Promise<Avatar>>();

/**
 * Downloads the trained LoRA weights from FAL, uploads them to Cloudflare R2 at the
 * avatar's exact weights path, and only after the upload succeeds updates the avatar
 * database row to TRAINED.
 *
 * Uses a conditional `WHERE status != 'TRAINED'` update so that if a webhook callback
 * and reconciliation poll complete concurrently, only the first writer transitions the
 * row to TRAINED and sends the completion email.
 */
export async function persistCompletedAvatarWeights({
    avatar,
    requestId,
    loraUrl,
    contentType,
}: {
    avatar: Avatar;
    requestId: string;
    loraUrl: string;
    contentType?: string | null;
}): Promise<Avatar> {
    if (!loraUrl || typeof loraUrl !== 'string') {
        throw new Error('No LORA file URL in response');
    }

    const loraResponse = await fetch(loraUrl);
    if (!loraResponse.ok) {
        throw new Error(`Failed to download LORA file: ${loraResponse.status}`);
    }

    const loraBuffer = Buffer.from(await loraResponse.arrayBuffer());
    if (loraBuffer.byteLength === 0) {
        throw new Error('Downloaded LORA file is empty');
    }

    const weightsStorageKey = generateAvatarWeightsKey(avatar.userId, avatar.id, avatar.storageKey);
    await storage.put(
        weightsStorageKey,
        loraBuffer,
        contentType || 'application/octet-stream'
    );

    const trainedAt = new Date();
    const updatedMetadata = {
        ...(avatar.trainingMetadata ?? {}),
        requestId,
        loraFileUrl: weightsStorageKey,
        completedAt: trainedAt.toISOString(),
    };

    const updatedRows = await db
        .update(avatarTable)
        .set({
            status: 'TRAINED',
            trainedAt,
            trainingMetadata: updatedMetadata,
        })
        .where(
            and(
                eq(avatarTable.id, avatar.id),
                ne(avatarTable.status, 'TRAINED')
            )
        )
        .returning();

    const updatedAvatar = updatedRows[0];

    // Send completion email only when this call transitioned the row to TRAINED
    if (updatedAvatar) {
        try {
            const user = await db.query.userTable.findFirst({
                where: eq(userTable.id, avatar.userId),
            });

            if (user && user.email && user.username) {
                await sendAvatarTrainingCompleteEmail({
                    email: user.email,
                    username: user.username,
                    avatarName: avatar.name,
                    userLocale: user.locale,
                });
                log.info('Avatar training complete email sent', { userId: user.id, avatarId: avatar.id });
            } else {
                log.warn('Could not send email: user not found or missing email/username', { userId: avatar.userId });
            }
        } catch (emailError) {
            log.error('Failed to send avatar training complete email', emailError, { avatarId: avatar.id });
        }
    }

    return updatedAvatar ?? {
        ...avatar,
        status: 'TRAINED',
        trainedAt,
        trainingMetadata: updatedMetadata,
    };
}

async function performReconcileTrainingAvatar(avatar: Avatar): Promise<Avatar> {
    const metadata = (avatar.trainingMetadata ?? {}) as Record<string, unknown>;
    const requestId = typeof metadata.requestId === 'string' ? metadata.requestId.trim() : '';
    if (!requestId) {
        return avatar;
    }

    const config = useRuntimeConfig();
    const falApiKey = config.falApiKey;
    if (!falApiKey) {
        return avatar;
    }

    const modelEndpoint =
        typeof metadata.baseModel === 'string' && metadata.baseModel.trim().length > 0
            ? metadata.baseModel.trim()
            : FAL_AVATAR_LORA_TRAINING_MODEL_ENDPOINT;

    try {
        fal.config({ credentials: falApiKey });

        const queueStatus = await fal.queue.status(modelEndpoint, { requestId });
        const statusValue = String((queueStatus as { status?: string })?.status ?? '');

        if (statusValue === 'IN_QUEUE' || statusValue === 'IN_PROGRESS') {
            return avatar;
        }

        if (statusValue === 'COMPLETED') {
            const result = await fal.queue.result(modelEndpoint, { requestId });
            const payload = ((result as { data?: FalLoraResultPayload })?.data ?? result) as FalLoraResultPayload;
            const loraFile = payload?.diffusers_lora_file;

            if (!loraFile?.url) {
                const failedMetadata = {
                    ...metadata,
                    requestId,
                    error: 'No LORA file in response',
                    failedAt: new Date().toISOString(),
                };
                const [failedAvatar] = await db
                    .update(avatarTable)
                    .set({
                        status: 'FAILED',
                        trainingMetadata: failedMetadata,
                    })
                    .where(
                        and(
                            eq(avatarTable.id, avatar.id),
                            eq(avatarTable.status, 'TRAINING')
                        )
                    )
                    .returning();

                return failedAvatar ?? {
                    ...avatar,
                    status: 'FAILED',
                    trainingMetadata: failedMetadata,
                };
            }

            return await persistCompletedAvatarWeights({
                avatar,
                requestId,
                loraUrl: loraFile.url,
                contentType: loraFile.content_type,
            });
        }

        if (statusValue === 'FAILED' || statusValue === 'ERROR' || statusValue === 'CANCELLED') {
            const failedMetadata = {
                ...metadata,
                requestId,
                error: `Provider training status: ${statusValue}`,
                failedAt: new Date().toISOString(),
            };
            const [failedAvatar] = await db
                .update(avatarTable)
                .set({
                    status: 'FAILED',
                    trainingMetadata: failedMetadata,
                })
                .where(
                    and(
                        eq(avatarTable.id, avatar.id),
                        eq(avatarTable.status, 'TRAINING')
                    )
                )
                .returning();

            return failedAvatar ?? {
                ...avatar,
                status: 'FAILED',
                trainingMetadata: failedMetadata,
            };
        }

        return avatar;
    } catch (error) {
        log.warn('Failed to reconcile training avatar status with FAL', {
            avatarId: avatar.id,
            requestId,
            error: error instanceof Error ? error.message : String(error),
        });
        return avatar;
    }
}

/**
 * Reconciles a single avatar row that is currently in TRAINING status by checking
 * the FAL queue status. Deduplicates concurrent in-flight reconciliation requests
 * for the same avatar ID within the same runtime instance.
 */
export async function reconcileTrainingAvatar(avatar: Avatar): Promise<Avatar> {
    if (avatar.status !== 'TRAINING') {
        return avatar;
    }

    const existingPromise = inFlightReconciliations.get(avatar.id);
    if (existingPromise) {
        return await existingPromise;
    }

    const promise = performReconcileTrainingAvatar(avatar).finally(() => {
        inFlightReconciliations.delete(avatar.id);
    });
    inFlightReconciliations.set(avatar.id, promise);

    return await promise;
}

export async function reconcileTrainingAvatars(avatars: Avatar[]): Promise<Avatar[]> {
    if (!avatars.some((avatar) => avatar.status === 'TRAINING')) {
        return avatars;
    }

    return await Promise.all(
        avatars.map((avatar) => (avatar.status === 'TRAINING' ? reconcileTrainingAvatar(avatar) : avatar))
    );
}
