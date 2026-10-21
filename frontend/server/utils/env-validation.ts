import { log } from './logger';

const BOOT_REQUIRED_VARS = [
    'NUXT_DATABASE_CONNECTION_STRING',
] as const;

const FEATURE_REQUIRED_VARS = [
    'NUXT_GOOGLE_CLIENT_ID',
    'NUXT_GOOGLE_SECRET_ID',
    'NUXT_STRIPE_PUBLISHABLE_KEY',
    'NUXT_STRIPE_SECRET_KEY',
    'NUXT_STRIPE_WEBHOOK_SECRET_PAYMENT',
    'NUXT_STRIPE_WEBHOOK_SECRET_BILLING_CYCLE',
    'NUXT_STRIPE_WEBHOOK_SECRET_PAYMENT_FAILED',
    'NUXT_STRIPE_WEBHOOK_SECRET_CANCEL_SUBSCRIPTION',
    'NUXT_POLAR_ACCESS_TOKEN',
    'NUXT_POLAR_WEBHOOK_SECRET',
    'NUXT_S3_ACCESS_KEY_ID',
    'NUXT_S3_SECRET_ACCESS_KEY',
    'NUXT_S3_REGION',
    'NUXT_S3_BUCKET',
    'NUXT_S3_ENDPOINT',
    'NUXT_RESEND_API_KEY',
] as const;

export function validateEnvironmentVariables() {
    const missingBoot = BOOT_REQUIRED_VARS.filter((varName) => !process.env[varName]);

    if (missingBoot.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingBoot.join(', ')}\n` +
            'Please ensure all required environment variables are set before starting the application.'
        );
    }

    const missingFeatures = FEATURE_REQUIRED_VARS.filter((varName) => !process.env[varName]);
    if (missingFeatures.length > 0) {
        log.warn(
            `Missing feature environment variables (auth, billing, storage, email will fail until set): ${missingFeatures.join(', ')}`
        );
    }
}

