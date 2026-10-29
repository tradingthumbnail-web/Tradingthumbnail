const PROTECTED_TEAM_ALIAS_PATTERN = /^https?:\/\/tradingthumbnail-tradingthumbnail-8441\.vercel\.app\/?$/i;
const PUBLIC_PRODUCTION_ORIGIN = 'https://tradingthumbnail.vercel.app';

/**
 * Resolves a publicly reachable base URL for external webhooks (such as FAL).
 * Strips trailing slashes and normalizes the Vercel SSO-protected team alias
 * (`https://tradingthumbnail-tradingthumbnail-8441.vercel.app`) to the public
 * production alias (`https://tradingthumbnail.vercel.app`).
 */
export function resolvePublicWebhookBaseUrl(configuredAppUrl?: string | null): string {
    const raw = (configuredAppUrl ?? process.env.NUXT_PUBLIC_APP_URL ?? '').trim().replace(/\/+$/, '');
    if (!raw) {
        return PUBLIC_PRODUCTION_ORIGIN;
    }

    if (PROTECTED_TEAM_ALIAS_PATTERN.test(raw)) {
        return PUBLIC_PRODUCTION_ORIGIN;
    }

    return raw;
}

export function buildFalAvatarTrainingWebhookUrl(configuredAppUrl?: string | null): string {
    const baseUrl = resolvePublicWebhookBaseUrl(configuredAppUrl);
    return `${baseUrl}/api/webhook/fal/avatar-training-finish`;
}
