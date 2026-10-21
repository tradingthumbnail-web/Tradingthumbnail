export const useArchiveTour = () => {
    const { t } = useI18n();

    const steps = [
        {
            element: '[data-tour="archive-page"]',
            popover: {
                title: t('driver.archive.page.title'),
                description: t('driver.archive.page.description'),
            },
        },
        {
            element: '[data-tour="archive-filters"]',
            popover: {
                title: t('driver.archive.filters.title'),
                description: t('driver.archive.filters.description'),
            },
        },
    ];

    return {
        steps,
    };
};