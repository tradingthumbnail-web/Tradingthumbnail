import { FluxLoraPortraitTrainerInput } from "@fal-ai/client/endpoints";

export const AVATAR_TOKEN = 'kamusari';
export const FAL_AVATAR_LORA_TRAINING_MODEL_ENDPOINT = "fal-ai/flux-lora-portrait-trainer";

export const AVATAR_TRAINING_PARAMETERS = {
    learning_rate: 2e-4, // Updated to v2
    steps: 2000, // Updated to v3
    multiresolution_training: true,
    subject_crop: true,
    trigger_phrase: AVATAR_TOKEN,
} as FluxLoraPortraitTrainerInput;

// Decoding webhook hash from Fal
export const JWKS_URL = 'https://rest.alpha.fal.ai/.well-known/jwks.json';
export const JWKS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Hystorical values
export const HISTORICAL_VALUES = {
    learning_rate: {
        v2: 0.00009,
        v3: 2e-4,
    },
    steps: {
        v2: 2500,
        v3: 2000,
    },
} as const;