<template>
    <div class="h-full max-h-full flex flex-col min-h-0">
        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
            <span class="text-xs text-base-content/60">{{ $t('outpainting.repositionTheImage') }}</span>
            <!-- Canvas / Image Dimensions -->
            <div class="grid grid-cols-2 gap-2">
                <div class="flex flex-col gap-1">
                    <label class="label py-1">
                        <span class="label-text text-xs">{{ $t('outpainting.canvasWidth') }}</span>
                    </label>
                    <input type="number" class="input input-bordered bg-base-100 text-sm" v-model.number="form.dimensions.width" min="1" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="label py-1">
                        <span class="label-text text-xs">{{ $t('outpainting.canvasHeight') }}</span>
                    </label>
                    <input type="number" class="input input-bordered bg-base-100 text-sm" v-model.number="form.dimensions.height" min="1" />
                </div>
            </div>

            <!-- Position Controls -->
            <div class="flex flex-col gap-2">
                <label class="label py-1">
                    <span class="label-text text-xs">{{ $t('outpainting.backgroundPosition') }}</span>
                </label>
                <div class="grid grid-cols-2 gap-2">
                    <div class="flex flex-col gap-1">
                        <span class="text-xs text-base-content/60">{{ $t('outpainting.xCenter') }}</span>
                        <input type="number" class="input input-bordered bg-base-100 text-sm" v-model.number="form.position.x" step="1" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-xs text-base-content/60">{{ $t('outpainting.yCenter') }}</span>
                        <input type="number" class="input input-bordered bg-base-100 text-sm" v-model.number="form.position.y" step="1" />
                    </div>
                </div>
            </div>

            <!-- Scale Controls -->
            <div class="flex flex-col gap-2">
                <label class="label py-1">
                    <span class="label-text text-xs">{{ $t('outpainting.scale') }}</span>
                </label>
                <input type="range" class="range range-primary range-sm" min="0.1" max="3" step="0.01" v-model.number="form.scale" />
                <div class="text-xs text-base-content/60 text-center">{{ form.scale.toFixed(2) }}x</div>
                <div class="flex gap-2 items-center justify-center">
                    <button class="btn btn-ghost border border-base-300/60 btn-sm" @click="fitBackgroundToCanvas">{{ $t('outpainting.fitToCanvas') }}</button>
                    <button class="btn btn-ghost border border-base-300/60 btn-sm" @click="centerBackground">{{ $t('outpainting.center') }}</button>
                </div>
            </div>

            <!-- Scaled size preview -->
            <div class="grid grid-cols-2 gap-2">
                <div class="flex flex-col gap-1">
                    <label class="label py-1">
                        <span class="label-text text-xs text-wrap">{{ $t('outpainting.imageWScaled') }}</span>
                    </label>
                    <input type="number" class="input input-bordered bg-base-200 text-sm" :value="scaledWidth" disabled />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="label py-1">
                        <span class="label-text text-xs text-wrap">{{ $t('outpainting.imageHScaled') }}</span>
                    </label>
                    <input type="number" class="input input-bordered bg-base-200 text-sm" :value="scaledHeight" disabled />
                </div>
            </div>
        </div>

        <div class="flex-shrink-0">
            <BaseGenerateButton :is-loading="isGenerating" :credits="generationCost" hotkey-enabled @click="outpaintingGeneration" />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Image } from '~~/server/database/schemas/image.schema';
import * as fabric from 'fabric';

const { $generationApi } = useNuxtApp();
const { t } = useI18n();
const { track } = usePosthog();
const { canvas } = useCanvas();

const toast = useToast();
const imageStore = useImageStore();
const userStore = useUserStore();

const props = defineProps<{
    originalImageId: string;
}>();

const isGenerating = ref(false);
const generationCost = ref(1);

const form = ref({
    originalImageId: props.originalImageId,
    dimensions: {
        width: 1270,
        height: 720,
    },
    position: {
        x: 635,
        y: 360,
    },
    image: {
        width: 1270,
        height: 720,
    },
    scale: 1,
});

const scaledWidth = computed(() => Math.round(form.value.image.width * form.value.scale));
const scaledHeight = computed(() => Math.round(form.value.image.height * form.value.scale));

function getBackground(): fabric.FabricImage | null {
    if (!canvas.value) return null;
    const bgAsBackground = (canvas.value.backgroundImage as any) || null;
    if (bgAsBackground) return bgAsBackground;
    // Fallback: locate background image after it was converted into a canvas object
    const byId = canvas.value.getObjects().find((o: any) => o?.id === 'background-image');
    if (byId) return byId as any;
    const firstImage = canvas.value.getObjects().find((o: any) => o?.type === 'image');
    return (firstImage as any) || null;
}

function ensureBackgroundInteractive(): fabric.FabricImage | null {
    if (!canvas.value) return null;
    let bg = getBackground();
    if (!bg) return null;

    // If background image isn't part of objects list, move it into the canvas objects to allow controls
    const isInObjects = canvas.value.getObjects().includes(bg as any);
    if (!isInObjects) {
        // remove as background and add as object
        (canvas.value as any).backgroundImage = undefined;
        canvas.value.add(bg);
        (bg as any).moveTo(0);
    }

    bg.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockRotation: true,
        originX: 'center',
        originY: 'center',
    } as any);

    // Select it so handles are visible immediately
    canvas.value.setActiveObject(bg);
    canvas.value.requestRenderAll();

    // Sync form now that it's an interactive object
    syncFromBackgroundToForm();

    // Live sync while moving/scaling
    (bg as any).on('moving', syncFromBackgroundToForm);
    (bg as any).on('scaling', syncFromBackgroundToForm);
    (bg as any).on('modified', syncFromBackgroundToForm);

    return bg;
}

function syncFromBackgroundToForm() {
    const bg = getBackground();
    if (!bg) return;
    // origin is center per useCanvas.setBackgroundImage
    form.value.position.x = Number(bg.left as any) || 0;
    form.value.position.y = Number(bg.top as any) || 0;
    form.value.scale = Number(bg.scaleX as any) || 1;
    // update original image dimensions (unscaled)
    // Prefer natural width/height if available on Fabric image element
    const element = (bg as any)?._element as HTMLImageElement | undefined;
    const naturalW = Number(element?.naturalWidth || (bg as any).width || 0);
    const naturalH = Number(element?.naturalHeight || (bg as any).height || 0);
    form.value.image.width = Math.round(naturalW);
    form.value.image.height = Math.round(naturalH);
    // keep dimensions in sync with canvas logical size
    if (canvas.value) {
        form.value.dimensions.width = canvas.value.getWidth();
        form.value.dimensions.height = canvas.value.getHeight();
    }
}

function applyFormToBackground() {
    const bg = getBackground();
    if (!bg || !canvas.value) return;
    const newScale = Math.max(0.05, Math.min(5, Number(form.value.scale)));
    bg.set({
        left: Number(form.value.position.x),
        top: Number(form.value.position.y),
        scaleX: newScale,
        scaleY: newScale,
        originX: 'center',
        originY: 'center',
    } as any);
    bg.setCoords();
    canvas.value.requestRenderAll();
}

// Drag to move background
const isDragging = ref(false);
const lastPointer = ref<{ x: number, y: number } | null>(null);

function onMouseDown(e: fabric.TPointerEventInfo) {
    if (!canvas.value) return;
    // If user is interacting with an object (e.g., background), let Fabric handle it
    if ((e as any).target) return;
    isDragging.value = true;
    const p = canvas.value.getViewportPoint(e.e);
    lastPointer.value = { x: p.x, y: p.y };
    // disable object selection while dragging background
    canvas.value.defaultCursor = 'grabbing';
}

function onMouseMove(e: fabric.TPointerEventInfo) {
    if (!canvas.value || !isDragging.value || !lastPointer.value) return;
    const p = canvas.value.getViewportPoint(e.e);
    const dx = p.x - lastPointer.value.x;
    const dy = p.y - lastPointer.value.y;
    const bg = getBackground();
    if (bg) {
        bg.left = (bg.left || 0) + dx;
        bg.top = (bg.top || 0) + dy;
        bg.setCoords();
        canvas.value.requestRenderAll();
        syncFromBackgroundToForm();
    }
    lastPointer.value = { x: p.x, y: p.y };
}

function onMouseUp() {
    if (!canvas.value) return;
    isDragging.value = false;
    lastPointer.value = null;
    canvas.value.defaultCursor = 'default';
}

function onMouseWheel(opt: fabric.TEvent) {
    if (!canvas.value) return;
    const event = opt.e as WheelEvent;
    const delta = event.deltaY;
    let next = Number(form.value.scale) * Math.pow(0.999, delta);
    next = Math.max(0.05, Math.min(5, next));
    form.value.scale = Number(next.toFixed(4));
}

function fitBackgroundToCanvas() {
    const bg = getBackground();
    if (!bg || !canvas.value) return;
    const cw = canvas.value.getWidth();
    const ch = canvas.value.getHeight();
    const iw = bg.width || 1;
    const ih = bg.height || 1;
    const scale = Math.min(cw / iw, ch / ih);
    form.value.scale = scale;
    form.value.position.x = cw / 2;
    form.value.position.y = ch / 2;
}

function centerBackground() {
    if (!canvas.value) return;
    form.value.position.x = canvas.value.getWidth() / 2;
    form.value.position.y = canvas.value.getHeight() / 2;
}

const outpaintingGeneration = async () => {
    if (!canvas.value) return;

    try {
        isGenerating.value = true;
        // ensure form is in sync with current background before sending
        syncFromBackgroundToForm();
        const generatedImage = await $generationApi<Image>('/outpainting', {
            method: 'POST',
            body: form.value,
            headers: {
                'X-Activity': 'OUTPAINTING',
                'X-Credits': String(generationCost.value),
            },
        });

        track('image.outpainting.generated', {
            credits: generationCost.value,
            email: userStore.user?.email,
            tier: userStore.tier?.name,
        });
        imageStore.addImage(generatedImage);
        // remove all from the image before navigating to the new image
        if (canvas.value) {
            canvas.value.clear();
            canvas.value.requestRenderAll();
        }
        
        await imageStore.selectImage(generatedImage.id);
        await navigateTo(`/images/${generatedImage.id}`);
    } catch (error: any) {
        console.error("Error generating outpainting image", error);
        toast.show({
            title: t('common.errors.title'),
            message: error.message,
            status: 'error',
        });
    } finally {
        isGenerating.value = false;
    }
}

// Keep background synced to form edits
watch(() => ({
    x: form.value.position.x,
    y: form.value.position.y,
    scale: form.value.scale,
}), () => applyFormToBackground());

onMounted(() => {
    // initialize from current background image once available
    setTimeout(() => { ensureBackgroundInteractive(); syncFromBackgroundToForm(); }, 50);
    setTimeout(() => { ensureBackgroundInteractive(); syncFromBackgroundToForm(); }, 250);

    // Ensure background is interactive and selected when Outpainting tool mounts (including preselected case)
    setTimeout(ensureBackgroundInteractive, 60);
    setTimeout(ensureBackgroundInteractive, 260);

    if (!canvas.value) return;
    canvas.value.on('mouse:down', onMouseDown as any);
    canvas.value.on('mouse:move', onMouseMove as any);
    canvas.value.on('mouse:up', onMouseUp as any);
    canvas.value.on('mouse:wheel', onMouseWheel as any);
});

onBeforeUnmount(() => {
    if (!canvas.value) return;
    canvas.value.off('mouse:down', onMouseDown as any);
    canvas.value.off('mouse:move', onMouseMove as any);
    canvas.value.off('mouse:up', onMouseUp as any);
    canvas.value.off('mouse:wheel', onMouseWheel as any);
    const bg = getBackground();
    if (bg) {
        (bg as any).off('moving', syncFromBackgroundToForm);
        (bg as any).off('scaling', syncFromBackgroundToForm);
        (bg as any).off('modified', syncFromBackgroundToForm);
    }
});
</script>

<style scoped>

</style>