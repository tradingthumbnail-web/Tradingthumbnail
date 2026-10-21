import { CLICKLAB_PRODUCT_NAME } from './brand';

/**
 * Resend "from" header. The domain must match your Resend verified domain
 * (may still be kithumbs.com until DNS is migrated — product decision).
 */
export const CLICKLAB_EMAIL_FROM = `${CLICKLAB_PRODUCT_NAME} <no-reply@kithumbs.com>`;
