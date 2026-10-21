import { generateEmailTemplate, type EmailContent } from './base-email-template';

export const getAvatarTrainingCompleteTemplate = (locale: string) => {
    const content: Record<string, EmailContent> = {
        es: {
            title: 'Tu avatar está listo',
            heading: '¡Tu avatar está listo! 🎉',
            content: [
                'Hola {{username}},',
                '¡Excelentes noticias! El entrenamiento de tu avatar "{{avatarName}}" ha finalizado con éxito y ya está disponible para usar en tus generaciones.',
                'Ahora puedes usar este avatar para crear miniaturas increíbles y personalizadas.'
            ],
            button: {
                text: 'Ver mi avatar',
                url: '{{appUrl}}/'
            }
        },
        en: {
            title: 'Your avatar is ready',
            heading: 'Your avatar is ready! 🎉',
            content: [
                'Hi {{username}},',
                'Great news! The training for your avatar "{{avatarName}}" has completed successfully and is now available to use in your generations.',
                'You can now use this avatar to create amazing and personalized thumbnails.'
            ],
            button: {
                text: 'View my avatar',
                url: '{{appUrl}}/'
            }
        },
        ca: {
            title: 'El teu avatar està llest',
            heading: 'El teu avatar està llest! 🎉',
            content: [
                'Hola {{username}},',
                'Bones notícies! L\'entrenament del teu avatar "{{avatarName}}" ha finalitzat amb èxit i ja està disponible per utilitzar en les teves generacions.',
                'Ara pots utilitzar aquest avatar per crear miniatures increïbles i personalitzades.'
            ],
            button: {
                text: 'Veure el meu avatar',
                url: '{{appUrl}}/'
            }
        }
    };

    return generateEmailTemplate(locale, content[locale] || content.en);
};