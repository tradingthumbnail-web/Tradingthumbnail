import { getAvatarTrainingCompleteTemplate } from './templates/avatar-training-complete-template';
import { CLICKLAB_EMAIL_FROM, getResendClient, getCompiledTemplate, normalizeLocale, withEmailTemplateContext } from './client';
import type { Locale } from '~~/server/database/schemas/user.schema';

export async function sendAvatarTrainingCompleteEmail({
    email,
    username,
    avatarName,
    userLocale,
}: {
    email: string;
    username: string;
    avatarName: string;
    userLocale: string | null | undefined;
}) {
    if (!email || typeof email !== 'string') {
        throw new Error('Valid email address is required');
    }

    const resend = getResendClient();
    const locale: Locale = normalizeLocale(userLocale);

    console.log(' |- Sending avatar training complete email to user', username);

    let subject: string;
    switch (locale) {
        case 'es':
            subject = "¡Tu avatar está listo! 🎉";
            break;
        case 'ca':
            subject = "El teu avatar està llest! 🎉";
            break;
        case 'en':
        default:
            subject = "Your avatar is ready! 🎉";
            break;
    }

    const template = getCompiledTemplate(`avatar-training-complete-${locale}`, () => getAvatarTrainingCompleteTemplate(locale));
    const htmlContent = template(withEmailTemplateContext({ email, username, avatarName }));

    try {
        await resend.emails.send({
            from: CLICKLAB_EMAIL_FROM,
            to: [email],
            subject: subject,
            html: htmlContent,
        });
        console.log(' |- Email sent successfully to user', username);
    } catch (error) {
        console.error('-x- Failed to send email', error);
        throw error;
    }
};