<template>
    <div class="flex flex-col gap-4 sm:gap-6 h-full" data-tour="chat-page">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 flex-shrink-0">
            <div class="space-y-1">
                <h1 class="text-xl sm:text-2xl font-semibold text-base-content">{{ $t('chat.title') }}</h1>
                <p class="text-xs sm:text-sm text-base-content/70">{{ $t('chat.description') }}</p>
            </div>
            <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                <BaseModelSelectorButton type="fineEdit" @change="onModelChange" />
                <div v-if="imageStore.selectedImage" class="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                    <div class="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span class="text-xs font-medium text-primary">{{ shortId(imageStore.selectedImage.id) }}</span>
                </div>
                <button 
                    class="lg:hidden btn btn-ghost btn-sm border border-base-300/60"
                    @click="openOriginalsDrawer"
                    aria-label="Open originals"
                >
                    <Icon name="lucide:layers" size="16" />
                    <span class="text-xs">{{ $t('chat.originals') }}</span>
                </button>
            </div>
        </div>

        <!-- Mobile: Originals Drawer -->
        <Teleport to="body">
            <Transition
                enter-active-class="transition-opacity duration-200 ease-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition-opacity duration-150 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div v-if="isOriginalsDrawerOpen" class="fixed inset-0 z-40 lg:hidden" @click="closeOriginalsDrawer">
                    <div class="absolute inset-0 bg-base-300/70 backdrop-blur-sm"></div>
                </div>
            </Transition>
            
            <Transition
                enter-active-class="transition-transform duration-200 ease-out"
                enter-from-class="translate-x-full"
                enter-to-class="translate-x-0"
                leave-active-class="transition-transform duration-150 ease-in"
                leave-from-class="translate-x-0"
                leave-to-class="translate-x-full"
            >
                <aside v-if="isOriginalsDrawerOpen" class="fixed right-0 top-0 z-50 h-screen w-80 bg-base-200 border-l border-base-200 flex flex-col shadow-xl lg:hidden" data-tour="chat-originals">
                    <div class="p-4 border-b border-base-300/50 flex items-center justify-between flex-shrink-0">
                        <div class="flex items-center gap-2">
                            <Icon name="lucide:layers" class="h-4 w-4 text-base-content/60" />
                            <span class="text-xs font-semibold uppercase tracking-wider text-base-content/60">{{ $t('chat.originals') }}</span>
                        </div>
                        <button class="btn btn-ghost btn-sm btn-circle" @click="closeOriginalsDrawer">
                            <Icon name="lucide:x" size="18" />
                        </button>
                    </div>
                    <div class="flex-1 overflow-auto pt-3 p-4 space-y-3">
                        <button
                            v-for="img in originals"
                            :key="img.id"
                            class="w-full rounded-xl overflow-hidden border-2 transition-all duration-200 hover:shadow-md group relative bg-base-100"
                            :class="isSelected(img) ? 'border-primary shadow-md' : 'border-transparent hover:border-base-300'"
                            @click="select(img.id); closeOriginalsDrawer();"
                        >
                            <div class="p-2">
                                <BaseKiThumbsImage :src="viewSrc(img.id)" :alt="'Original ' + img.id" :container-class="'aspect-video rounded-lg w-full'" />
                                <div class="mt-3 flex items-center justify-between px-1">
                                    <span class="text-[10px] font-mono text-base-content/50">{{ shortId(img.id) }}</span>
                                    <div 
                                        class="w-3.5 h-3.5 bg-primary/50 group-hover:bg-primary transition-colors duration-300" 
                                        :style="{ 
                                            maskImage: `url(${getProviderIcon(img)})`, 
                                            WebkitMaskImage: `url(${getProviderIcon(img)})`,
                                            maskSize: 'contain',
                                            maskRepeat: 'no-repeat',
                                            maskPosition: 'center'
                                        } as any"
                                    ></div>
                                </div>
                            </div>
                        </button>
                        <div v-if="originals.length === 0" class="text-center py-8">
                            <Icon name="lucide:image" class="h-8 w-8 text-base-content/20 mx-auto mb-2" />
                            <p class="text-xs text-base-content/40">{{ $t('common.empty') }}</p>
                        </div>
                    </div>
                </aside>
            </Transition>
        </Teleport>

        <div class="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-6">
            <div class="flex-1 card bg-base-200 border border-base-200 p-3 sm:p-4 lg:p-6 flex flex-col overflow-hidden shadow-sm" data-tour="chat-versions">
                <div class="flex items-center justify-between pb-3 sm:pb-4 border-b border-base-300/50 flex-shrink-0">
                    <div class="flex items-center gap-2 sm:gap-3">
                        <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon name="lucide:git-branch" class="text-primary" size="14" />
                        </div>
                        <div>
                            <h2 class="text-xs sm:text-sm font-semibold">{{ $t('chat.versions') }}</h2>
                            <p class="text-[10px] sm:text-xs text-base-content/50">{{ treeItems.length }} {{ $t('common.items') }}</p>
                        </div>
                    </div>
                </div>

                <div class="relative flex-1 overflow-hidden min-h-[250px] sm:min-h-[300px] lg:min-h-[400px] rounded-xl border border-base-300 bg-base-100">
                    <VueFlow
                        v-if="imageNodes.length > 0"
                        :nodes="imageNodes"
                        :edges="imageEdges"
                        :default-viewport="{ x: 50, y: 50, zoom: isMobile ? 0.5 : 0.8 }"
                        :min-zoom="0.2"
                        :max-zoom="1.5"
                        :nodes-draggable="false"
                        :nodes-connectable="false"
                        :elements-selectable="true"
                        :pan-on-scroll="true"
                        :zoom-on-scroll="true"
                        fit-view-on-init
                        class="vue-flow-wrapper"
                    >
                        <template #node-imageCard="{ data }">
                            <Handle type="target" :position="Position.Top" class="!opacity-0" />
                            <div
                                class="flow-node-card"
                                :class="{
                                    'flow-node-card-selected': data.isSelected,
                                    'flow-node-card-root': data.isRoot
                                }"
                                @click="select(data.imageId)"
                            >
                                <div class="flow-node-image">
                                    <img 
                                        :src="viewSrc(data.imageId)" 
                                        :alt="data.imageId"
                                        class="w-full h-full object-cover"
                                    />
                                </div>
                                <div class="flow-node-body">
                                    <div class="flex items-center justify-between gap-2 mb-1">
                                        <div class="flex items-center gap-2">
                                            <span class="badge badge-sm" :class="data.isRoot ? 'badge-secondary' : 'badge-primary'">
                                                {{ data.isRoot ? $t('chat.root') : $t('chat.derived') }}
                                            </span>
                                            <span class="text-xs text-base-content/50 font-mono">{{ shortId(data.imageId) }}</span>
                                        </div>
                                    </div>
                                    <p class="text-sm text-base-content line-clamp-2 mb-2 leading-snug">
                                        {{ data.prompt || 'No prompt' }}
                                    </p>
                                    <div class="mt-auto flex items-center gap-2">
                                        <div
                                            class="w-4 h-4 bg-primary"
                                            :style="{
                                                maskImage: `url(${data.providerIcon})`,
                                                WebkitMaskImage: `url(${data.providerIcon})`,
                                                maskSize: 'contain',
                                                maskRepeat: 'no-repeat',
                                                maskPosition: 'center',
                                            } as any"
                                        ></div>
                                        <span class="text-xs font-medium text-primary">
                                            {{ data.modelDisplay }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Handle type="source" :position="Position.Bottom" class="!opacity-0" />
                        </template>
                    </VueFlow>

                    <div
                        v-if="treeItems.length === 0"
                        class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-base-100 text-center"
                    >
                        <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
                            <Icon name="lucide:image-off" class="text-base-content/30" size="32" />
                        </div>
                        <p class="text-sm text-base-content/50">{{ $t('common.nothingToShow') }}</p>
                    </div>
                </div>

                <div class="pt-3 sm:pt-4 border-t border-base-300/50 flex-shrink-0" data-tour="chat-input">
                    <KiThumbsTimelineInput @submit="fineEditImage($event)" :isLoading="isLoading" :generationCost="generationCost" />
                </div>
            </div>

            <!-- Desktop: Originals Panel -->
            <div class="hidden lg:flex lg:flex-col w-72 flex-shrink-0 card bg-base-200 border border-base-200 p-4 overflow-hidden shadow-sm" data-tour="chat-originals">
                <div class="flex items-center gap-2 pb-3 border-b border-base-300/50 flex-shrink-0">
                    <Icon name="lucide:layers" class="h-4 w-4 text-base-content/60" />
                    <span class="text-xs font-semibold uppercase tracking-wider text-base-content/60">{{ $t('chat.originals') }}</span>
                </div>
                <div class="flex-1 overflow-auto pt-3 space-y-3">
                    <button
                        v-for="img in originals"
                        :key="img.id"
                        class="w-full rounded-xl overflow-hidden border-2 transition-all duration-200 hover:shadow-md group relative bg-base-100"
                        :class="isSelected(img) ? 'border-primary shadow-md' : 'border-transparent hover:border-base-300'"
                        @click="select(img.id)"
                    >
                        <div class="p-2">
                            <BaseKiThumbsImage :src="viewSrc(img.id)" :alt="'Original ' + img.id" :container-class="'aspect-video rounded-lg w-full'" />
                            <div class="mt-3 flex items-center justify-between px-1">
                                <span class="text-[10px] font-mono text-base-content/50">{{ shortId(img.id) }}</span>
                                <div 
                                    class="w-3.5 h-3.5 bg-primary/50 group-hover:bg-primary transition-colors duration-300" 
                                    :style="{ 
                                        maskImage: `url(${getProviderIcon(img)})`, 
                                        WebkitMaskImage: `url(${getProviderIcon(img)})`,
                                        maskSize: 'contain',
                                        maskRepeat: 'no-repeat',
                                        maskPosition: 'center'
                                    } as any"
                                ></div>
                            </div>
                        </div>
                    </button>
                    <div v-if="originals.length === 0" class="text-center py-8">
                        <Icon name="lucide:image" class="h-8 w-8 text-base-content/20 mx-auto mb-2" />
                        <p class="text-xs text-base-content/40">{{ $t('common.empty') }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import type { Image } from '~~/server/database/schemas/image.schema';
import { FAL_MODEL_COSTS, PROVIDER_ICONS, getModelCredits, type ModelName } from '~~/server/constants/models-db';
import { VueFlow, Handle, Position } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import dagre from '@dagrejs/dagre';

const { $generationApi } = useNuxtApp();
const imageStore = useImageStore();
const toast = useToast();
const { t } = useI18n();
const { track } = usePosthog();
const userStore = useUserStore();

const originals = computed<Image[]>(() => imageStore.images.filter((i: Image) => !i.parentId));
const isLoading = ref(false);
const generationCost = computed(() => getModelCredits(selectedModel.value));

const isOriginalsDrawerOpen = ref(false);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
const isMobile = computed(() => {
    return windowWidth.value < 1024;
});

const openOriginalsDrawer = () => {
    isOriginalsDrawerOpen.value = true;
};

const closeOriginalsDrawer = () => {
    isOriginalsDrawerOpen.value = false;
};

const selectedModel = ref<ModelName>(userStore.getModelPreference('fineEdit'));

const onModelChange = (model: ModelName) => {
    selectedModel.value = model;
};

const { treeItems } = useImages();

const ancestorIds = computed(() => {
    const selected = imageStore.selectedImage;
    if (!selected) return new Set<string>();
    
    const ancestors = new Set<string>();
    ancestors.add(selected.id);
    
    let current = selected;
    while (current.parentId) {
        ancestors.add(current.parentId);
        const parent = imageStore.images.find((i: Image) => i.id === current.parentId);
        if (!parent) break;
        current = parent;
    }
    
    return ancestors;
});

async function select(id: string) {
    const found = imageStore.images.find((i: Image) => i.id === id) || null;
    if (imageStore.selectedImage === found) {
        await navigateTo(`/images/${id}`);
        return;
    }
    imageStore.selectedImage = found as any;
}

function viewSrc(id: string) {
    return `/api/v1/image/${id}/view`;
}

function shortId(id?: string | null) {
    if (!id) return '';
    return id.slice(0, 6);
}

function formatDate(d: any) {
    try {
        const dt = new Date(d);
        return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function getProviderIcon(image: Image): string {
    const modelName = image.generationMetadata?.model as ModelName | undefined;
    if (!modelName || !FAL_MODEL_COSTS[modelName]) return PROVIDER_ICONS['fal'];
    const provider = FAL_MODEL_COSTS[modelName].provider;
    return PROVIDER_ICONS[provider];
}

function getModelDisplayName(modelName?: string): string {
    if (!modelName || !FAL_MODEL_COSTS[modelName as ModelName]) return modelName || 'Unknown';
    return FAL_MODEL_COSTS[modelName as ModelName].displayName;
}

const NODE_WIDTH = computed(() => isMobile.value ? 280 : 340);
const NODE_HEIGHT = computed(() => isMobile.value ? 140 : 160);

const imageNodes = computed(() => {
    if (!treeItems.value.length) return [];

    const graph = new dagre.graphlib.Graph();
    graph.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40 });
    graph.setDefaultEdgeLabel(() => ({}));

    treeItems.value.forEach((item) => {
        graph.setNode(item.image.id, { width: NODE_WIDTH.value, height: NODE_HEIGHT.value });
    });

    treeItems.value.forEach((item) => {
        if (item.image.parentId) {
            graph.setEdge(item.image.parentId, item.image.id);
        }
    });

    dagre.layout(graph);

    return treeItems.value.map((item) => {
        const layoutNode = graph.node(item.image.id) ?? { x: 0, y: 0 };
        const isSelected = imageStore.selectedImage?.id === item.image.id;
        
        return {
            id: item.image.id,
            type: 'imageCard',
            position: {
                x: (layoutNode.x ?? 0) - NODE_WIDTH.value / 2,
                y: (layoutNode.y ?? 0) - NODE_HEIGHT.value / 2,
            },
            data: {
                imageId: item.image.id,
                image: item.image,
                prompt: item.image.generationMetadata?.prompt || '',
                providerIcon: getProviderIcon(item.image),
                modelDisplay: getModelDisplayName(item.image.generationMetadata?.model),
                isRoot: !item.image.parentId,
                isSelected,
            },
        };
    });
});

const imageEdges = computed(() => {
    return treeItems.value
        .filter((item) => item.image.parentId)
        .map((item) => {
            const isActive = ancestorIds.value.has(item.image.id);
            return {
                id: `e-${item.image.parentId}-${item.image.id}`,
                source: item.image.parentId!,
                target: item.image.id,
                type: 'smoothstep',
                animated: isActive,
                class: isActive ? 'edge-active' : 'edge-inactive',
            };
        });
});

onMounted(async () => {
    if (!imageStore.hasInitialized) {
        await imageStore.initialize(30);
    }
});

function isSelected(img: Image) {
    return imageStore.selectedImage && imageStore.selectedImage.id === img.id;
}

const fineEditImage = async (prompt: string) => {
    if (!imageStore.selectedImage || !prompt) return;
    try {
        isLoading.value = true;
        const generatedImage = await $generationApi<Image>('/fine-edit', {
            method: 'POST',
            body: {
                prompt: prompt,
                imageId: imageStore.selectedImage.id,
                model: selectedModel.value,
            },
            headers: {
                'X-Activity': 'FINE_DETAIL_EDITION',
                'X-Credits': String(generationCost.value),
            },
        });
        track('image.fine-edit.generated', {
            credits: generationCost.value,
            email: userStore.user?.email,
            tier: userStore.tier?.name,
        });
        imageStore.addImage(generatedImage);
        imageStore.selectedImage = generatedImage;
    } catch (error: any) {
        console.error(error);
        toast.show({
            title: t('common.errors.title'),
            message: error.message,
            status: 'error',
        });
    } finally {
        isLoading.value = false;
    }
}

useHead({ title: clicklabPageTitle(t('chat.title')) });
</script>

<style>
.vue-flow-wrapper {
    width: 100%;
    height: 100%;
}

.vue-flow__node-imageCard {
    width: 340px;
    height: 160px;
}

@media (max-width: 640px) {
    .vue-flow__node-imageCard {
        width: 280px;
        height: 140px;
    }
    
    .flow-node-card {
        width: 280px;
        height: 140px;
    }
    
    .flow-node-image {
        width: 140px;
    }
}

.flow-node-card {
    display: flex;
    width: 340px;
    height: 160px;
    border-radius: 12px;
    border: 2px solid oklch(var(--color-primary) / 0.15);
    background: oklch(var(--b1));
    box-shadow: 0 4px 16px -4px oklch(var(--color-primary) / 0.1);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
}

.flow-node-card:hover {
    border-color: #ffffff;
    box-shadow: 0 8px 24px -8px oklch(var(--color-primary) / 0.15);
    transform: translateY(-2px);
}

.flow-node-card-selected {
    border-width: 3px !important;
    border-color: #8c52ff !important;
    box-shadow: 0 0 0 4px oklch(var(--p) / 0.25),
                0 8px 32px -8px oklch(var(--color-primary) / 0.2) !important;
}

.flow-node-card-root:not(.flow-node-card-selected) {
    border-color: oklch(var(--s) / 0.4);
}

.flow-node-image {
    width: 180px;
    height: 100%;
    flex-shrink: 0;
    background: oklch(var(--b2));
    overflow: hidden;
}

.flow-node-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.flow-node-body {
    flex: 1;
    padding: 12px;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.vue-flow__edge-path {
    stroke-linecap: round;
    stroke: #fff;
    stroke-width: 2px;
}

.vue-flow__edge.edge-inactive .vue-flow__edge-path {
    stroke: #fff;
    stroke-width: 2px;
}

.vue-flow__edge.edge-active .vue-flow__edge-path {
    stroke: #8c52ff;
    stroke-width: 3px;
}

.vue-flow__edge.animated .vue-flow__edge-path {
    stroke: #8c52ff;
    stroke-width: 3px;
    stroke-dasharray: 5;
    animation: dashdraw 0.5s linear infinite;
}

@keyframes dashdraw {
    from {
        stroke-dashoffset: 10;
    }
}

.vue-flow__background {
    background-color: oklch(var(--b2) / 0.5);
}
</style>
