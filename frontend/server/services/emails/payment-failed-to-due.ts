import { getPaymentFailedToDueTemplate } from './templates/payment-failed-to-due-template';
import type { Locale } from '~~/server/database/schemas/user.schema';
import { CLICKLAB_EMAIL_FROM, getResendClient, getCompiledTemplate, normalizeLocale, withEmailTemplateContext } from './client';

export async function sendPaymentFailedToDueEmail(email: string, username: string, userLocale: Locale | null | undefined) {
    const resend = getResendClient();
    const locale: Locale = normalizeLocale(userLocale);

    console.log(' |- Sending payment failed to due email to:', email);

    const template = getCompiledTemplate(`payment-failed-due-${locale}`, () => getPaymentFailedToDueTemplate(locale));
    const htmlContent = template(withEmailTemplateContext({ username, email }));

    let subject: string;
    switch (locale) {
        case 'es':
            subject = "ClickLab - Problemas para procesar tu suscripción";
            break;
        case 'ca':
            subject = "ClickLab - Problemes per processar la teva subscripció";
            break;
        case 'en':
        default:
            subject = "ClickLab - Problems processing your subscription";
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
        console.log(" |- Error sending payment failed to due email");
        console.error("Error sending payment failed to due email", error);
        throw createError({
            statusMessage: "Error sending payment failed to due email: " + error,
            statusCode: 500
        });
    }
};