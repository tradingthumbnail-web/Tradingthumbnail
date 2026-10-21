import type { Driver } from 'driver.js'

export const useEditorTour = () => {
    const { t } = useI18n();
    const { $driver } = useNuxtApp();
    const driver = $driver as Driver;

    const steps = [
        {
            element: '[data-tour="editor-page"]',
            popover: {
                title: t('driver.editor.page.title'),
                description: t('driver.editor.page.description'),
            },
        },
        {
            element: '[data-tour="editor-toolbar"]',
            popover: {
                title: t('driver.editor.toolbar.title'),
                description: t('driver.editor.toolbar.description'),
            },
        },
        {
            element: '[data-tour="editor-tools"]',
            popover: {
                title: t('driver.editor.tools.title'),
                description: t('driver.editor.tools.description'),
            },
        },
        {
            element: '[data-tour="editor-options"]',
            popover: {
                title: t('driver.editor.options.title'),
                description: t('driver.editor.options.description'),
            },
        },
        {
            element: '[data-tour="editor-canvas"]',
            popover: {
                title: t('driver.editor.canvas.title'),
                description: t('driver.editor.canvas.description'),
            },
        },
        {
            element: '[data-tour="editor-versions"]',
            popover: {
                title: t('driver.editor.versions.title'),
                description: t('driver.editor.versions.description'),
            },
        },
    ];

    const start = () => {
        driver.setSteps(steps);
        driver.drive();
    }

    return {
        start,
    }
}

