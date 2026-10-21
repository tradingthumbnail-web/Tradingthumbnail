import { getSubscriptionActivationTemplate } from './templates/subscription-activation-template';
import { CLICKLAB_EMAIL_FROM, getResendClient, getCompiledTemplate, normalizeLocale, withEmailTemplateContext } from './client';
import type { Locale } from '~~/server/database/schemas/user.schema';

export async function sendSubscriptionActivationEmail(email: string, username: string, userLocale: string | null | undefined) {
    const resend = getResendClient();
    const locale: Locale = normalizeLocale(userLocale);

    console.log(' |- Sending subscription activation email to:', email);

    const template = getCompiledTemplate(`subscription-activation-${locale}`, () => getSubscriptionActivationTemplate(locale));
    const htmlContent = template(withEmailTemplateContext({ username, email }));

    let subject: string;
    switch (locale) {
        case 'es':
            subject = "Tu suscripción a ClickLab está activa 🚀";
            break;
        case 'ca':
            subject = "La teva subscripció a ClickLab està activa 🚀";
            break;
        case 'en':
        default:
            subject = "Your subscription to ClickLab is active 🚀";
            break;
    }

    try {
        await resend.emails.send({
            from: CLICKLAB_EMAIL_FROM,
            to: [email],
            subject: subject,
            html: htmlContent,
        });
    } catch (error) {
        console.error("Error sending subscription activation email", error);
        throw createError({
            statusMessage: "Error sending subscription activation email",
            statusCode: 500
        });
    }
};