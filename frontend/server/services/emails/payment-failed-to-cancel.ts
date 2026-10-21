import { getPaymentFailedToCancelledTemplate } from './templates/payment-failed-to-cancel-template';
import type { Locale } from '~~/server/database/schemas/user.schema';
import { CLICKLAB_EMAIL_FROM, getResendClient, getCompiledTemplate, normalizeLocale, withEmailTemplateContext } from './client';

export async function sendPaymentFailedToCancelledEmail(email: string, username: string, userLocale: Locale | null | undefined) {
    const resend = getResendClient();
    const locale: Locale = normalizeLocale(userLocale);

    console.log(' |- Sending payment failed to cancelled email to:', email);

    const template = getCompiledTemplate(`payment-failed-cancel-${locale}`, () => getPaymentFailedToCancelledTemplate(locale));
    const htmlContent = template(withEmailTemplateContext({ username, email }));

    let subject: string;
    switch (locale) {
        case 'es':
            subject = "ClickLab - Tu suscripción ha sido cancelada 😔";
            break;
        case 'ca':
            subject = "ClickLab - La teva subscripció ha estat cancel·lada 😔";
            break;
        case 'en':
        default:
            subject = "ClickLab - Your subscription has been cancelled 😔";
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
        console.log(" |- Error sending payment failed to cancelled email");
        console.error("Error sending payment failed to cancelled email", error);
        throw createError({
            statusMessage: "Error sending payment failed to cancelled email: " + error,
            statusCode: 500
        });
    }
};