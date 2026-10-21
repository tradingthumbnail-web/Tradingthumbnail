import { generateEmailTemplate, type EmailContent } from './base-email-template';

export const getPaymentFailedToCancelledTemplate = (locale: string) => {
    const content: Record<string, EmailContent> = {
        es: {
            title: 'Tu suscripción ha sido cancelada',
            heading: 'Hola, {{username}}. Lamentamos comunicarte que tu suscripción ha sido cancelada 😔',
            content: [
                'Este correo ha sido enviado para confirmar que tu suscripción ha sido cancelada debido a que tras varios intentos, no hemos podido procesar tu pago. No te preocupes, tu acceso a ClickLab seguirá activo siempre, y tanto tus avatares como tus créditos seguirán disponibles.',
                'Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar con nuestro equipo de soporte en <a href="mailto:support@clicklab.app" style="color: #6C5DD3;">support@clicklab.app</a>.'
            ]
        },
        en: {
            title: 'Your subscription has been cancelled',
            heading: 'Hello {{username}}, your subscription has been cancelled 😔',
            content: [
                'This email has been sent to confirm that your subscription has been cancelled due to several attempts, we have not been able to process your payment. Don\'t worry, your access to ClickLab will remain active always, and both your avatars and your credits will remain available.',
                'If you have any questions or need help, please contact our support team at <a href="mailto:support@clicklab.app" style="color: #6C5DD3;">support@clicklab.app</a>.'
            ]
        },
        ca: {
            title: 'Problemes per processar la teva subscripció',
            heading: 'Hola, {{username}}. Lamentem comunicar-te que la teva subscripció ha estat cancel·lada 😔',
            content: [
                'Aquest correu electrònic ha estat enviat per confirmar que la teva subscripció ha estat cancel·lada ja que després de diversos intents no hem pogut processar el teu pagament. No et preocupis, el teu accés a ClickLab seguirà actiu sempre, i tant els teus avatars com els teus crèdits seguiran disponibles.',
                'Si tens alguna pregunta o necessites ajuda, no dubtis en contactar amb el nostre equip de suport en <a href="mailto:support@clicklab.app" style="color: #6C5DD3;">support@clicklab.app</a>.'
            ]
        }
    };

    return generateEmailTemplate(locale, content[locale] || content.en);
};
