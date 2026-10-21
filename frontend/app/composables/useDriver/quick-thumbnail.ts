export const useQuickThumbnailTour = () => {
    const { t } = useI18n();

    const steps = [
        {
            element: '[data-tour="quick-thumbnail-page"]',
            popover: {
                title: t('driver.quickThumbnail.page.title'),
                description: t('driver.quickThumbnail.page.description'),
            },
        },
        {
            element: '[data-tour="quick-thumbnail-forms"]',
            popover: {
                title: t('driver.quickThumbnail.forms.title'),
                description: t('driver.quickThumbnail.forms.description'),
            },
        },
        {
            element: '[data-tour="quick-thumbnail-steps"]',
            popover: {
                title: t('driver.quickThumbnail.steps.title'),
                description: t('driver.quickThumbnail.steps.description'),
            },
        },
        {
            element: '[data-tour="quick-thumbnail-preview"]',
            popover: {
                title: t('driver.quickThumbnail.preview.title'),
                description: t('driver.quickThumbnail.preview.description'),
            },
        },
        {
            element: '[data-tour="quick-thumbnail-page"]',
            popover: {
                title: t('driver.quickThumbnail.generation.title'),
                description: t('driver.quickThumbnail.generation.description'),
            },
        },
    ];

    return {
        steps
    }
}