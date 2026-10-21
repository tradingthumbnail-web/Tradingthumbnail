<template>
    <section data-tour="gallery">
        <div class="mb-4 flex items-center justify-between gap-3">
            <div>
                <h2 class="clicklab-display text-lg font-semibold text-white">{{ $t('sidebar.workspace.lastGenerated') }}</h2>
                <p v-if="imageStore.images.length" class="mt-1 text-sm text-[var(--cl-text-muted)]">
                    {{ imageStore.images.length }} {{ $t('common.items') || 'items' }}
                </p>
            </div>
            <NuxtLink to="/archive" class="clicklab-btn-secondary !px-3 !py-1.5 !text-xs">
                {{ $t('common.seeAll') }}
                <Icon name="lucide:arrow-right" size="14" />
            </NuxtLink>
        </div>

        <div v-if="imageStore.loading && !imageStore.images.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            <div v-for="i in 6" :key="i" class="aspect-square animate-pulse rounded-xl bg-white/5" />
        </div>

        <div v-else-if="showDemoPreview" class="clicklab-dashboard-card p-5 sm:p-6">
            <ClickLabSharedSimulatedNotice
                class="mb-4"
                compact
                label="Demo UI"
                message="Sample thumbnails below — not loaded from your account or the server."
            />
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                <ClickLabSharedSampleThumbnailCard
                    v-for="item in demoPreviewItems"
                    :key="item.id"
                    :variant="item"
                    aspect="square"
                />
            </div>
            <div class="mt-5 flex flex-wrap gap-3">
                <NuxtLink to="/studio" class="clicklab-btn-primary !text-sm">Open demo studio</NuxtLink>
                <NuxtLink to="/quick-generation" class="clicklab-btn-secondary !text-sm">Try generation (live API)</NuxtLink>
            </div>
        </div>

        <div v-else-if="imageStore.error" class="clicklab-dashboard-card border border-red-500/20 p-5">
            <div class="flex gap-3 text-sm text-red-200/90">
                <Icon name="lucide:alert-circle" class="mt-0.5 shrink-0" size="18" />
                <div>
                    <p class="font-medium text-white">{{ $t('common.errors.title') || 'Could not load gallery' }}</p>
                    <p class="mt-1 text-[var(--cl-text-muted)]">{{ $t('common.errors.internalServerError') }}</p>
                </div>
            </div>
        </div>

        <div v-else-if="!imageStore.images.length" class="clicklab-dashboard-card p-8 text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Icon name="lucide:image" class="text-[var(--cl-text-muted)]" size="28" />
            </div>
            <h3 class="clicklab-display text-base font-semibold text-white">{{ $t('common.empty') || 'No images yet' }}</h3>
            <p class="mx-auto mt-2 max-w-sm text-sm text-[var(--cl-text-muted)]">{{ $t('home.quickActions.createThumbnailDesc') }}</p>
            <NuxtLink to="/quick-generation" class="clicklab-btn-primary mt-5 inline-flex !text-sm">
                <Icon name="lucide:zap" size="16" />
                {{ $t('home.quickActions.createThumbnail') }}
            </NuxtLink>
        </div>

        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            <NuxtLink
                v-for="img in imageStore.visibleImages"
                :key="img.id"
                :to="`/images/${img.id}`"
                class="group relative overflow-hidden rounded-xl border border-white/8 bg-[var(--cl-bg-elevated)] transition-all hover:border-[var(--cl-neon)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cl-neon)]"
                :aria-label="getAlt(img)"
            >
                <div class="aspect-square">
                    <BaseKiThumbsImage
                        :src="`/api/v1/image/${img.id}/view`"
                        :alt="getAlt(img)"
                        :container-class="'aspect-square group-hover:scale-[1.02] transition-transform duration-300'"
                    />
                </div>
            </NuxtLink>

            <div ref="sentinel" class="col-span-full flex h-8 w-full items-center justify-center">
                <span v-if="imageStore.loading" class="loading loading-dots loading-md text-primary" />
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { Image } from '~~/server/database/schemas/image.schema';
import { DEMO_THUMBNAIL_VARIANTS } from '~~/shared/clicklab/demo-data';

const imageStore = useImageStore();
const demoAuth = useDemoAuth();

const demoPreviewItems = DEMO_THUMBNAIL_VARIANTS.slice(0, 4);

const showDemoPreview = computed(() =>
    demoAuth.isActive.value && (Boolean(imageStore.error) || imageStore.images.length === 0),
);

const sentinel = ref<HTMLDivElement | null>(null);
let observer: IntersectionObserver | null = null;

const getAlt = (img: Image): string => {
    const gen = (img as any).generationMetadata || {};
    return (gen.prompt as string) || 'Generated image';
};

const loadMore = async () => {
    if (imageStore.loading) return;
    imageStore.loading = true;
    try {
        imageStore.showMore();
    } catch (err) {
        console.error(err);
    } finally {
        imageStore.loading = false;
    }
};

const setupObserver = () => {
    if (!sentinel.value) return;
    cleanupObserver();
    observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                loadMore();
            }
        }
    }, { rootMargin: '200px 0px' });
    observer.observe(sentinel.value);
};

const cleanupObserver = () => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
};

onMounted(async () => {
    await imageStore.initialize(30);
    setupObserver();
});

onBeforeUnmount(() => {
    cleanupObserver();
});
</script>
