import { getSubscriptionCancellationTemplate } from './templates/subscription-cancellation-template';
import { CLICKLAB_EMAIL_FROM, getResendClient, getCompiledTemplate, normalizeLocale, withEmailTemplateContext } from './client';
import type { Locale } from '~~/server/database/schemas/user.schema';

export async function sendSubscriptionCancellationEmail(email: string, username: string, userLocale: string | null | undefined) {
    const resend = getResendClient();
    const locale: Locale = normalizeLocale(userLocale);

    console.log(' |- Sending subscription cancellation email to:', email);

    const template = getCompiledTemplate(`subscription-cancellation-${locale}`, () => getSubscriptionCancellationTemplate(locale));
    const htmlContent = template(withEmailTemplateContext({ username, email }));

    let subject: string;
    switch (locale) {
        case 'es':
            subject = "Nos da pena verte ir - ClickLab 😔";
            break;
        case 'ca':
            subject = "Ens dol que te'n vagis - ClickLab 😔";
            break;
        case 'en':
        default:
            subject = "We are sorry to see you go - ClickLab 😔";
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
        console.error("Error sending subscription cancellation email", error);
        throw createError({
            statusMessage: "Error sending subscription cancellation email: " + error,
            statusCode: 500
        });
    }
};