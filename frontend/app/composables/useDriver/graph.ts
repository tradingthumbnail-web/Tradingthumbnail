export const useGraphTour = () => {
    const { t } = useI18n();

    const steps = [
        {
            element: '[data-tour="graph-header"]',
            popover: {
                title: t('driver.graph.header.title'),
                description: t('driver.graph.header.description'),
            },
        },
    ];

    return {
        steps,
    };
};