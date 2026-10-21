import { getSuccessfulBillingCycleTemplate } from './templates/successfull-billing-cycle-template';
import { CLICKLAB_EMAIL_FROM, getResendClient, getCompiledTemplate, normalizeLocale, withEmailTemplateContext } from './client';
import type { Locale } from '~~/server/database/schemas/user.schema';

export async function sendEmailForBillingCycle({
    email,
    username,
    invoiceURL,
    userLocale,
}: {
    email: string;
    username: string;
    invoiceURL: string;
    userLocale: string | null | undefined;
}) {
    if (!email || typeof email !== 'string') {
        throw new Error('Valid email address is required');
    }

    const resend = getResendClient();
    const locale: Locale = normalizeLocale(userLocale);

    console.log(' |- Sending email for billing cycle to:', email);

    let subject: string;
    switch (locale) {
        case 'es':
            subject = "¡Tus créditos han sido actualizados!";
            break;
        case 'ca':
            subject = "Els teus crèdits se han recargat amb èxit!";
            break;
        case 'en':
        default:
            subject = "Your credits have been successfully recharged!";
            break;
    }

    const template = getCompiledTemplate(`billing-cycle-${locale}`, () => getSuccessfulBillingCycleTemplate(locale));
    const htmlContent = template(withEmailTemplateContext({ email, username, invoiceURL }));

    try {
        await resend.emails.send({
            from: CLICKLAB_EMAIL_FROM,
            to: [email],
            subject: subject,
            html: htmlContent,
        });
        console.log(' |- Email sent successfully to:', email);
    } catch (error) {
        console.error('-x- Failed to send email to', email, ':', error);
        throw error;
    }
};