<template>
    <div class="flex flex-col gap-6 h-full">
        <div class="flex flex-col gap-1 flex-shrink-0">
            <h1 class="text-2xl font-semibold text-base-content">{{ $t('graph.title') }}</h1>
            <p class="text-sm text-base-content/70">{{ $t('graph.description') }}</p>
        </div>

        <div v-if="loading && graphImages.length === 0" class="flex items-center justify-center h-full">
            <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="error" class="alert alert-error">
            <span>{{ $t('common.errors.title') }}</span>
        </div>

        <div v-else class="flex flex-col gap-4 h-full">
            <div class="h-full w-full bg-base-200 card"
                v-if="Object.keys(nodes).length > 0">
                <v-network-graph :key="layoutKey" :nodes="nodes" :edges="edges" :configs="configs" v-model:zoom-level="zoomLevel" :event-handlers="eventHandlers" data-tour="graph-header">
                    <defs>
                        <clipPath id="imageCircle" clipPathUnits="objectBoundingBox">
                            <circle cx="0.5" cy="0.5" r="0.5" />
                        </clipPath>
                    </defs>
                    <template #override-node="{ nodeId, scale, config, ...slotProps }">
                        <circle
                            class="node-circle"
                            :r="config.radius * scale"
                            fill="#121212"
                            v-bind="slotProps"
                        />
                        <image
                            class="image-picture"
                            :x="-config.radius * scale"
                            :y="-config.radius * scale"
                            :width="config.radius * scale * 2"
                            :height="config.radius * scale * 2"
                            :xlink:href="getSrc(nodeId)"
                            clip-path="url(#imageCircle)"
                        />
                        <circle
                            class="image-circle"
                            :r="config.radius * scale"
                            fill="none"
                            stroke="#121212"
                            :stroke-width="1 * scale"
                            v-bind="slotProps"
                        />
                    </template>
                </v-network-graph>
            </div>

            <div v-if="Object.keys(nodes).length === 0 && !loading" class="text-center text-base-content/70 py-10">
                <p>{{ $t('graph.noImages') }}</p>
            </div>

            <div v-if="Object.keys(nodes).length > 0" class="flex justify-center gap-2">
                <button 
                    class="btn btn-outline btn-primary" 
                    @click="arrangeGraph"
                    :disabled="arranging"
                >
                    <span v-if="arranging" class="loading loading-spinner loading-sm"></span>
                    <span v-else>{{ $t('graph.arrange') }}</span>
                </button>
                <button 
                    v-if="hasMore"
                    class="btn btn-primary" 
                    @click="loadMoreImages"
                    :disabled="loading"
                >
                    <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                    <span v-else>{{ $t('graph.loadMore') }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import {
    ForceLayout,
    type ForceNodeDatum,
    type ForceEdgeDatum,
} from "v-network-graph/lib/force-layout";
import * as vNG from "v-network-graph";

import type { Image } from '~~/server/database/schemas/image.schema';

const { t } = useI18n();

const PAGE_SIZE = 20;
const graphImages = ref<Image[]>([]);
const loading = ref(false);
const error = ref<any>(null);
const offset = ref(0);
const hasMore = ref(true);
const arranging = ref(false);
const layoutKey = ref(0);

const nodes = ref<Record<string, { name: string }>>({});
const edges = ref<Record<string, { source: string, target: string }>>({});

const getSrc = (id: string) => {
    return `/api/v1/image/${id}/view`;
}

const updateGraph = () => {
    const nodeMap: Record<string, { name: string, src: string }> = {};
    for (const image of graphImages.value) {
        nodeMap[image.id] = { 
            name: (image as any).name || image.id.slice(0, 8),
            src: getSrc(image.id)
        };
    }
    nodes.value = nodeMap;

    const edgeMap: Record<string, { source: string, target: string }> = {};
    let i = 0;
    for (const image of graphImages.value) {
        if (image.parentId && graphImages.value.some(img => img.id === image.parentId)) {
            edgeMap[`e${i++}`] = { source: image.parentId, target: image.id };
        }
    }
    edges.value = edgeMap;
};

const loadImages = async (loadOffset: number, limit: number) => {
    loading.value = true;
    error.value = null;
    try {
        const images = await $fetch<Image[]>('/api/v1/image', {
            query: {
                limit,
                offset: loadOffset,
            }
        });
        
        if (images.length < limit) {
            hasMore.value = false;
        }
        
        graphImages.value.push(...images);
        updateGraph();
    } catch (err) {
        console.error(err);
        error.value = err;
    } finally {
        loading.value = false;
    }
};

const loadMoreImages = async () => {
    offset.value += PAGE_SIZE;
    await loadImages(offset.value, PAGE_SIZE);
};

const zoomLevel = ref(0.5);

const createLayoutHandler = () => {
    return new ForceLayout({
        positionFixedByDrag: false,
        createSimulation: (d3, nodes, edges) => {
            const forceLink = d3
                .forceLink<ForceNodeDatum, ForceEdgeDatum>(edges)
                .id((d: any) => d.id)
                .distance(110)
                .strength(0.25);
            return d3
                .forceSimulation(nodes)
                .force("edge", forceLink)
                .force("charge", d3.forceManyBody().strength(-220))
                .force("collide", d3.forceCollide().radius(44).strength(1.0).iterations(2))
                .force("center", d3.forceCenter().strength(0.03))
                .alpha(1)
                .alphaMin(0.001)
        }
    });
};

const configs = computed<vNG.Config>(() => ({
    view: {
        layoutHandler: createLayoutHandler(),
    },
    node: {
        label: {
            visible: false
        },
        normal: {
            radius: 36,
        }
    },
    edge: {
        normal: {
            width: 3,
            color: 'var(--color-base-300)',
        }
    }
}));

const arrangeGraph = () => {
    arranging.value = true;
    layoutKey.value += 1;
    setTimeout(() => {
        arranging.value = false;
    }, 500);
};

const eventHandlers: vNG.EventHandlers = {
    "node:dblclick": async ({ node }) => {
        await navigateTo(`/images/${node}`);
    }
}

onMounted(async () => {
    await loadImages(0, PAGE_SIZE);
});

useHead({ title: clicklabPageTitle(t('graph.title')) });
</script>

<style scoped></style>