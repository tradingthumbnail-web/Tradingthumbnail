<template>
    <div class="flex flex-col gap-5 h-full min-h-0" data-tour="archive-page">
        <div class="flex items-center justify-between flex-wrap gap-4 flex-shrink-0">
            <div>
                <h1 class="text-2xl font-bold text-base-content">{{ $t('archive.title') }}</h1>
                <p class="text-sm text-base-content/50 mt-0.5">{{ $t('archive.description') }}</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="relative">
                    <Icon name="lucide:search" size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                    <input v-model="query" type="search" :placeholder="$t('common.search')" class="input input-sm input-bordered pl-9 w-48 bg-base-100/50 focus:bg-base-100" />
                </div>
                <div class="dropdown dropdown-end">
                    <label tabindex="0" class="btn btn-ghost btn-sm gap-2">
                        <Icon name="lucide:filter" size="14" />
                        {{ $t('common.filters') }}
                    </label>
                    <ul tabindex="0" class="dropdown-content menu p-3 shadow-xl bg-base-100/95 backdrop-blur-xl rounded-xl w-56 border border-base-100/20">
                        <li>
                            <label class="flex items-center justify-between cursor-pointer py-2">
                                <span class="text-sm font-medium">{{ $t('archive.onlyFavorites') }}</span>
                                <input type="checkbox" class="toggle toggle-sm toggle-primary" v-model="onlyFavorites" />
                            </label>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="flex gap-2 flex-wrap flex-shrink-0" data-tour="archive-filters">
            <button
                v-for="type in imageTypes"
                :key="type"
                @click="toggleType(type)"
                :class="['btn btn-sm rounded-full transition-all', selectedTypes.includes(type) ? 'btn-primary' : 'btn-ghost bg-base-200/50 hover:bg-base-200']"
            >
                {{ type }}
            </button>
        </div>

        <div v-if="imageStore.loading && !imageStore.hasInitialized" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div v-for="i in 12" :key="i" class="aspect-square bg-base-200 rounded-xl animate-pulse"></div>
        </div>

        <div v-else-if="imageStore.error" class="alert alert-error shadow-lg rounded-xl">
            <Icon name="lucide:alert-circle" class="h-5 w-5" />
            <span>{{ $t('common.errors.internalServerError') }}</span>
        </div>

        <div v-else-if="!imageStore.images.length" class="card bg-base-200 border border-base-100/10 rounded-2xl">
            <div class="card-body items-center text-center py-16">
                <div class="w-20 h-20 rounded-2xl bg-base-100/50 flex items-center justify-center mb-4">
                    <Icon name="lucide:image" class="text-base-content/30" size="40" />
                </div>
                <h3 class="text-lg font-semibold text-base-content">{{ $t('common.empty') || 'No images yet' }}</h3>
                <p class="text-sm text-base-content/50 max-w-sm">{{ $t('home.quickActions.createThumbnailDesc') }}</p>
            </div>
        </div>

        <div v-else class="flex gap-5 flex-1 min-h-0 bg-base-200 p-5 rounded-2xl border border-base-100/10">
            <div class="flex-1 min-h-0">
                <div class="h-full overflow-auto p-2">
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <div
                            v-for="item in visibleFiltered"
                            :key="item.id"
                            class="group cursor-pointer rounded-xl overflow-hidden transition-all duration-200"
                            :class="imageStore.selectedImage?.id === item.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-200' : 'hover:shadow-lg'"
                            @click="select(item)"
                        >
                            <div class="aspect-square bg-base-100/50 overflow-hidden">
                                <BaseKiThumbsImage
                                    :src="`/api/v1/image/${item.id}/view`"
                                    :alt="item.id"
                                    :container-class="'aspect-square group-hover:scale-105 transition-transform duration-300'"
                                />
                            </div>
                            <div class="p-3 bg-base-100/30">
                                <div class="text-xs text-base-content/40 font-mono truncate">{{ item.id.slice(0, 8) }}...</div>
                                <div class="flex items-center gap-2 mt-1.5">
                                    <span class="badge badge-ghost badge-xs uppercase font-medium">{{ item.type }}</span>
                                    <span class="text-[10px] text-base-content/40">{{ formatDate(item.createdAt) }}</span>
                                </div>
                            </div>
                        </div>

                        <div ref="sentinel" class="h-8 w-full col-span-full flex items-center justify-center">
                            <span v-if="hasMore" class="loading loading-dots loading-sm text-primary"></span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="w-80 hidden lg:block flex-shrink-0">
                <div v-if="imageStore.selectedImage" class="card bg-base-100/50 backdrop-blur border border-base-100/20 rounded-xl overflow-hidden sticky top-4">
                    <div class="aspect-video bg-base-200 overflow-hidden">
                        <BaseKiThumbsImage :src="`/api/v1/image/${imageStore.selectedImage.id}/view`" :alt="imageStore.selectedImage.id" :container-class="'aspect-video'" />
                    </div>
                    <div class="p-4 space-y-4">
                        <div class="space-y-2">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-base-content/50">Type</span>
                                <span class="font-semibold badge badge-primary badge-sm">{{ imageStore.selectedImage.type }}</span>
                            </div>
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-base-content/50">Created</span>
                                <span class="font-medium">{{ formatDate(imageStore.selectedImage.createdAt) }}</span>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <NuxtLink :to="`/images/${imageStore.selectedImage.id}`" class="btn btn-primary btn-sm flex-1 gap-1.5">
                                <Icon name="lucide:edit" size="14" />
                                Use
                            </NuxtLink>
                            <button class="btn btn-ghost btn-sm btn-square" @click="download(imageStore.selectedImage.id)">
                                <Icon name="lucide:download" size="16" />
                            </button>
                            <button class="btn btn-sm btn-square" :class="imageStore.selectedImage.imageMetadata?.isFavorite ? 'btn-primary' : 'btn-ghost'" @click="imageStore.toggleFavorite(imageStore.selectedImage.id)">
                                <Icon name="lucide:heart" size="16" />
                            </button>
                            <button class="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10" @click="openDeleteModal(imageStore.selectedImage)">
                                <Icon name="lucide:trash-2" size="16" />
                            </button>
                        </div>
                    </div>
                </div>
                <div v-else class="card bg-base-100/30 border border-base-100/10 rounded-xl p-8 sticky top-4 flex flex-col items-center justify-center h-64 text-center">
                    <Icon name="lucide:mouse-pointer-click" size="32" class="text-base-content/20 mb-3" />
                    <p class="text-sm text-base-content/50">{{ $t('archive.selectItemToFocus') }}</p>
                </div>
            </div>
        </div>
        
        <!-- Delete single modal (UI only) -->
        <dialog ref="deleteModalRef" class="modal" @cancel.prevent @submit.prevent="confirmDelete">
            <div class="modal-box">
                <h3 class="font-medium text-base-content">{{ $t('archive.deleteImage') }}</h3>
                <p class="py-2 text-sm text-base-content/70">{{ $t('archive.deleteImageConfirm') }}</p>
                <div class="modal-action">
                    <form method="dialog" class="flex items-center gap-2">
                        <button class="btn btn-outline btn-sm border border-base-content/40" @click="closeDeleteModal">{{ $t('common.cancel') }}</button>
                        <button class="btn btn-error btn-sm" type="submit">{{ $t('common.delete') }}</button>
                    </form>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="closeDeleteModal">{{ $t('common.close') }}</button>
            </form>
        </dialog>
    </div>
</template>

<script setup lang="ts">
import type { Image } from '~~/server/database/schemas/image.schema';
import { imageTypes, type ImageType } from '~~/shared/enums/image-types';

const { t } = useI18n();
const imageStore = useImageStore();
const toast = useToast();

const query = ref('');
const onlyFavorites = ref(false);
const selectedTypes = ref<ImageType[]>([]);
const deleteModalRef = ref<HTMLDialogElement | null>(null);
const deleteCandidate = ref<Image | null>(null);

const sentinel = ref<HTMLDivElement | null>(null);
let observer: IntersectionObserver | null = null;

const visibleFilteredCount = ref(30);

function toggleType(t: ImageType) {
    const idx = selectedTypes.value.indexOf(t);
    if (idx === -1) selectedTypes.value.push(t);
    else selectedTypes.value.splice(idx, 1);
    // Reset pagination when filter changes
    visibleFilteredCount.value = 30;
}

async function select(item: Image) {
    if (!item) return;
    if (imageStore.selectedImage?.id === item.id) {
        await navigateTo(`/images/${item.id}`);
        return;
    }
    imageStore.selectedImage = item;
}

function formatDate(dateValue: Date | string): string {
    try {
        const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
        return date.toLocaleDateString();
    } catch {
        return '';
    }
}

const filtered = computed(() => {
    const base = Array.isArray(imageStore.images) ? imageStore.images : [];
    let list = base;
    if (selectedTypes.value.length) {
        list = list.filter((i: any) => selectedTypes.value.includes(i.type));
    }
    if (onlyFavorites.value) {
        // placeholder for favorites logic; keeping all for now
        list = list;
    }
    const q = query.value?.trim().toLowerCase();
    if (q) {
        list = list.filter((i: any) => {
            const id = String(i.id).toLowerCase();
            const prompt = String((i.generationMetadata?.prompt) || '').toLowerCase();
            return id.includes(q) || prompt.includes(q);
        });
    }
    return list;
});

watch([query, onlyFavorites], () => {
    visibleFilteredCount.value = 30;
});

const visibleFiltered = computed(() => filtered.value.slice(0, visibleFilteredCount.value));

const hasMore = computed(() => visibleFiltered.value.length < filtered.value.length);

const loadMore = () => {
    if (hasMore.value) {
        visibleFilteredCount.value += 30;
    }
};

const setupObserver = () => {
    if (!sentinel.value) return;
    if (observer) observer.disconnect();
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
    await nextTick();
    setupObserver();
});

onBeforeUnmount(() => {
    cleanupObserver();
});

function openDeleteModal(item: Image) {
    deleteCandidate.value = item;
    deleteModalRef.value?.showModal();
}

function closeDeleteModal() {
    deleteCandidate.value = null;
    if (deleteModalRef.value?.open) deleteModalRef.value?.close();
}

async function confirmDelete() {
    if (!deleteCandidate.value) return;
    try {
        await imageStore.deleteImage(deleteCandidate.value.id);
        imageStore.selectedImage = null;
        closeDeleteModal();
    } catch (error) {
        console.error(error);
        toast.show({ title: t('common.errors.title'), message: t('common.errors.unknownError'), status: 'error' });
    }
};

const download = (imageId: string) => {
    const link = document.createElement('a');
    link.href = `/api/v1/image/${imageId}/view`;
    link.download = `image-${imageId}.jpg`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
}

useHead({
    title: clicklabPageTitle('Archive'),
    meta: [
        { name: 'description', content: 'Archive of all images' },
    ],
});
</script>

<style scoped>

</style>