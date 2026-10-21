export const useChatTour = () => {
    const { t } = useI18n();

    const steps = [
        {
            element: '[data-tour="chat-page"]',
            popover: {
                title: t('driver.chat.page.title'),
                description: t('driver.chat.page.description'),
            },
        },
        {
            element: '[data-tour="chat-versions"]',
            popover: {
                title: t('driver.chat.versions.title'),
                description: t('driver.chat.versions.description'),
            },
        },
        {
            element: '[data-tour="chat-originals"]',
            popover: {
                title: t('driver.chat.originals.title'),
                description: t('driver.chat.originals.description'),
            },
        },
        {
            element: '[data-tour="chat-input"]',
            popover: {
                title: t('driver.chat.input.title'),
                description: t('driver.chat.input.description'),
            },
        },
    ];

    return {
        steps,
    }
}

