export const useImageToImageTour = () => {
    const { t } = useI18n();

    const steps = [
        {
            element: '[data-tour="image-to-image-page"]',
            popover: {
                title: t('driver.imageToImage.page.title'),
                description: t('driver.imageToImage.page.description'),
            },
        },
        {
            element: '[data-tour="image-to-image-config"]',
            popover: {
                title: t('driver.imageToImage.config.title'),
                description: t('driver.imageToImage.config.description'),
            },
        },
        {
            element: '[data-tour="image-to-image-viewer"]',
            popover: {
                title: t('driver.imageToImage.viewer.title'),
                description: t('driver.imageToImage.viewer.description'),
            },
        },
    ];

    return {
        steps,
    }
}

