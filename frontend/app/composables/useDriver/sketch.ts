export const useSketchTour = () => {
    const { t } = useI18n();

    const openAssetModalFromDriver = useState('sketch-open-asset-modal-from-driver', () => false);

    const steps = [
        {
            element: '[data-tour="sketch-page"]',
            popover: {
                title: t('driver.sketch.page.title'),
                description: t('driver.sketch.page.description'),
            },
        },
        {
            element: '[data-tour="sketch-canvas"]',
            popover: {
                title: t('driver.sketch.canvas.title'),
                description: t('driver.sketch.canvas.description'),
            },
        },
        {
            element: '[data-tour="sketch-add-elements"]',
            popover: {
                title: t('driver.sketch.addElement.title'),
                description: t('driver.sketch.addElement.description'),
            },
        },
        {
            element: '[data-tour="sketch-add-text"]',
            popover: {
                title: t('driver.sketch.addText.title'),
                description: t('driver.sketch.addText.description'),
            },
        },
        {
            element: '[data-tour="sketch-add-instruction"]',
            popover: {
                title: t('driver.sketch.addInstruction.title'),
                description: t('driver.sketch.addInstruction.description'),
            },
        },
        {
            element: '[data-tour="sketch-add-person"]',
            popover: {
                title: t('driver.sketch.addPerson.title'),
                description: t('driver.sketch.addPerson.description'),
            },
        },
        {
            element: '[data-tour="sketch-add-assets"]',
            popover: {
                title: t('driver.sketch.addAssets.title'),
                description: t('driver.sketch.addAssets.description'),
            },
        },
        {
            element: '[data-tour="sketch-forms"]',
            popover: {
                title: t('driver.sketch.forms.title'),
                description: t('driver.sketch.forms.description'),
            },
        },
        {
            element: '[data-tour="sketch-reference-type"]',
            popover: {
                title: t('driver.sketch.referenceType.title'),
                description: t('driver.sketch.referenceType.description'),
            },
        },
        {
            element: '[data-tour="sketch-style"]',
            popover: {
                title: t('driver.sketch.style.title'),
                description: t('driver.sketch.style.description'),
            },
        },
        {
            element: '[data-tour="sketch-generate"]',
            popover: {
                title: t('driver.sketch.generate.title'),
                description: t('driver.sketch.generate.description'),
            },
        },
    ];

    return {
        steps,
        openAssetModalFromDriver,
    }
}