import type { Driver } from 'driver.js';

export const useAssetsTour = () => {
    const { t } = useI18n();

    const { openAssetModal, closeAssetModal } = useAsset();
    
    const { $driver } = useNuxtApp()
    const driver = $driver as Driver;

    const steps = [
        {
            element: '[data-tour="assets-page"]',
            popover: {
                title: t('driver.assets.page.title'),
                description: t('driver.assets.page.description'),
            },
        },
        {
            element: '[data-tour="upload-assets"]',
            popover: {
                title: t('driver.assets.upload.title'),
                description: t('driver.assets.upload.description'),
                onNextClick: async () => {
                    openAssetModal();
                    await nextTick();
                    driver.moveNext();
                },
            },
        },
        {
            element: '[data-tour="assets-modal"]',
            popover: {
                title: t('driver.assets.modal.title'),
                description: t('driver.assets.modal.description'),
                onNextClick: () => {
                    closeAssetModal();
                    driver.destroy();
                },
            },
        },
    ];

    return {
        steps,
    }
};