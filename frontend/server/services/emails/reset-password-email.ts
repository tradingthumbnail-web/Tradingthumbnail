import { getResetPasswordTemplate } from './templates/reset-password-template';
import { CLICKLAB_EMAIL_FROM, getResendClient, getCompiledTemplate, normalizeLocale, withEmailTemplateContext } from './client';
import type { Locale } from '~~/server/database/schemas/user.schema';

export async function sendResetPasswordEmail(email: string, username: string, userLocale: string | null | undefined, resetPasswordLink: string) {
    const resend = getResendClient();
    const locale: Locale = normalizeLocale(userLocale);

    console.log(' |- Sending reset password email to:', email);

    const template = getCompiledTemplate(`reset-password-${locale}`, () => getResetPasswordTemplate(locale));
    const htmlContent = template(withEmailTemplateContext({ username, email, resetPasswordLink }));

    let subject: string;
    switch (locale) {
        case 'es':
            subject = "ClickLab - Solicitud de restablecimiento de contraseña 🔒";
            break;
        case 'ca':
            subject = "ClickLab - Sol·licitud de restabliment de la contrasenya 🔒";
            break;
        case 'en':
        default:
            subject = "ClickLab - Password reset request 🔒";
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
        console.log(" |- Error sending reset password email");
        console.error("Error sending reset password email", error);
        throw createError({
            statusMessage: "Error sending reset password email: " + error,
            statusCode: 500
        });
    }
};