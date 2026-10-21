export const usePhotoshootTour = () => {
    const { t } = useI18n();

    const steps = [
        {
            element: '[data-tour="photoshoot-page"]',
            popover: {
                title: t('driver.photoshoot.page.title'),
                description: t('driver.photoshoot.page.description'),
            },
        },
        {
            element: '[data-tour="photoshoot-config"]',
            popover: {
                title: t('driver.photoshoot.config.title'),
                description: t('driver.photoshoot.config.description'),
            },
        },
        {
            element: '[data-tour="photoshoot-gallery"]',
            popover: {
                title: t('driver.photoshoot.gallery.title'),
                description: t('driver.photoshoot.gallery.description'),
            },
        },
    ];

    return {
        steps,
    }
}

