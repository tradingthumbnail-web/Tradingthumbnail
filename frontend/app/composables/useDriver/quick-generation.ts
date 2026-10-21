export const useQuickGenerationTour = () => {
    const { t } = useI18n();

    const steps = [
        {
            element: '[data-tour="quick-generation-page"]',
            popover: {
                title: t('driver.quickGeneration.page.title'),
                description: t('driver.quickGeneration.page.description'),
            },
        },
        {
            element: '[data-tour="quick-generation-forms"]',
            popover: {
                title: t('driver.quickGeneration.forms.title'),
                description: t('driver.quickGeneration.forms.description'),
            },
        },
        {
            element: '[data-tour="quick-generation-create"]',
            popover: {
                title: t('driver.quickGeneration.create.title'),
                description: t('driver.quickGeneration.create.description'),
            },
        },
        {
            element: '[data-tour="quick-generation-gallery"]',
            popover: {
                title: t('driver.quickGeneration.gallery.title'),
                description: t('driver.quickGeneration.gallery.description'),
            },
        },
    ]

    return {
        steps,
    }
}