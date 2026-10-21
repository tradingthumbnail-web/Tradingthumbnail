import { getValidationEmailTemplate } from './templates/verification-emails-templates';
import { CLICKLAB_EMAIL_FROM, getResendClient, getCompiledTemplate, normalizeLocale, withEmailTemplateContext } from './client';
import type { Locale } from '~~/server/database/schemas/user.schema';

export async function sendVerificationEmail(email: string, verificationLink: string, username: string, userLocale: string | null | undefined) {
    const resend = getResendClient();
    const locale: Locale = normalizeLocale(userLocale);

    console.log(' |- Sending verification email to:', email);

    const template = getCompiledTemplate(`verification-${locale}`, () => getValidationEmailTemplate(locale));
    const htmlContent = template(withEmailTemplateContext({ verificationLink, username, email }));

    let subject: string;
    switch (locale) {
        case 'es':
            subject = "¡Bienvenido a ClickLab! Por favor confirma tu email";
            break;
        case 'ca':
            subject = "Benvingut a ClickLab! Per favor confirma el teu email";
            break;
        case 'en':
        default:
            subject = "Welcome to ClickLab! Please confirm your email";
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
        console.error("Error sending verification email", error);
        throw createError({
            statusMessage: "Error sending verification email: " + error,
            statusCode: 500
        });
    }
};