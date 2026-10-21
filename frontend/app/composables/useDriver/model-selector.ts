import type { Driver } from 'driver.js'

export const useModelSelectorTour = () => {
    const { t } = useI18n();
    const { $driver } = useNuxtApp();
    const driver = $driver as Driver;

    const steps = [
        {
            element: '[data-tour="model-selector-modal"]',
            popover: {
                title: t('driver.modelSelector.modal.title'),
                description: t('driver.modelSelector.modal.description'),
            },
        },
        {
            element: '[data-tour="model-selector-options"]',
            popover: {
                title: t('driver.modelSelector.options.title'),
                description: t('driver.modelSelector.options.description'),
            },
        },
        {
            element: '[data-tour="model-selector-confirm"]',
            popover: {
                title: t('driver.modelSelector.confirm.title'),
                description: t('driver.modelSelector.confirm.description'),
            },
        },
    ];

    const start = () => {
        driver.setSteps(steps);
        driver.drive();
    }

    return {
        start,
        steps,
    }
};