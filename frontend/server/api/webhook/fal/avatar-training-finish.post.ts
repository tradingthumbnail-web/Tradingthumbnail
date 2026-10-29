import { and, eq, sql } from 'drizzle-orm';
import { verifyWebhookSignature } from '~~/server/utils/fal/decode-webhook-hash';
import { db } from '~~/server/database';
import { avatarTable } from '~~/server/database/schemas/avatar.schema';
import { persistCompletedAvatarWeights } from '~~/server/services/avatar/reconcile-avatar-training';

interface WebhookPayload {
    request_id: string;
    gateway_request_id: string;
    status: 'OK' | 'ERROR';
    payload?: {
        diffusers_lora_file?: {
            url: string;
            content_type: string;
            file_name: string;
            file_size: number;
        };
        config_file?: {
            url: string;
            content_type: string;
            file_name: string;
            file_size: number;
        };
        [key: string]: any;
    };
    payload_error?: string;
    error?: string;
}

export default defineEventHandler(async (event) => {
    try {
        // 1. Read the raw body and headers
        const bodyBuffer = await readRawBody(event, false);
        if (!bodyBuffer) {
            throw createError({
                statusMessage: 'No body provided',
                statusCode: 400,
            });
        }
        const signature = event.headers.get('x-fal-webhook-signature');
        const requestId = event.headers.get('x-fal-webhook-request-id');
        const userId = event.headers.get('x-fal-webhook-user-id');
        const timestamp = event.headers.get('x-fal-webhook-timestamp');

        // 2. Validate required headers
        if (!signature || !requestId || !userId || !timestamp) {
            console.error('Missing required webhook headers');
            throw createError({
                statusMessage: 'Missing required headers',
                statusCode: 400,
            });
        }

        // 3. Verify the webhook signature
        const isValid = await verifyWebhookSignature(
            requestId,
            userId,
            timestamp,
            signature,
            bodyBuffer
        );

        if (!isValid) {
            console.error('Invalid webhook signature');
            throw createError({
                statusMessage: 'Invalid signature',
                statusCode: 401,
            });
        }

        console.log('--- Webhook signature verified successfully');

        // 4. Parse the webhook payload
        const webhookData: WebhookPayload = JSON.parse(bodyBuffer.toString('utf-8'));
        console.log(' |- Webhook status:', webhookData.status);
        console.log(' |- Request ID:', webhookData.request_id);

        // 5. Find the avatar by request_id (stored in trainingMetadata)
        const avatar = await db.query.avatarTable.findFirst({
            where: sql`${avatarTable.trainingMetadata}->>'requestId' = ${webhookData.request_id}`,
        });

        if (!avatar) {
            console.error('Avatar not found for request_id:', webhookData.request_id);
            throw createError({
                statusMessage: 'Avatar not found',
                statusCode: 404,
            });
        }

        console.log(' |- Avatar found:', avatar.id);

        if (avatar.status === 'TRAINED') {
            console.log(' |- Avatar already marked TRAINED, skipping duplicate webhook processing');
            return {
                success: true,
                message: 'Avatar already trained',
            };
        }

        // 6. Handle the webhook response based on status
        if (webhookData.status === 'OK' && webhookData.payload) {
            console.log(' |- Training completed successfully');

            // 6.1. Download and store the LORA model file
            if (webhookData.payload.diffusers_lora_file?.url) {
                const loraUrl = webhookData.payload.diffusers_lora_file.url;
                console.log(' |- Downloading LORA model from:', loraUrl.slice(0, 50));

                try {
                    await persistCompletedAvatarWeights({
                        avatar,
                        requestId: webhookData.request_id,
                        loraUrl,
                        contentType: webhookData.payload.diffusers_lora_file.content_type,
                    });
                    console.log(' |- LORA model stored and avatar status updated to TRAINED');
                } catch (error) {
                    console.error('Error downloading/storing LORA model:', error);
                    
                    // Update avatar status to FAILED only if not already TRAINED
                    await db
                        .update(avatarTable)
                        .set({
                            status: 'FAILED',
                            trainingMetadata: {
                                ...avatar.trainingMetadata,
                                requestId: webhookData.request_id,
                                error: 'Failed to download or store LORA model',
                                failedAt: new Date().toISOString(),
                            },
                        })
                        .where(
                            and(
                                eq(avatarTable.id, avatar.id),
                                eq(avatarTable.status, 'TRAINING')
                            )
                        );

                    throw error;
                }
            } else {
                console.error('No LORA file URL in webhook payload');
                
                // Update avatar status to FAILED only if still TRAINING
                await db
                    .update(avatarTable)
                    .set({
                        status: 'FAILED',
                        trainingMetadata: {
                            ...avatar.trainingMetadata,
                            requestId: webhookData.request_id,
                            error: 'No LORA file in response',
                            failedAt: new Date().toISOString(),
                        },
                    })
                    .where(
                        and(
                            eq(avatarTable.id, avatar.id),
                            eq(avatarTable.status, 'TRAINING')
                        )
                    );
            }
        } else {
            // 6.3. Handle training failure
            console.error(' |- Training failed');
            console.error(' |- Error:', webhookData.error);
            console.error(' |- Payload error:', webhookData.payload_error);

            await db
                .update(avatarTable)
                .set({
                    status: 'FAILED',
                    trainingMetadata: {
                        ...avatar.trainingMetadata,
                        requestId: webhookData.request_id,
                        error: webhookData.error || webhookData.payload_error || 'Training failed',
                        failedAt: new Date().toISOString(),
                    },
                })
                .where(
                    and(
                        eq(avatarTable.id, avatar.id),
                        eq(avatarTable.status, 'TRAINING')
                    )
                );

            console.log(' |- Avatar status updated to FAILED');
        }

        // 7. Return success response
        return {
            success: true,
            message: 'Webhook processed successfully',
        };
    } catch (error) {
        console.error('Error processing webhook:', error);
        throw createError({
            statusMessage: 'Internal server error processing webhook',
            statusCode: 500,
        });
    }
});