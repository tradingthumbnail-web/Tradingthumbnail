import { eq, sql } from 'drizzle-orm';
import { verifyWebhookSignature } from '~~/server/utils/fal/decode-webhook-hash';
import { db } from '~~/server/database';
import { avatarTable } from '~~/server/database/schemas/avatar.schema';
import { userTable } from '~~/server/database/schemas/user.schema';
import { storage } from '~~/server/storage';
import { generateAvatarStorageKey, generateAvatarWeightsKey } from '~~/server/storage/keys';
import { sendAvatarTrainingCompleteEmail } from '~~/server/services/emails/avatar-training-complete';
import { log } from '~~/server/utils/logger';

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

        // 6. Handle the webhook response based on status
        if (webhookData.status === 'OK' && webhookData.payload) {
            console.log(' |- Training completed successfully');

            // 6.1. Download and store the LORA model file
            if (webhookData.payload.diffusers_lora_file?.url) {
                const loraUrl = webhookData.payload.diffusers_lora_file.url;
                console.log(' |- Downloading LORA model from:', loraUrl.slice(0, 50));

                try {
                    // Download the LORA file
                    const loraResponse = await fetch(loraUrl);
                    if (!loraResponse.ok) {
                        throw new Error(`Failed to download LORA file: ${loraResponse.status}`);
                    }
                    const loraBuffer = Buffer.from(await loraResponse.arrayBuffer());

                    // Store the LORA file
                    const weightsStorageKey = generateAvatarWeightsKey(avatar.userId, avatar.id);
                    await storage.put(
                        weightsStorageKey,
                        loraBuffer,
                        webhookData.payload.diffusers_lora_file.content_type || 'application/octet-stream'
                    );

                    console.log(' |- LORA model stored successfully');

                    // 6.2. Update avatar status to TRAINED
                    await db
                        .update(avatarTable)
                        .set({
                            status: 'TRAINED',
                            trainedAt: new Date(),
                            trainingMetadata: {
                                ...avatar.trainingMetadata,
                                requestId: webhookData.request_id,
                                loraFileUrl: weightsStorageKey,
                                completedAt: new Date().toISOString(),
                            },
                        })
                        .where(eq(avatarTable.id, avatar.id));

                    console.log(' |- Avatar status updated to TRAINED');

                    // 6.3. Send email notification to user
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
                } catch (error) {
                    console.error('Error downloading/storing LORA model:', error);
                    
                    // Update avatar status to FAILED
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
                        .where(eq(avatarTable.id, avatar.id));

                    throw error;
                }
            } else {
                console.error('No LORA file URL in webhook payload');
                
                // Update avatar status to FAILED
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
                    .where(eq(avatarTable.id, avatar.id));
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
                .where(eq(avatarTable.id, avatar.id));

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