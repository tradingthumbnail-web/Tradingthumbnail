<template>
    <div
        class="w-full h-full flex flex-col lg:flex-row bg-base-200 text-base-content"
        data-tour="editor-page"
    >
        <BaseToast />

        <!-- Mobile: Tool Options Panel (Drawer) -->
        <Teleport to="body">
            <div
                class="fixed inset-0 z-40 lg:hidden transition-opacity duration-150"
                :class="isOptionsDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
                @click="closeOptionsDrawer"
            >
                <div class="absolute inset-0 bg-base-300/70 backdrop-blur-sm"></div>
            </div>

            <aside
                class="fixed left-0 top-0 z-50 h-screen w-80 bg-base-200 backdrop-blur border-r border-base-300/60 flex flex-col shadow-xl lg:hidden transition-transform duration-200 ease-out"
                :class="isOptionsDrawerOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'"
            >
                <div class="p-4 border-b border-base-300/60 flex items-center justify-between">
                    <div class="flex flex-col gap-1">
                        <div class="text-[10px] uppercase tracking-wider text-base-content/60">{{ $t('editor.options') }}</div>
                        <div class="mt-1 text-sm font-medium text-base-content/80">{{ currentTool.label }}</div>
                    </div>
                    <button class="btn btn-ghost btn-sm btn-circle" @click="closeOptionsDrawer">
                        <Icon name="lucide:x" size="18" />
                    </button>
                </div>
                <div class="flex-1 min-h-0 flex flex-col p-4 overflow-hidden">
                    <KiThumbsToolPanelsChangeFace :original-image-id="imageId" v-if="activeTool === 'change-face' && isMobile" class="flex-1 min-h-0" />
                    <KiThumbsToolPanelsFaceSwap :original-image-id="imageId" v-if="activeTool === 'face-swap' && isMobile" class="flex-1 min-h-0" />
                    <KiThumbsToolPanelsInpainting :original-image-id="imageId" v-if="activeTool === 'inpainting' && isMobile" class="flex-1 min-h-0" />
                    <KiThumbsToolPanelsChatEdition :original-image-id="imageId" v-if="activeTool === 'chat-edition' && isMobile" class="flex-1 min-h-0" />
                    <KiThumbsToolPanelsText :original-image-id="imageId" v-if="activeTool === 'add-text' && isMobile" class="flex-1 min-h-0" />
                    <KiThumbsToolPanelsOutpainting :original-image-id="imageId" v-if="activeTool === 'outpainting' && isMobile" class="flex-1 min-h-0" />
                </div>
            </aside>
        </Teleport>

        <!-- Desktop: Tool Options Panel -->
        <aside
            class="hidden lg:flex w-72 bg-base-200 border-r border-base-100/10 flex-shrink-0 flex-col"
            data-tour="editor-options"
        >
            <div class="p-4 border-b border-base-100/10 flex flex-col gap-1">
                <div class="text-[10px] uppercase tracking-widest text-base-content/40 font-semibold">{{ $t('editor.options') }}</div>
                <div class="mt-1 text-sm font-bold text-base-content">{{ currentTool.label }}</div>
            </div>
                <div class="flex-1 min-h-0 flex flex-col p-4 overflow-hidden">
                    <KiThumbsToolPanelsChangeFace :original-image-id="imageId" v-if="activeTool === 'change-face' && !isMobile" class="flex-1 min-h-0" />
                    <KiThumbsToolPanelsFaceSwap :original-image-id="imageId" v-if="activeTool === 'face-swap' && !isMobile" class="flex-1 min-h-0" />
                    <KiThumbsToolPanelsInpainting :original-image-id="imageId" v-if="activeTool === 'inpainting' && !isMobile" class="flex-1 min-h-0" />
                    <KiThumbsToolPanelsChatEdition :original-image-id="imageId" v-if="activeTool === 'chat-edition' && !isMobile" class="flex-1 min-h-0" />
                    <KiThumbsToolPanelsText :original-image-id="imageId" v-if="activeTool === 'add-text' && !isMobile" class="flex-1 min-h-0" />
                    <KiThumbsToolPanelsOutpainting :original-image-id="imageId" v-if="activeTool === 'outpainting' && !isMobile" class="flex-1 min-h-0" />
                </div>
        </aside>

        <!-- Center: Toolbar + Canvas -->
        <section class="flex-1 flex flex-col min-w-0 p-2 lg:p-4">
            <div
                class="px-3 sm:px-4 py-3 bg-base-200/80 backdrop-blur-sm sticky top-0 z-10 flex items-center gap-2 sm:gap-3 flex-wrap border-b border-base-100/10 overflow-visible"
                data-tour="editor-toolbar"
            >
                <button
                    class="lg:hidden btn btn-ghost btn-sm btn-square"
                    @click="openOptionsDrawer"
                    aria-label="Open options"
                >
                    <Icon name="lucide:settings" size="16" mode="svg" />
                </button>

                <div class="flex gap-1 flex-shrink-0 bg-base-100/30 p-1 rounded-xl overflow-visible" data-tour="editor-tools">
                    <button
                        v-for="tool in toolButtons"
                        :key="tool.id"
                        class="btn btn-ghost btn-sm btn-square rounded-lg tooltip tooltip-bottom"
                        :data-tip="$t(tool.labelKey)"
                        :class="activeTool === tool.id ? 'bg-primary text-primary-content' : 'hover:bg-base-100/50'"
                        @click="setTool(tool.id)"
                    >
                        <Icon :name="tool.icon" size="16" mode="svg" />
                    </button>
                </div>

                <div class="ml-auto flex items-center gap-1.5 flex-shrink-0 overflow-visible">
                    <button
                        v-for="action in actionButtons"
                        :key="action.id"
                        class="btn btn-ghost btn-sm btn-square tooltip tooltip-bottom"
                        :class="{ 'hidden sm:inline-flex': action.desktopOnly }"
                        :data-tip="$t(action.labelKey)"
                        @click="handleAction(action.id)"
                    >
                        <Icon :name="action.icon" :size="action.iconSize ?? '16'" mode="svg" :class="action.iconClass" />
                    </button>
                </div>
            </div>

            <!-- Canvas area -->
            <div class="flex-1 min-h-0 p-3 sm:p-4 overflow-hidden bg-base-300/40 rounded-xl border border-base-100/5" data-tour="editor-canvas">
                <div class="w-full h-full flex items-center justify-center">
                    <div class="overflow-hidden w-full h-full flex items-center justify-center rounded-xl bg-base-300/30">
                        <div ref="canvasHost" class="relative aspect-video w-full max-w-full max-h-full">
                            <div ref="canvasMount" class="inline-block w-full h-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Mobile: Versions Panel (Drawer) -->
        <Teleport to="body">
            <div
                class="fixed inset-0 z-40 lg:hidden transition-opacity duration-150"
                :class="isVersionsDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
                @click="closeVersionsDrawer"
            >
                <div class="absolute inset-0 bg-base-300/70 backdrop-blur-sm"></div>
            </div>

            <aside
                class="fixed right-0 top-0 z-50 h-screen w-80 bg-base-200/60 backdrop-blur border-l border-base-300/60 flex flex-col shadow-xl lg:hidden transition-transform duration-200 ease-out"
                :class="isVersionsDrawerOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'"
                data-tour="editor-versions"
            >
                <div class="p-4 border-b border-base-300/60 flex items-center justify-between">
                    <div class="text-[10px] uppercase tracking-wider text-base-content/60">{{ $t('editor.versions') }}</div>
                    <button class="btn btn-ghost btn-sm btn-circle" @click="closeVersionsDrawer">
                        <Icon name="lucide:x" size="18" />
                    </button>
                </div>
                <div class="p-3 space-y-2 overflow-auto flex-1" ref="versionsScrollMobile">
                    <div v-for="image in imageStore.getImageVersions" :key="image.id">
                        <button
                            class="card bg-base-100/60 border border-base-300/60 hover:border-base-300 hover:shadow-sm transition w-full text-left"
                            :class="{'ring-1 ring-[var(--color-primary)]': imageStore.selectedImage?.id === image.id}"
                            :data-active-version="imageStore.selectedImage?.id === image.id ? 'true' : null"
                            @click="onSelectVersion(image)">
                            <div class="card-body p-2">
                                <BaseKiThumbsImage :src="`/api/v1/image/${image.id}/view`" :alt="`Image ${image.id}`"
                                    :container-class="'w-full h-full object-contain'" />
                                <div class="mt-1 text-[10px] text-base-content/60 flex justify-between">
                                    <span>{{ new Date(image.createdAt as any).toLocaleString() }}</span>
                                    <span v-if="image.id === imageStore.selectedImage?.id" class="text-[var(--color-primary)]">{{ $t('editor.actual') }}</span>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </aside>
        </Teleport>

        <!-- Desktop: Versions Panel -->
        <aside
            class="hidden lg:flex lg:flex-col w-56 bg-base-200 border-l border-base-100/10 flex-shrink-0"
            data-tour="editor-versions"
        >
            <div class="p-4 border-b border-base-100/10">
                <div class="text-[10px] uppercase tracking-widest text-base-content/40 font-semibold">{{ $t('editor.versions') }}</div>
            </div>
            <div class="p-3 space-y-2 overflow-auto flex-1" style="height: calc(100% - 4rem)" ref="versionsScroll">
                <div v-for="image in imageStore.getImageVersions" :key="image.id">
                    <button
                        class="group w-full text-left rounded-xl overflow-hidden transition-all duration-200"
                        :class="imageStore.selectedImage?.id === image.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-200' : 'hover:shadow-md'"
                        :data-active-version="imageStore.selectedImage?.id === image.id ? 'true' : null"
                        @click="onSelectVersion(image)">
                        <div class="bg-base-100/40 p-1.5 rounded-xl">
                            <BaseKiThumbsImage :src="`/api/v1/image/${image.id}/view`" :alt="`Image ${image.id}`"
                                :container-class="'w-full aspect-video object-contain rounded-lg'" />
                            <div class="mt-1.5 px-1 text-[10px] text-base-content/50 flex justify-between items-center">
                                <span>{{ new Date(image.createdAt as any).toLocaleTimeString() }}</span>
                                <span v-if="image.id === imageStore.selectedImage?.id" class="text-primary font-semibold">{{ $t('editor.actual') }}</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </aside>

        <!-- Mobile: Bottom action bar -->
        <div class="lg:hidden fixed bottom-0 left-0 right-0 bg-base-200/95 backdrop-blur-xl border-t border-base-100/10 p-2 flex items-center justify-around gap-2 z-30 safe-area-pb">
            <button class="btn btn-ghost btn-sm flex-col h-auto py-2 gap-1 flex-1" @click="openOptionsDrawer">
                <Icon name="lucide:settings" size="18" />
                <span class="text-[10px] text-base-content/60">{{ $t('editor.options') }}</span>
            </button>
            <button class="btn btn-ghost btn-sm flex-col h-auto py-2 gap-1 flex-1" @click="openVersionsDrawer">
                <Icon name="lucide:layers" size="18" />
                <span class="text-[10px] text-base-content/60">{{ $t('editor.versions') }}</span>
            </button>
            <button class="btn btn-ghost btn-sm flex-col h-auto py-2 gap-1 flex-1" @click="saveCanvas">
                <Icon name="lucide:save" size="18" />
                <span class="text-[10px] text-base-content/60">{{ $t('editor.saveCanvas') }}</span>
            </button>
            <button class="btn btn-ghost btn-sm flex-col h-auto py-2 gap-1 flex-1" @click="downloadCanvas">
                <Icon name="lucide:download" size="18" />
                <span class="text-[10px] text-base-content/60">{{ $t('editor.downloadCanvas') }}</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useEditorTour } from '~~/app/composables/useDriver/editor';
import type { Image } from '~~/server/database/schemas/image.schema';

const { t } = useI18n();
const props = defineProps<{ imageId: string }>();
const editorTour = useEditorTour();
const {
    canvas,
    initCanvas,
    setHost,
    disposeCanvas,
    setBackgroundImage,
    clearCanvas,
    saveCanvas,
    lockAndCenterBackground
} = useCanvas();
const imageStore = useImageStore();

const canvasMount = shallowRef<HTMLDivElement | null>(null);
const canvasHost = shallowRef<HTMLDivElement | null>(null);
const versionsScroll = shallowRef<HTMLDivElement | null>(null);
const versionsScrollMobile = shallowRef<HTMLDivElement | null>(null);

let canvasEl: HTMLCanvasElement | null = null;

const isOptionsDrawerOpen = ref(false);
const isVersionsDrawerOpen = ref(false);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
const isMobile = computed(() => windowWidth.value < 1024);

const openOptionsDrawer = () => {
    isOptionsDrawerOpen.value = true;
    isVersionsDrawerOpen.value = false;
};
const closeOptionsDrawer = () => { isOptionsDrawerOpen.value = false; };

const openVersionsDrawer = () => {
    isVersionsDrawerOpen.value = true;
    isOptionsDrawerOpen.value = false;
};
const closeVersionsDrawer = () => { isVersionsDrawerOpen.value = false; };

import { toolButtons, NOT_DRAWING_TOOLS, tools, type Tool } from '~/composables/editor-tools';

const ACTIVE_TOOL_LOCALSTORAGE_KEY = 'kithumbs-active-tool';

const actionButtons = [
    { id: 'clear', icon: 'lucide:eraser', labelKey: 'editor.clearCanvas', desktopOnly: true },
    { id: 'save', icon: 'lucide:save', labelKey: 'editor.saveCanvas', desktopOnly: true },
    { id: 'download', icon: 'lucide:download', labelKey: 'editor.downloadCanvas', desktopOnly: true },
    { id: 'help', icon: 'lucide:help-circle', labelKey: 'driver.tour', desktopOnly: true, iconSize: '18', iconClass: 'text-base-content/50' },
];

const activeTool = ref<Tool>('change-face');

const currentTool = computed(() => {
    const found = toolButtons.find(t => t.id === activeTool.value);
    const isDrawing = !NOT_DRAWING_TOOLS.includes(activeTool.value);
    return {
        label: found ? t(found.labelKey) : t('editor.tool'),
        isDrawingMode: isDrawing,
    };
});

function setTool(tool: Tool) {
    activeTool.value = tool;
    if (typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_TOOL_LOCALSTORAGE_KEY, tool);
    }
}

function handleAction(id: string) {
    switch (id) {
        case 'clear': clearCanvas(); break;
        case 'save': saveCanvas(); break;
        case 'download': downloadCanvas(); break;
        case 'help': editorTour.start(); break;
    }
}

watch(activeTool, (newVal, oldVal) => {
    if (!canvas.value) return;
    canvas.value.isDrawingMode = !NOT_DRAWING_TOOLS.includes(newVal);
    if (oldVal === 'outpainting' && newVal !== 'outpainting') {
        lockAndCenterBackground();
    }
    clearCanvas();
    closeOptionsDrawer();
});

function fitCanvasToHost() {
    if (!canvas.value || !canvasHost.value) return;
    const hostRect = canvasHost.value.getBoundingClientRect();
    const HOST_W = Math.max(1, hostRect.width);
    const HOST_H = Math.max(1, hostRect.height);
    const CANVAS_W = 1270;
    const CANVAS_H = 720;

    const scale = Math.min(HOST_W / CANVAS_W, HOST_H / CANVAS_H);
    canvas.value.setDimensions({ width: CANVAS_W, height: CANVAS_H });
    canvas.value.setDimensions(
        { width: CANVAS_W * scale, height: CANVAS_H * scale },
        { cssOnly: true } as any,
    );
    canvas.value.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.value.requestRenderAll();
}

let resizeObserver: ResizeObserver | null = null;

const downloadCanvas = () => {
    if (!canvas.value) return;
    const data = canvas.value.toDataURL({ format: 'png', multiplier: 1 });
    const a = document.createElement('a');
    a.href = data;
    a.download = 'thumbnail.png';
    a.click();
};

async function onSelectVersion(image: Image) {
    imageStore.selectedImage = image;
    await navigateTo(`/images/${image.id}`);
    setBackgroundImage(`/api/v1/image/${image.id}/view`);
}

watch(() => props.imageId, async (newId, oldId) => {
    if (!newId || newId === oldId) return;
    try {
        await imageStore.selectImage(newId);
        await nextTick();
        await setBackgroundImage(`/api/v1/image/${newId}/view`);
        scrollActiveVersionIntoView('smooth');
    } catch (err) {
        console.error('Failed to update editor background on image change', err);
    }
});

function scrollActiveVersionIntoView(behavior: ScrollBehavior = 'auto') {
    const scrollContainer = isVersionsDrawerOpen.value
        ? versionsScrollMobile.value
        : versionsScroll.value;
    if (!scrollContainer) return;
    const active = scrollContainer.querySelector('[data-active-version="true"]') as HTMLElement | null;
    if (!active) return;
    active.scrollIntoView({ block: 'nearest', behavior });
}

watch(() => imageStore.selectedImage?.id, async (newId, oldId) => {
    if (!newId || newId === oldId) return;
    await nextTick();
    scrollActiveVersionIntoView('smooth');
});

onMounted(() => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(ACTIVE_TOOL_LOCALSTORAGE_KEY);
        if (stored && tools.includes(stored as Tool)) {
            activeTool.value = stored as Tool;
        }
    }
    if (!imageStore.selectedImage) {
        imageStore.selectedImage = imageStore.images.find((image: Image) => image.id === props.imageId);
    }

    requestAnimationFrame(async () => {
        if (!canvasMount.value) return;
        canvasEl = document.createElement('canvas');
        canvasMount.value.appendChild(canvasEl);
        setHost(canvasEl);
        await initCanvas(canvasEl, { isDrawingMode: currentTool.value.isDrawingMode });
        await setBackgroundImage(`/api/v1/image/${props.imageId}/view`);
        fitCanvasToHost();
        await nextTick();
        scrollActiveVersionIntoView('smooth');
    });

    if (canvasHost.value) {
        resizeObserver = new ResizeObserver(() => fitCanvasToHost());
        resizeObserver.observe(canvasHost.value);
    }
    window.addEventListener('resize', onWindowResize);
});

function onWindowResize() {
    windowWidth.value = window.innerWidth;
    fitCanvasToHost();
}

onBeforeUnmount(() => {
    if (resizeObserver && canvasHost.value) resizeObserver.unobserve(canvasHost.value);
    resizeObserver = null;
    window.removeEventListener('resize', onWindowResize);
    disposeCanvas();
});
</script>

<style scoped></style>
