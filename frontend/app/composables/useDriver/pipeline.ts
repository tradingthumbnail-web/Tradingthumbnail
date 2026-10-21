export const usePipelineTour = () => {
    const { t } = useI18n();

    const steps = [
        {
            element: '[data-tour="pipeline-page"]',
            popover: {
                title: t('driver.pipeline.page.title'),
                description: t('driver.pipeline.page.description'),
            },
        },
        {
            element: '[data-tour="pipeline-header"]',
            popover: {
                title: t('driver.pipeline.header.title'),
                description: t('driver.pipeline.header.description'),
            },
        },
        {
            element: '[data-tour="pipeline-create"]',
            popover: {
                title: t('driver.pipeline.create.title'),
                description: t('driver.pipeline.create.description'),
            },
        },
        {
            element: '[data-tour="pipeline-cards"]',
            popover: {
                title: t('driver.pipeline.cards.title'),
                description: t('driver.pipeline.cards.description'),
            },
        },
    ];

    return {
        steps,
    };
};