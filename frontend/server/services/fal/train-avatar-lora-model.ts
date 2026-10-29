import { fal } from '@fal-ai/client';

import { AVATAR_TRAINING_PARAMETERS, FAL_AVATAR_LORA_TRAINING_MODEL_ENDPOINT } from '~~/server/constants/avatar-training';
import { buildFalAvatarTrainingWebhookUrl } from '~~/server/utils/public-webhook-url';

// TODO: Canviar el fal client al general
export const trainAvatarLoraModel = async (zipPresignedUrl: string) => {
    const config = useRuntimeConfig();
    const falApi = config.falApiKey;
    if (!falApi) {
        console.error('|-x- FAL API key is not set');
        throw createError({
            statusMessage: 'FAL API key is not set',
            statusCode: 500,
        });
    };

    try {
        fal.config({
            credentials: falApi
        });

        // Construct the webhook URL
        const webhookUrl = buildFalAvatarTrainingWebhookUrl(config.public.appUrl);
        console.log(' |- Webhook URL:', webhookUrl);

        const response = await fal.queue.submit(FAL_AVATAR_LORA_TRAINING_MODEL_ENDPOINT, {
            input: {
                images_data_url: zipPresignedUrl,
                learning_rate: AVATAR_TRAINING_PARAMETERS.learning_rate,
                steps: AVATAR_TRAINING_PARAMETERS.steps,
                subject_crop: AVATAR_TRAINING_PARAMETERS.subject_crop,
                trigger_phrase: AVATAR_TRAINING_PARAMETERS.trigger_phrase,
                multiresolution_training: AVATAR_TRAINING_PARAMETERS.multiresolution_training
            },
            webhookUrl: webhookUrl
        });

        console.log(' |- Training request submitted, request_id:', response.request_id);
        return response.request_id;
    } catch (error) {
        console.error(error);
        throw createError({
            statusMessage: 'Failed to train avatar LORA model',
            statusCode: 500,
        });
    }
}