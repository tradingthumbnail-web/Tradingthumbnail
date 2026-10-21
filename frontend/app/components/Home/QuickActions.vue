<template>
    <section data-tour="quick-actions">
        <div class="mb-5">
            <h2 class="clicklab-display text-lg font-semibold text-white">{{ $t('home.quickActions.title') || 'Quick actions' }}</h2>
            <p class="mt-1 text-sm text-[var(--cl-text-muted)]">{{ $t('home.quickActions.subtitle') || 'Jump into a tool to begin.' }}</p>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NuxtLink
                v-for="action in actions"
                :key="action.to"
                :to="action.to"
                class="group relative flex h-48 flex-col overflow-hidden rounded-xl border border-white/8 bg-[var(--cl-bg-elevated)] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--cl-neon)]/25 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cl-neon)]"
            >
                <ClickLabHomeQuickActionVisual :variant="action.visual" />
                <div class="relative mt-auto border-t border-white/5 bg-[#0a0e12]/95 p-4">
                    <div class="flex items-start gap-2.5">
                        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[var(--cl-neon)]">
                            <Icon :name="action.icon" size="16" />
                        </span>
                        <div class="min-w-0">
                            <h3 class="text-sm font-semibold text-white group-hover:text-[var(--cl-neon)]">{{ action.title }}</h3>
                            <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--cl-text-muted)]">{{ action.description }}</p>
                        </div>
                    </div>
                </div>
            </NuxtLink>
        </div>
    </section>
</template>

<script setup lang="ts">
const { t } = useI18n()

const actions = computed(() => [
    {
        to: '/studio',
        visual: 'thumbnail' as const,
        icon: 'lucide:image-plus',
        title: t('home.quickActions.createThumbnail'),
        description: t('home.quickActions.createThumbnailDesc')
    },
    {
        to: '/sketch',
        visual: 'sketch' as const,
        icon: 'lucide:pencil-line',
        title: t('home.quickActions.aiSketch'),
        description: t('home.quickActions.aiSketchDesc')
    },
    {
        to: '/image-to-image',
        visual: 'img2img' as const,
        icon: 'lucide:image-plus',
        title: t('home.quickActions.imageToImage'),
        description: t('home.quickActions.imageToImageDesc')
    },
    {
        to: '/photoshoot',
        visual: 'photoshoot' as const,
        icon: 'lucide:camera',
        title: t('home.quickActions.photoshoot'),
        description: t('home.quickActions.photoshootDesc')
    }
])
</script>
