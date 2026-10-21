import { Resend } from "resend";
import Handlebars from 'handlebars';
import type { Locale } from '~~/server/database/schemas/user.schema';
import { CLICKLAB_SUPPORT_EMAIL } from '~~/shared/clicklab/brand';
export { CLICKLAB_EMAIL_FROM } from '~~/shared/clicklab/email';

export function getEmailAppUrl(): string {
    const config = useRuntimeConfig();
    return config.public.appUrl || 'http://localhost:3000';
}

export function withEmailTemplateContext<T extends Record<string, unknown>>(ctx: T): T & { appUrl: string } {
    return { ...ctx, appUrl: getEmailAppUrl() };
}

export { CLICKLAB_SUPPORT_EMAIL };

let resendClient: Resend | null = null;
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

export function getResendClient(): Resend {
    if (!resendClient) {
        const config = useRuntimeConfig();
        if (!config.resendApiKey) {
            throw new Error('Resend API key not configured');
        }
        resendClient = new Resend(config.resendApiKey);
    }
    return resendClient;
}

export function getCompiledTemplate(templateKey: string, templateGetter: () => string): HandlebarsTemplateDelegate {
    if (!templateCache.has(templateKey)) {
        const template = Handlebars.compile(templateGetter());
        templateCache.set(templateKey, template);
    }
    return templateCache.get(templateKey)!;
}

export function normalizeLocale(locale: string | null | undefined): Locale {
    if (locale === 'en' || locale === 'es' || locale === 'ca') {
        return locale;
    }
    return 'en';
};