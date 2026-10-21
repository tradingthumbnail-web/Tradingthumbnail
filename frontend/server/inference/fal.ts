import { fal } from '@fal-ai/client';

const config = useRuntimeConfig();
const falApi = config.falApiKey;
if (!falApi) {
    console.error('|-x- FAL API key is not set');
    throw createError({
        statusMessage: 'FAL API key is not set',
        statusCode: 500,
    });
};

fal.config({
    credentials: falApi
});

export default fal;