<template>
    <header class="sticky top-0 z-10 border-b border-white/8 bg-[#0a0e12]/95 backdrop-blur-md" :class="{ 'backdrop-blur-none': isQuickGenModalOpen }">
        <div v-if="impersonateStore.isImpersonating" class="bg-warning/10 border-b border-warning/20 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div class="flex items-center gap-2.5 text-warning text-sm font-medium">
                <Icon name="lucide:alert-circle" class="h-4 w-4" />
                <span>Impersonating <strong>{{ impersonateStore.targetUser?.name }}</strong> ({{ impersonateStore.targetUser?.email }})</span>
            </div>
            <button 
                type="button"
                class="btn btn-sm btn-ghost gap-1.5 hover:bg-warning/20"
                @click="stopImpersonating"
            >
                <Icon name="lucide:log-out" class="h-4 w-4" />
                Exit
            </button>
        </div>
        <div v-if="demoAuth.isActive.value" class="border-b border-[var(--cl-neon)]/20 bg-[var(--cl-neon)]/5 px-4 py-1.5 text-center text-xs text-[var(--cl-neon)]">
            Demo UI session — API calls will not persist real data
        </div>
        <div class="navbar min-h-[4rem] px-4 sm:px-6 w-full">
            <div class="navbar-start gap-2">
                <button
                    type="button"
                    class="btn btn-ghost btn-square lg:hidden"
                    @click="openSidebar"
                    aria-label="Open menu"
                >
                    <Icon name="lucide:menu" size="20" />
                </button>
                <nav class="breadcrumbs text-sm">
                    <ul class="gap-1.5 flex-wrap">
                        <li>
                            <NuxtLink to="/home" class="flex items-center gap-1.5 text-base-content/50 hover:text-base-content transition-colors">
                                <Icon name="lucide:home" class="h-4 w-4" />
                                <span class="hidden sm:inline font-medium">{{ t('header.home') }}</span>
                            </NuxtLink>
                        </li>
                        <li v-for="crumb in breadcrumbs" :key="crumb.path">
                            <NuxtLink v-if="!crumb.current" :to="crumb.path"
                                class="capitalize text-base-content/50 hover:text-base-content transition-colors font-medium">
                                {{ crumb.label }}
                            </NuxtLink>
                            <span v-else class="capitalize text-base-content font-semibold">{{ crumb.label }}</span>
                        </li>
                    </ul>
                </nav>
            </div>
            
            <div class="navbar-end gap-2 sm:gap-3">
                <button type="button"
                    class="btn btn-sm h-10 px-3 sm:px-4 bg-base-100/50 border border-base-100/30 hover:bg-base-100/80 hover:border-base-100/50 text-base-content/70 hover:text-base-content gap-2 sm:gap-3 rounded-xl transition-all shadow-sm"
                    @click="openQuickGen" data-tour="model-selector-button">
                    <Icon name="lucide:zap" class="h-4 w-4 text-primary" />
                    <span class="hidden sm:inline text-sm font-medium">{{ t('quickGenerationModal.title') }}</span>
                    <div class="hidden lg:flex items-center gap-1 text-[10px] text-base-content/40 bg-base-200/50 px-1.5 py-0.5 rounded">
                        <kbd class="font-mono">{{ shortcutPrimary }}</kbd>
                        <span>+</span>
                        <kbd class="font-mono">K</kbd>
                    </div>
                </button>

                <button type="button" class="btn btn-ghost btn-sm btn-square hidden sm:flex" @click="driver.resetTour(currentPage)">
                    <Icon name="lucide:help-circle" size="18" class="text-base-content/60" />
                </button>

                <div class="dropdown dropdown-end">
                    <div tabindex="0" role="button"
                        class="flex items-center gap-2.5 rounded-xl border border-base-100/20 bg-base-100/40 hover:bg-base-100/60 px-2.5 py-1.5 transition-all cursor-pointer">
                        <div class="hidden text-left sm:block">
                            <p class="text-sm font-semibold text-base-content leading-tight">{{ userStore.user?.name }}</p>
                            <p class="text-[11px] text-base-content/50 font-medium">{{ userStore.tier?.name ?? $t('common.free') }}</p>
                        </div>
                        <Icon name="lucide:chevron-down" class="h-4 w-4 text-base-content/40 hidden sm:block" />
                    </div>
                    <ul tabindex="0"
                        class="dropdown-content menu bg-base-100/95 backdrop-blur-xl rounded-xl z-[1] mt-2.5 w-60 p-2 shadow-xl border border-base-100/20">
                        <li class="menu-title px-3 py-2">
                            <span class="text-[10px] uppercase tracking-widest text-base-content/40 font-semibold">
                                {{ $t('header.account') }}
                            </span>
                        </li>
                        <li>
                            <button class="justify-between rounded-lg hover:bg-base-200/50" @click="navigateTo('/settings')">
                                <span class="truncate font-medium">{{ userStore.user?.name || $t('common.guestUser') }}</span>
                                <span class="badge badge-primary badge-sm font-medium">{{ userStore.tier?.name || $t('common.free') }}</span>
                            </button>
                        </li>
                        <li v-if="userStore.isAdmin">
                            <button class="justify-between rounded-lg hover:bg-base-200/50" @click="navigateTo('/2a87e77e-19a8-4448-9eeb-fa72c1e6e4a7')">
                                <span class="truncate font-medium">Admin panel</span>
                                <Icon name="lucide:shield" size="14" class="text-warning" />
                            </button>
                        </li>
                        <div class="divider my-1 h-px bg-base-200/50"></div>
                        <li>
                            <button @click="navigateTo('/changelog')" class="flex items-center w-full justify-between rounded-lg hover:bg-base-200/50">
                                <span class="font-medium">{{ $t('common.changelog.button') }}</span>
                                <span class="text-[11px] text-base-content/40 font-mono">{{ APP_VERSION }}</span>
                            </button>
                        </li>
                        <li>
                            <button @click="logout" class="text-error hover:bg-error/10 rounded-lg gap-2.5">
                                <Icon name="lucide:log-out" class="h-4 w-4" />
                                <span class="font-medium">{{ $t('header.logout') }}</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <AppQuickGenerationModal v-model="isQuickGenModalOpen" />
        
        <BaseChangelogModal ref="changelogModalRef" />
    </header>
</template>

<script setup lang="ts">
import { APP_VERSION } from '~~/server/constants/changelog';
import { useDriver, type KiThumbsDriverPage } from '~/composables/useDriver'

const driver = useDriver();
const route = useRoute();
const userStore = useUserStore();
const { t, locale } = useI18n();
const { posthog } = usePosthog();
const { checkForUpdates } = useChangelog();
const impersonateStore = useImpersonateStore();

const isQuickGenModalOpen = ref(false);
const shortcutPrimary = ref('Ctrl');
const changelogModalRef = ref<{ showModal: () => void; close: () => void } | null>(null);
const toast = useToast();
const demoAuth = useDemoAuth();
const { openDrawer: openSidebar } = useSidebar();

const breadcrumbs = computed(() => {
    const segments = route.path.split('/').filter(Boolean);

    return segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join('/')}`;
        const label = segment.replace(/[-_]/g, ' ');

        return {
            label,
            path,
            current: index === segments.length - 1
        };
    });
});

const userInitials = computed(() => {
    if (!userStore.user?.name) return 'GU';
    return userStore.user.name
        .split(' ')
        .filter(Boolean)
        .map((part: string) => part[0])
        .slice(0, 2)
        .join('') || 'GU';
});

const openQuickGen = () => {
    isQuickGenModalOpen.value = true;
};

const closeQuickGen = () => {
    isQuickGenModalOpen.value = false;
};

const toggleQuickGen = () => {
    isQuickGenModalOpen.value = !isQuickGenModalOpen.value;
};

const handleShortcut = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggleQuickGen();
    }

    if (event.key === 'Escape' && isQuickGenModalOpen.value) {
        closeQuickGen();
    }
};

const currentPage = computed(() => {
    return route.path as KiThumbsDriverPage;
});

onMounted(async () => {
    if (typeof navigator !== 'undefined') {
        shortcutPrimary.value = /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl';
    }

    window.addEventListener('keydown', handleShortcut);
    await userStore.getMe({ locale: locale.value });
    
    try {
        await impersonateStore.getImpersonationStatus();
    } catch (error) {
        console.error(error);
        impersonateStore.isImpersonating = false;
        impersonateStore.targetUser = null;
    }
    
    if (userStore.user) {
        posthog.identify(userStore.user.id, {
            name: userStore.user.name,
            email: userStore.user.email,
            tier: userStore.tier?.name,
        });
    }

    if (checkForUpdates()) {
        changelogModalRef.value?.showModal();
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleShortcut);
});

const logout = async () => {
    if (demoAuth.isActive.value) {
        await demoAuth.signOutDemoUi();
        return;
    }
    try {
        await $fetch('/api/v1/auth/logout', {
            method: 'POST',
        });
        userStore.cleanUser();
        await navigateTo('/');
    } catch (e) {
        console.error(e);
        toast.show({
            title: t('header.logout'),
            message: t('common.errors.generic') || 'Could not sign out. Please try again.',
            status: 'error',
        });
    }
};

const stopImpersonating = async () => {
    try {
        await impersonateStore.stopImpersonating();
        toast.show({
            title: 'Success',
            message: 'Exited impersonation',
            status: 'success',
        });
        await navigateTo('/login');
    } catch (error) {
        console.error('Failed to stop impersonating', error);
        toast.show({
            title: 'Error',
            message: 'Failed to exit impersonation',
            status: 'error',
        });
    }
};
</script>

<style scoped>
</style>