import { generateEmailTemplate, type EmailContent } from './base-email-template';

export const getSubscriptionActivationTemplate = (locale: string) => {
    const content: Record<string, EmailContent> = {
        es: {
            title: 'Tu suscripción está activa',
            heading: '¡Tu suscripción a ClickLab está activa!',
            content: [
                'Muchas gracias por tu compra. Tu suscripción a ClickLab Pro ya está activa y puedes comenzar a disfrutar de todas las funciones premium para crear miniaturas impactantes que aumenten tus visualizaciones.'
            ],
            button: {
                text: 'Acceder a ClickLab',
                url: '{{appUrl}}/'
            }
        },
        en: {
            title: 'Your subscription is active',
            heading: 'Your subscription to ClickLab is active!',
            content: [
                'Thank you for your purchase. Your subscription to ClickLab is active and you can start enjoying all the premium features to create impactful thumbnails that increase your views.'
            ],
            button: {
                text: 'Access ClickLab',
                url: '{{appUrl}}/'
            }
        },
        ca: {
            title: 'La teva subscripció a ClickLab està activa',
            heading: 'La teva subscripció a ClickLab està activa!',
            content: [
                'Gràcies per la teva compra. La teva subscripció a ClickLab està activa i pots començar a gaudir de totes les funcions premium per crear miniatures impressionants que augmenten les teves visualitzacions.'
            ],
            button: {
                text: 'Accedeix a ClickLab',
                url: '{{appUrl}}/'
            }
        }
    };

    return generateEmailTemplate(locale, content[locale] || content.en);
};
