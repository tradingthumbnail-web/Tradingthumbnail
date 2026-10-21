export const usePipelineCreateTour = () => {
    const { t } = useI18n();

    const steps = [
        {
            element: '[data-tour="pipeline-create-page"]',
            popover: {
                title: t('driver.pipelineCreate.page.title'),
                description: t('driver.pipelineCreate.page.description'),
            },
        },
        {
            element: '[data-tour="pipeline-create-header"]',
            popover: {
                title: t('driver.pipelineCreate.header.title'),
                description: t('driver.pipelineCreate.header.description'),
            },
        },
        {
            element: '[data-tour="pipeline-create-form"]',
            popover: {
                title: t('driver.pipelineCreate.form.title'),
                description: t('driver.pipelineCreate.form.description'),
            },
        },
        {
            element: '[data-tour="pipeline-create-elements"]',
            popover: {
                title: t('driver.pipelineCreate.elements.title'),
                description: t('driver.pipelineCreate.elements.description'),
            },
        },
        {
            element: '[data-tour="pipeline-create-canvas"]',
            popover: {
                title: t('driver.pipelineCreate.canvas.title'),
                description: t('driver.pipelineCreate.canvas.description'),
            },
        },
        {
            element: '[data-tour="pipeline-create-save"]',
            popover: {
                title: t('driver.pipelineCreate.save.title'),
                description: t('driver.pipelineCreate.save.description'),
            },
        },
    ];

    return {
        steps,
    };
};