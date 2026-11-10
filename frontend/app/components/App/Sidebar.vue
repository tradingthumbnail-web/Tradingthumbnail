<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-opacity duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="isDrawerOpen" class="fixed inset-0 z-40 lg:hidden" @click="closeDrawer">
                <div class="absolute inset-0 bg-base-300/80 backdrop-blur-md"></div>
            </div>
        </Transition>
        
        <Transition
            enter-active-class="transition-transform duration-250 ease-out"
            enter-from-class="-translate-x-full"
            enter-to-class="translate-x-0"
            leave-active-class="transition-transform duration-200 ease-in"
            leave-from-class="translate-x-0"
            leave-to-class="-translate-x-full"
        >
            <aside v-if="isDrawerOpen" class="fixed left-0 top-0 z-50 h-screen w-72 bg-[#070a0d]/98 backdrop-blur-2xl border-r border-white/10 lg:hidden flex flex-col shadow-2xl">
                <div class="flex items-center justify-between gap-3 px-5 py-5 border-b border-white/10">
                    <div class="flex items-center gap-3">
                        <img src="~/assets/img/clicklab-mark.svg" alt="ClickLab" class="w-8 h-8 drop-shadow-[0_0_12px_rgba(57,255,136,0.35)]" :draggable="false" />
                        <span class="text-lg font-bold tracking-tight"><span class="text-[var(--cl-neon)]">Click</span><span class="text-white">Lab</span></span>
                    </div>
                    <button
                        class="btn btn-ghost btn-sm btn-square text-white/60 hover:text-white hover:bg-white/10"
                        type="button"
                        @click="closeDrawer">
                        <Icon name="lucide:x" size="18" />
                    </button>
                </div>

                <nav class="flex-1 overflow-y-auto px-3 py-4">
                    <ul class="space-y-6">
                        <li v-for="section in sections" :key="section.id" :data-tour="`sidebar:${section.id}`">
                            <button type="button"
                                class="flex w-full items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors"
                                @click="userStore.toggleSidebarItem(section.id)" :aria-expanded="userStore.sidebar.items[section.id]">
                                <span>{{ section.label }}</span>
                                <Icon :name="userStore.sidebar.items[section.id] ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                                    class="transition-transform duration-200 text-white/30" size="12" />
                            </button>

                            <ul class="mt-2 space-y-1" v-show="userStore.sidebar.items[section.id]">
                                <li v-for="item in section.items" :key="item.to" :data-tour="item.dataTourKey ? item.dataTourKey : undefined">
                                    <NuxtLink :to="item.to" @click="closeDrawer" :aria-current="isItemActive(item.to) ? 'page' : undefined" :class="[
                                        'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                                        isItemActive(item.to)
                                            ? 'clicklab-sidebar-link-active'
                                            : 'clicklab-sidebar-link'
                                    ]">
                                        <Icon :name="item.icon" :class="[
                                            'transition-all duration-200 flex-shrink-0',
                                            isItemActive(item.to) ? 'scale-110 text-[var(--cl-neon)]' : 'text-white/60 group-hover:text-white group-hover:scale-105'
                                        ]" size="18" />
                                        <span class="flex-1">{{ item.label }}</span>
                                        <Icon name="lucide:chevron-right"
                                            class="text-white/20 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5" size="14" />
                                    </NuxtLink>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </nav>

                <div class="border-t border-white/10 p-4 bg-[#0a0e14]/60">
                    <div class="rounded-xl border border-white/8 bg-[#0d1219] p-3.5 shadow-sm">
                        <div class="mb-2 flex items-center justify-between text-xs">
                            <span class="text-white/50 font-medium">{{ $t('common.credits') }}</span>
                            <span class="text-white font-semibold tabular-nums text-sm">{{ creditsLabel }}</span>
                        </div>
                        <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div v-if="progressMax > 0" class="h-full bg-gradient-to-r from-[var(--cl-neon)] to-[var(--cl-cyan)] rounded-full transition-all duration-500" :style="{width: `${(progressValue / progressMax) * 100}%`}"></div>
                        </div>
                        <NuxtLink
                            v-if="!userStore.tier"
                            to="/settings/plans"
                            @click="closeDrawer"
                            class="clicklab-btn-primary !py-2 !text-xs w-full mt-3 justify-center"
                        >
                            <Icon name="lucide:sparkles" size="13" />
                            {{ $t('home.upgradePlan') }}
                        </NuxtLink>
                    </div>
                </div>

                <div class="border-t border-white/10 px-3 py-3">
                    <NuxtLink to="/settings"
                        @click="closeDrawer"
                        class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/5 hover:text-white">
                        <Icon name="lucide:settings" size="18" mode="svg" />
                        <span>{{ $t('header.settings') }}</span>
                    </NuxtLink>
                </div>
            </aside>
        </Transition>
    </Teleport>

    <aside :class="[
        'hidden lg:flex h-screen flex-col border-r border-white/8 bg-[#070a0d] transition-all duration-300 ease-out',
        userStore.sidebar.collapsed ? 'w-[72px]' : 'w-64'
    ]">
        <div class="flex items-center gap-3 px-4 py-5" :class="userStore.sidebar.collapsed ? 'justify-center' : 'justify-between'">
            <div class="flex items-center gap-3 overflow-hidden" v-if="!userStore.sidebar.collapsed">
                <img src="~/assets/img/clicklab-mark.svg" alt="ClickLab" class="w-8 h-8 flex-shrink-0 drop-shadow-[0_0_12px_rgba(57,255,136,0.35)]" :draggable="false" />
                <span class="text-lg font-bold tracking-tight whitespace-nowrap"><span class="text-[var(--cl-neon)]">Click</span><span class="text-white">Lab</span></span>
            </div>
            <button
                class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/60 transition-all hover:border-[var(--cl-neon)]/40 hover:text-[var(--cl-neon)] hover:bg-white/[0.08]"
                type="button" @click="userStore.toggleSidebar" :aria-expanded="!userStore.sidebar.collapsed">
                <Icon :name="userStore.sidebar.collapsed ? 'lucide:panel-right-open' : 'lucide:panel-left-close'" size="16" mode="svg" />
                <span class="sr-only">{{ $t('header.toggleSidebar') }}</span>
            </button>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 py-2">
            <ul class="space-y-6">
                <li v-for="section in sections" :key="section.id" :data-tour="`sidebar:${section.id}`">
                    <div v-if="!userStore.sidebar.collapsed">
                        <button type="button"
                            class="flex w-full items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors"
                            @click="userStore.toggleSidebarItem(section.id)" :aria-expanded="userStore.sidebar.items[section.id]">
                            <span>{{ section.label }}</span>
                            <Icon :name="userStore.sidebar.items[section.id] ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                                class="transition-transform duration-200 text-white/30" size="12" />
                        </button>
                    </div>
                    <div v-else class="h-px bg-white/5 mx-2 my-2"></div>

                    <ul :class="['mt-1.5', userStore.sidebar.collapsed ? 'space-y-1.5' : 'space-y-1']" v-show="userStore.sidebar.collapsed || userStore.sidebar.items[section.id]">
                        <li v-for="item in section.items" :key="item.to" :data-tour="item.dataTourKey ? item.dataTourKey : undefined">
                            <NuxtLink :to="item.to" :aria-current="isItemActive(item.to) ? 'page' : undefined" 
                                class="group relative block"
                                :class="userStore.sidebar.collapsed ? 'flex justify-center' : ''"
                                @mouseenter="userStore.sidebar.collapsed ? showSidebarTooltip($event, item.label) : null"
                                @mouseleave="userStore.sidebar.collapsed ? hideSidebarTooltip() : null">
                                <div :class="[
                                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                                    userStore.sidebar.collapsed ? 'justify-center w-11 h-11 mx-auto' : 'justify-start',
                                    isItemActive(item.to)
                                        ? 'clicklab-sidebar-link-active'
                                        : 'clicklab-sidebar-link'
                                ]">
                                    <Icon :name="item.icon" :class="[
                                        'transition-all duration-200 flex-shrink-0',
                                        isItemActive(item.to) ? 'scale-110 text-[var(--cl-neon)]' : 'text-white/60 group-hover:text-white group-hover:scale-105'
                                    ]" size="18" />
                                    <span v-if="!userStore.sidebar.collapsed" class="flex-1">{{ item.label }}</span>
                                    <span v-else class="sr-only">{{ item.label }}</span>
                                    <Icon v-if="!userStore.sidebar.collapsed" name="lucide:chevron-right"
                                        class="text-white/20 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5" size="14" />
                                </div>
                            </NuxtLink>
                        </li>
                    </ul>
                </li>
            </ul>
        </nav>

        <div class="border-t border-white/10 p-3 bg-[#0a0e14]/60 overflow-visible">
            <div class="rounded-xl border border-white/8 bg-[#0d1219] p-3 shadow-sm" :class="userStore.sidebar.collapsed ? 'flex flex-col items-center gap-1.5' : ''">
                <div v-if="!userStore.sidebar.collapsed" class="mb-2 flex items-center justify-between text-xs">
                    <span class="text-white/50 font-medium">{{ $t('common.credits') }}</span>
                    <span class="text-white font-semibold tabular-nums text-xs">{{ creditsLabel }}</span>
                </div>
                <template v-if="userStore.sidebar.collapsed">
                    <span class="text-[10px] font-bold tabular-nums text-white/80">{{ creditsLabel }}</span>
                    <div class="w-10 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div v-if="progressMax > 0" class="h-full bg-gradient-to-r from-[var(--cl-neon)] to-[var(--cl-cyan)] rounded-full transition-all duration-500" :style="{width: `${(progressValue / progressMax) * 100}%`}"></div>
                    </div>
                </template>
                <template v-else>
                    <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div v-if="progressMax > 0" class="h-full bg-gradient-to-r from-[var(--cl-neon)] to-[var(--cl-cyan)] rounded-full transition-all duration-500" :style="{width: `${(progressValue / progressMax) * 100}%`}"></div>
                    </div>
                </template>
            </div>
            <NuxtLink
                v-if="!userStore.tier && !userStore.sidebar.collapsed"
                to="/settings/plans"
                class="clicklab-btn-primary !py-2 !text-xs w-full mt-2.5 justify-center shadow-md hover:shadow-lg"
            >
                <Icon name="lucide:sparkles" size="13" />
                {{ $t('home.upgradePlan') }}
            </NuxtLink>
        </div>

        <div class="border-t border-white/10 px-3 py-3">
            <NuxtLink to="/settings"
                class="group relative block"
                :class="userStore.sidebar.collapsed ? 'flex justify-center' : ''"
                @mouseenter="userStore.sidebar.collapsed ? showSidebarTooltip($event, $t('header.settings')) : null"
                @mouseleave="userStore.sidebar.collapsed ? hideSidebarTooltip() : null">
                <div :class="[
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/5 hover:text-white',
                    userStore.sidebar.collapsed ? 'justify-center w-11 h-11 mx-auto' : 'justify-start'
                ]">
                    <Icon name="lucide:settings" size="18" mode="svg" />
                    <span v-if="!userStore.sidebar.collapsed">{{ $t('header.settings') }}</span>
                    <span v-else class="sr-only">{{ $t('header.settings') }}</span>
                </div>
            </NuxtLink>
        </div>
    </aside>

    <Teleport to="body">
        <Transition
            enter-active-class="transition-opacity duration-150"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="sidebarTooltip.show"
                class="fixed px-2.5 py-1.5 bg-base-100 text-sm font-medium rounded-md shadow-lg whitespace-nowrap z-[99999] border border-base-100/20 pointer-events-none"
                :style="{ left: sidebarTooltip.x + 'px', top: sidebarTooltip.y + 'px', transform: 'translateY(-50%)' }"
            >
                {{ sidebarTooltip.text }}
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
const { t } = useI18n();

const userStore = useUserStore();

const sections = [
    {
        id: 'workspace',
        label: t('sidebar.workspace.index'),
        items: [
            { label: t('sidebar.workspace.home'), to: '/home', icon: 'lucide:home' },
            { label: 'Trading studio', to: '/studio', icon: 'lucide:line-chart' },
            { label: t('sidebar.workspace.graph'), to: '/graph', icon: 'lucide:git-fork' }
        ]
    },
    {
        id: 'library',
        label: t('sidebar.library.index'),
        items: [
            { label: t('sidebar.library.archive'), to: '/archive', icon: 'lucide:archive' },
            { label: t('sidebar.library.assets'), to: '/assets', icon: 'lucide:package' },
            { label: t('sidebar.library.avatars'), to: '/avatars', icon: 'lucide:circle-user-round' }
        ]
    },
    {
        id: 'tools',
        label: t('sidebar.tools.index'),
        items: [
            { label: t('sidebar.tools.generation'), to: '/quick-generation', icon: 'lucide:zap', dataTourKey: 'sidebar:tools:quick-generation' },
            { label: t('sidebar.tools.instaThumb'), to: '/quick-thumb', icon: 'lucide:flame' },
            { label: t('sidebar.tools.sketch'), to: '/sketch', icon: 'lucide:pencil-line' },
            { label: t('sidebar.tools.pipeline'), to: '/pipeline', icon: 'lucide:workflow' },
            { label: t('sidebar.tools.chat'), to: '/chat', icon: 'lucide:message-circle' },
            { label: t('sidebar.tools.photoshoot'), to: '/photoshoot', icon: 'lucide:camera' },
            { label: t('sidebar.tools.imageToImage'), to: '/image-to-image', icon: 'lucide:image-plus' }
        ]
    }
];

const route = useRoute();
const { isDrawerOpen, openDrawer, closeDrawer } = useSidebar();

const sidebarTooltip = ref({ show: false, text: '', x: 0, y: 0 });
const showSidebarTooltip = (e: MouseEvent, text: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    sidebarTooltip.value = { show: true, text, x: rect.right + 8, y: rect.top + rect.height / 2 };
};
const hideSidebarTooltip = () => {
    sidebarTooltip.value.show = false;
};

const isItemActive = (path: string) => route.path === path;

watch(() => route.path, () => {
    closeDrawer();
});

// Credits progress
const currentCredits = computed(() => userStore.user?.credit ?? 0);
const maxCredits = computed(() => userStore.tier?.features?.maxCredits ?? 0);
const progressMax = computed(() => maxCredits.value || 0);
const progressValue = computed(() => progressMax.value > 0 ? Math.min(currentCredits.value, progressMax.value) : 0);
const creditsLabel = computed(() => {
	if (maxCredits.value > 0) {
		return `${currentCredits.value} / ${maxCredits.value}`;
	}
	return `${currentCredits.value}`;
});

onMounted(async () => {
	if (!userStore.user) {
		await userStore.getMe();
	}
});
</script>