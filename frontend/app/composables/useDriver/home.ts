export const useHomeTour = () => {
    const { t } = useI18n();

    const steps = [
        {
            element: '[data-tour="home-header"]',
            popover: {
                title: t('driver.home.header.title'),
                description: t('driver.home.header.description'),
                side: 'bottom' as const,
                align: 'start' as const,
            },
        },
        {
            element: '[data-tour="quick-actions"]',
            popover: {
                title: t('driver.home.quickActions.title'),
                description: t('driver.home.quickActions.description'),
                side: 'bottom' as const,
                align: 'start' as const,
            },
        },
        {
            element: '[data-tour="gallery"]',
            popover: {
                title: t('driver.home.gallery.title'),
                description: t('driver.home.gallery.description'),
                side: 'top' as const,
                align: 'start' as const,
            },
        },
        {
            element: '[data-tour="sidebar:workspace"]',
            popover: {
                title: t('driver.home.workspace.title'),
                description: t('driver.home.workspace.description'),
                side: 'bottom' as const,
                align: 'start' as const,
            },
        },
        {
            element: '[data-tour="sidebar:library"]',
            popover: {
                title: t('driver.home.library.title'),
                description: t('driver.home.library.description'),
                side: 'bottom' as const,
                align: 'start' as const,
            },
        },
        {
            element: '[data-tour="sidebar:tools"]',
            popover: {
                title: t('driver.home.tools.title'),
                description: t('driver.home.tools.description'),
                side: 'bottom' as const,
                align: 'start' as const,
            },
        },
        {
            element: '[data-tour="model-selector-button"]',
            popover: {
                title: t('driver.home.modelSelector.title'),
                description: t('driver.home.modelSelector.description'),
                side: 'bottom' as const,
                align: 'start' as const,
            },
        },
        // TODO: if we add paywall at the sign up page, we can add a more immersive tour for the user
        // {
        //     element: '[data-tour="sidebar:tools:quick-generation"]',
        //     popover: {
        //         title: t('driver.home.jumpToQuickGeneration.title'),
        //         description: t('driver.home.jumpToQuickGeneration.description'),
        //         side: 'bottom' as const,
        //         align: 'start' as const,
        //     },
        // },
    ];

    return {
        steps
    }
};