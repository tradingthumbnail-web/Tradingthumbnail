import { getPurchaseConfirmationTemplate } from './templates/purchase-confirmation-template';
import { CLICKLAB_EMAIL_FROM, getResendClient, getCompiledTemplate, normalizeLocale, withEmailTemplateContext } from './client';
import type { Locale } from '~~/server/database/schemas/user.schema';

export async function sendPurchaseConfirmationEmail({
    email,
    username,
    productName,
    amount,
    currency,
    receiptUrl,
    userLocale,
}: {
    email: string;
    username: string;
    productName: string;
    amount: number;
    currency: string;
    receiptUrl?: string | null;
    userLocale: string | null | undefined;
}) {
    if (!email || typeof email !== 'string') {
        throw new Error('Valid email address is required');
    }

    const resend = getResendClient();
    const locale: Locale = normalizeLocale(userLocale);

    console.log(' |- Sending purchase confirmation email to:', email);

    let subject: string;
    switch (locale) {
        case 'es':
            subject = "¡Gracias por tu compra en ClickLab! 🎉";
            break;
        case 'ca':
            subject = "Gràcies per la teva compra a ClickLab! 🎉";
            break;
        case 'en':
        default:
            subject = "Thank you for your purchase at ClickLab! 🎉";
            break;
    }

    const formattedAmount = new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'ca-ES', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100);

    const template = getCompiledTemplate(`purchase-confirmation-${locale}`, () => getPurchaseConfirmationTemplate(locale));
    const htmlContent = template(withEmailTemplateContext({
        email,
        username,
        productName,
        amount: formattedAmount,
        receiptUrl: receiptUrl || null,
    }));

    try {
        await resend.emails.send({
            from: CLICKLAB_EMAIL_FROM,
            to: [email],
            subject: subject,
            html: htmlContent,
        });
        console.log(' |- Purchase confirmation email sent successfully to:', email);
    } catch (error) {
        console.error('-x- Failed to send purchase confirmation email to', email, ':', error);
        throw error;
    }
};