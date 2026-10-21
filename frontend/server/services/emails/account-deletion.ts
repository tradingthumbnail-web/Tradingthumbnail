import { getAccountDeletionTemplate } from './templates/account-deletion-template';
import { CLICKLAB_EMAIL_FROM, getResendClient, getCompiledTemplate, normalizeLocale, withEmailTemplateContext } from './client';
import type { Locale } from '~~/server/database/schemas/user.schema';

interface AccountDeletionEmailInput {
    email: string;
    username: string;
    userLocale: string | null | undefined;
}

export async function sendAccountDeletionEmail({ email, username, userLocale }: AccountDeletionEmailInput) {
    const resend = getResendClient();
    const locale: Locale = normalizeLocale(userLocale);

    console.log(' |- Sending account deletion email to:', email);

    const template = getCompiledTemplate(`account-deletion-${locale}`, () => getAccountDeletionTemplate(locale));
    const htmlContent = template(withEmailTemplateContext({ username, email }));

    let subject: string;
    switch (locale) {
        case 'es':
            subject = "Tu cuenta ha sido eliminada - ClickLab";
            break;
        case 'ca':
            subject = "La teva compta ha estat eliminada - ClickLab";
            break;
        case 'en':
        default:
            subject = "Your account has been deleted - ClickLab";
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
        console.error("Error sending account deletion email", error);
        throw createError({
            statusMessage: "Error sending account deletion email: " + error,
            statusCode: 500
        });
    }
};