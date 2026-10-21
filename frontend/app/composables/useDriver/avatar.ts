import type { Driver } from 'driver.js';

export const useAvatarTour = () => {
    const { $driver } = useNuxtApp()
    const driver = $driver as Driver;
    const { t } = useI18n();

    const { showAvatarCreateModal } = useAvatar();

    const steps = [
        {
            element: '[data-tour="avatar-page"]',
            popover: {
                title: t('driver.avatar.page.title'),
                description: t('driver.avatar.page.description'),
            },
        },
        {
            element: '[data-tour="avatar-credits"]',
            popover: {
                title: t('driver.avatar.credits.title'),
                description: t('driver.avatar.credits.description'),
            },
        },
        {
            element: '[data-tour="avatar-create"]',
            popover: {
                title: t('driver.avatar.create.title'),
                description: t('driver.avatar.create.description'),
            },
        },
    ];

    return {
        steps,
    }
}