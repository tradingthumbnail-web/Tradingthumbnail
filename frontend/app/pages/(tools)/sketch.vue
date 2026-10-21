<template>
    <div class="flex flex-col gap-6 h-full" data-tour="sketch-page">
        <!-- Title & subtitle -->
        <div class="flex flex-col gap-1 flex-shrink-0">
            <h1 class="text-2xl font-semibold text-base-content">{{ $t('sketch.title') }}</h1>
            <p class="text-sm text-base-content/70">{{ $t('sketch.description') }}</p>
        </div>

        <!-- Main layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
            <!-- Left settings panel -->
            <div
                class="card bg-base-200 border border-base-200 transition p-4 lg:col-span-4 flex flex-col overflow-hidden" data-tour="sketch-forms">
                <div class="flex flex-col gap-6 flex-1 overflow-y-auto p-2">
                    <!-- Reference type -->
                    <div class="form-control flex flex-col gap-2" data-tour="sketch-reference-type">
                        <label class="label">
                            <span class="label-text text-sm font-medium">{{ $t('sketch.referenceType') }}</span>
                        </label>
                        <div class="join w-full">
                            <button type="button" class="btn btn-sm join-item" data-tour="sketch-reference-type-image"
                                :class="form.referenceType === 'image' ? 'btn-primary' : 'btn-ghost border border-base-content/20'"
                                @click="form.referenceType = 'image'">
                                <Icon name="lucide:image" class="w-4 h-4" />
                                <span class="ml-1">{{ $t('common.image') }}</span>
                            </button>
                            <button type="button" class="btn btn-sm join-item" data-tour="sketch-reference-type-avatar"
                                :class="form.referenceType === 'avatar' ? 'btn-primary' : 'btn-ghost border border-base-content/20'"
                                @click="form.referenceType = 'avatar'">
                                <Icon name="lucide:user" class="w-4 h-4" />
                                <span class="ml-1">{{ $t('common.avatar') }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Avatar selector (when avatar) -->
                    <div v-if="form.referenceType === 'avatar'" class="form-control flex flex-col gap-6" data-tour="sketch-avatar-selector">
                        <BaseAvatarSelector :avatars="avatars" :avatarId="form.avatarId" @update:avatarId="form.avatarId = $event; avatarStore.getTotalTrainingImages(form.avatarId)" />
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2" v-if="form.avatarId">
                            <BaseKiThumbsImage
                                v-for="imageIndex in avatarStore.totalTrainingImages"
                                :key="imageIndex"
                                :src="`/api/v1/avatar/${form.avatarId}/training-image/${imageIndex}/view`"
                                alt="Avatar"
                                :container-class="`w-full h-full rounded transition-all duration-300 ease-out cursor-pointer ${form.trainingImageIndex === imageIndex ? 'border-4 border-primary shadow-primary/20 shadow-lg' : 'border border-base-content/20 hover:bg-base-200'}`"
                                @click="form.trainingImageIndex = imageIndex"
                            />
                        </div>
                    </div>

                    <!-- Image upload (when image) -->
                    <div v-if="form.referenceType === 'image'" class="form-control flex flex-col gap-2" data-tour="sketch-image-upload">
                        <label class="label">
                            <span class="label-text text-sm font-medium text-wrap">{{ $t('sketch.uploadReferenceImage') }}</span>
                        </label>
                        <input type="file" accept="image/*" class="file-input file-input-bordered file-input-sm w-full"
                            @change="onFile" />
                        <div v-if="referencePreview" class="mt-2 text-xs text-base-content/70 flex items-center gap-2">
                            <img :src="referencePreview" alt="preview" class="h-10 w-10 rounded object-cover" />
                            <span>{{ $t('common.preview') }}</span>
                        </div>
                    </div>

                    <!-- Style selector -->
                    <div class="form-control flex flex-col gap-2" data-tour="sketch-style">
                        <div class="label flex items-center justify-between">
                            <span class="label-text text-sm font-medium">{{ $t('sketch.selectStyle') }}</span>
                            <button 
                                type="button" 
                                class="btn btn-accent btn-sm gap-2"
                                @click="isStyleModalOpen = true"
                            >
                                <Icon name="lucide:palette" size="14" mode="svg" />
                                {{ $t('sketch.selectStyle') }}
                            </button>
                        </div>
                        <div v-if="selectedStyle" class="flex items-center gap-2 p-2 bg-base-200 rounded-box">
                            <div class="flex flex-col gap-2 border border-base-content/20 rounded-box p-4 bg-base-100">
                                <div class="flex w-full items-center justify-between">
                                    <span class="text-sm font-medium text-base-content/80">{{ selectedStyle.name }}</span>
                                    <button 
                                        type="button"
                                        class="btn btn-ghost btn-xs ml-auto"
                                        @click="selectStyle(null)"
                                    >
                                        <Icon name="lucide:x" size="14" mode="svg" />
                                    </button>
                                </div>
                                <BaseKiThumbsImage 
                                    :src="`/api/v1/style/${selectedStyle.id}/view`" 
                                    alt="Style" 
                                    class="rounded"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <BaseGenerateButton :isLoading="isGenerating" :credits="generationCost" :hotkeyEnabled="true" @click="validateAndGenerate" data-tour="sketch-generate" />
            </div>

            <!-- Right canvas panel -->
            <div
                class="card bg-base-200 border border-base-200 transition p-4 lg:col-span-8 flex flex-col overflow-hidden" data-tour="sketch-canvas">
                <!-- Toolbar -->
                <div class="flex items-center gap-2 flex-shrink-0 flex-wrap"  data-tour="sketch-add-elements">
                    <div class="join bg-base-100">
                        <button type="button" class="btn btn-sm join-item btn-ghost border border-base-content/40"
                            @click="addTextBlock" data-tour="sketch-add-text">
                            <Icon name="lucide:text" class="w-4 h-4" />
                            <span class="ml-1">{{ $t('sketch.addText') }}</span>
                        </button>
                        <button type="button" class="btn btn-sm join-item btn-ghost border border-base-content/40"
                            @click="addInstructionBlock" data-tour="sketch-add-instruction">
                            <Icon name="lucide:lightbulb" class="w-4 h-4" />
                            <span class="ml-1">{{ $t('sketch.addInstruction') }}</span>
                        </button>
                        <button type="button" class="btn btn-sm join-item btn-ghost border border-base-content/40"
                            @click="addPersonBlock" data-tour="sketch-add-person">
                            <Icon name="lucide:user-round-plus" class="w-4 h-4" />
                            <span class="ml-1">{{ $t('sketch.addPerson') }}</span>
                        </button>
                        <button type="button" class="btn btn-sm join-item btn-ghost border border-base-content/40"
                            @click="openAssetModal" data-tour="sketch-add-assets">
                            <Icon name="lucide:image-plus" class="w-4 h-4" />
                            <span class="ml-1">{{ $t('sketch.addAsset') }}</span>
                        </button>
                    </div>
                    <div class="ml-auto flex items-center gap-2">
                        <button type="button" class="btn btn-sm btn-ghost border border-base-content/40 tooltip tooltip-bottom" :data-tip="$t('sketch.deleteSelected')"
                            :class="hasSelection ? '' : 'btn-disabled'" @click="deleteSelected">
                            <Icon name="lucide:trash-2" class="w-4 h-4" />
                        </button>
                        <button type="button" class="btn btn-sm btn-ghost border border-base-content/40 tooltip tooltip-bottom" :data-tip="$t('sketch.clearCanvas')"
                            @click="clearCanvas">
                            <Icon name="lucide:eraser" class="w-4 h-4" />
                        </button>
                        <button type="button" class="btn btn-sm btn-ghost border border-base-content/40 tooltip tooltip-bottom" :data-tip="$t('common.download')"
                            @click="downloadImage">
                            <Icon name="lucide:download" class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <!-- Canvas area (always 1270x720 logical; scales to fit) -->
                <div class="mt-3 flex-1 overflow-auto">
                    <div
                        class="rounded-[var(--radius-box)] border border-base-200 bg-base-200/40 aspect-video w-full min-h-[300px] flex items-center justify-center relative">
                        <!-- Canvas host - always rendered -->
                        <div ref="canvasHost" class="w-full h-full p-4 flex items-center justify-center bg-white">
                            <!-- Empty state message inside canvas host -->
                            <div v-if="!hasBlocks" class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div class="text-base-content/60 text-sm flex flex-col items-center gap-2">
                                    <Icon name="lucide:mouse-pointer-square-dashed" class="w-5 h-5" />
                                    <span>{{ $t('sketch.canvasEmpty') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <BaseAssetModal v-model="isAssetModalOpen" :multiple="true" @confirm="onAssetsPicked" />
        
        <!-- Style Selection Modal -->
        <BaseModal v-model="isStyleModalOpen" size="lg">
            <div class="p-6 flex flex-col gap-4 h-full max-h-[80vh]">
                <div class="flex items-center justify-between">
                    <h3 class="text-xl font-semibold">{{ $t('sketch.selectStyle') }}</h3>
                    <button 
                        type="button"
                        class="btn btn-ghost btn-sm btn-circle"
                        @click="isStyleModalOpen = false"
                    >
                        <Icon name="lucide:x" size="20" mode="svg" />
                    </button>
                </div>
                <div class="overflow-y-auto flex-1">
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        <div 
                            v-for="style in styles" 
                            :key="style.id" 
                            class="card cursor-pointer transition-all duration-200 hover:shadow-lg border"
                            :class="form.styleId === style.id ? 'bg-primary/10 border-primary shadow-primary/20 shadow-lg' : 'bg-base-200 border-base-content/20 hover:bg-base-200'" 
                            @click="selectStyle(style.id); isStyleModalOpen = false"
                        >
                            <div class="card-body p-3 flex flex-col items-center gap-2">
                                <BaseKiThumbsImage 
                                    :src="`/api/v1/style/${style.id}/view`" 
                                    alt="Style" 
                                    
                                    class="rounded"
                                />
                                <span class="truncate text-xs text-base-content/60 w-full text-center">{{ style.name }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    </div>
    <div v-if="showMissingReferenceModal" class="modal modal-open">
        <div class="modal-box">
            <h3 class="font-bold text-lg">{{ $t('sketch.missingReference') }}</h3>
            <p class="py-4 text-sm">
                <span v-if="form.referenceType === 'image'">{{ $t('sketch.noReferenceImageWarning') }}</span>
                <span v-else>{{ $t('sketch.noAvatarWarning') }}</span>
            </p>
            <div class="modal-action">
                <button type="button" class="btn btn-ghost" @click="showMissingReferenceModal = false">
                    {{ $t('common.cancel') }}
                </button>
                <button type="button" class="btn btn-primary" @click="handleGenerateAnyway">
                    {{ $t('sketch.generateAnyway') }}
                </button>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop" @click="showMissingReferenceModal = false"></form>
    </div>
</template>

<script setup lang="ts">
import type { Style } from '~~/server/database/schemas/style.schema';
import { useSketchTour } from '~~/app/composables/useDriver/sketch';

import * as fabric from 'fabric';
import type { Image } from '~~/server/database/schemas/image.schema';

const THUMB_WIDTH = 1270;
const THUMB_HEIGHT = 720;

const { $generationApi } = useNuxtApp();
const { t } = useI18n();
const { compressImageFile } = useFile();
const { openAssetModalFromDriver } = useSketchTour();
const toast = useToast();
const imageStore = useImageStore();
const avatarStore = useAvatarStore();
const userStore = useUserStore();

const { data: avatars } = await useFetch('/api/v1/avatar');
const { data: styles } = await useFetch<Style[]>('/api/v1/style');
const isAssetModalOpen = ref(false);

const form = ref({
    referenceType: 'image' as 'image' | 'avatar',
    avatarId: null as string | null,
    trainingImageIndex: 1 as number | null,
    styleId: null as string | null,
});

const isGenerating = ref(false);
const referencePreview = ref<string | null>(null);
const referenceBase64 = ref<string | null>(null);
const hasBlocks = ref(false);
const hasSelection = ref(false);
const canvasHost = ref<HTMLDivElement | null>(null);
let canvas = shallowRef<fabric.Canvas | null>(null);
const showMissingReferenceModal = ref(false);
const isStyleModalOpen = ref(false);

const selectedStyle = computed(() => {
    return styles.value?.find(s => s.id === form.value.styleId) || null;
});

const generationCost = computed(() => {
    return 3;
});

async function onFile(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files && target.files[0] ? target.files[0] : null;
    if (file) {
        referencePreview.value = URL.createObjectURL(file);
        referenceBase64.value = await compressImageFile(file, 1536, 0.75);
    }
}

// Initialize canvas once DOM is ready
function initCanvas() {
    if (!canvasHost.value || canvas.value) return;
    
    const c = document.createElement('canvas');
    c.setAttribute('aria-label', 'Sketch canvas');
    c.className = 'w-full h-full';
    canvasHost.value.appendChild(c);
    
    canvas.value = new fabric.Canvas(c, {
        width: THUMB_WIDTH,
        height: THUMB_HEIGHT,
        selection: true,
        enableRetinaScaling: false,
    });
    
    // Register event listeners
    canvas.value.on('object:modified', saveCanvas);
    canvas.value.on('object:added', () => {
        hasBlocks.value = canvas.value ? canvas.value.getObjects().length > 0 : false;
        saveCanvas();
    });
    canvas.value.on('object:removed', () => {
        hasBlocks.value = canvas.value ? canvas.value.getObjects().length > 0 : false;
        saveCanvas();
    });
    canvas.value.on('selection:created', () => hasSelection.value = !!canvas.value?.getActiveObject());
    canvas.value.on('selection:updated', () => hasSelection.value = !!canvas.value?.getActiveObject());
    canvas.value.on('selection:cleared', () => hasSelection.value = false);
    
    // Try to restore from localStorage
    const canvasData = localStorage.getItem('kithumbs-sketch-canvas');
    if (canvasData) {
        try {
            const parsed = JSON.parse(canvasData);
            canvas.value.loadFromJSON(parsed, () => {
                canvas.value?.requestRenderAll();
                hasBlocks.value = canvas.value ? canvas.value.getObjects().length > 0 : false;
            });
        } catch (e) {
            console.warn('Failed to restore canvas from localStorage', e);
        }
    }
    
    // Fit canvas to container
    nextTick(() => fitCanvas());
}

const saveCanvas = () => {
    if (!canvas.value) return;
    try {
        localStorage.setItem('kithumbs-sketch-canvas', JSON.stringify(canvas.value.toJSON()));
    } catch (e) {
        console.warn('Failed to save canvas to localStorage', e);
    }
};

function ensureCanvas() {
    if (!canvas.value) {
        initCanvas();
    }
}

function fitCanvas() {
    if (!canvas.value || !canvasHost.value) return;
    const rect = canvasHost.value.getBoundingClientRect();
    const containerWidth = Math.max(1, rect.width);
    const containerHeight = Math.max(1, rect.height);
    const scale = Math.min(containerWidth / THUMB_WIDTH, containerHeight / THUMB_HEIGHT);
    // Keep logical canvas at 1270x720 and scale via CSS only so export matches exactly
    canvas.value.setDimensions({ width: THUMB_WIDTH, height: THUMB_HEIGHT });
    canvas.value.setDimensions({ width: THUMB_WIDTH * scale, height: THUMB_HEIGHT * scale }, { cssOnly: true } as any);
    canvas.value.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.value.requestRenderAll();
}

// Handlers to add elements
function addTextBlock() {
    ensureCanvas();
    if (!canvas.value) return;
    const textbox = new fabric.Textbox(t('sketch.textBlock'), {
        left: THUMB_WIDTH / 2,
        top: THUMB_HEIGHT / 2,
        originX: 'center',
        originY: 'center',
        width: 640,
        fontSize: 72,
        fill: '#000',
        fontFamily: 'Inter, ui-sans-serif, system-ui',
        textAlign: 'center',
        strokeUniform: true,
        backgroundColor: '#ccc',
        cornerStyle: 'circle',
        rx: 0,
        ry: 0,
    });
    (textbox as any).kithumbsRole = 'TEXT';
    canvas.value.add(textbox);
    canvas.value.setActiveObject(textbox);
    canvas.value.requestRenderAll();
}

function addInstructionBlock() {
    ensureCanvas();
    if (!canvas.value) return;
    const textbox = new fabric.Textbox(t('sketch.instructionBlock'), {
        left: THUMB_WIDTH / 2,
        top: THUMB_HEIGHT / 2,
        originX: 'center',
        originY: 'center',
        width: 640,
        fontSize: 72,
        fill: '#1e40af',
        fontFamily: 'Inter, ui-sans-serif, system-ui',
        fontStyle: 'italic',
        textAlign: 'center',
        strokeUniform: true,
        backgroundColor: '#bfdbfe',
        cornerStyle: 'circle',
        rx: 40,
        ry: 40,
        stroke: '#3b82f6',
        strokeWidth: 2,
    });
    (textbox as any).kithumbsRole = 'INSTRUCTION';
    canvas.value.add(textbox);
    canvas.value.setActiveObject(textbox);
    canvas.value.requestRenderAll();
}

async function addPersonBlock() {
    ensureCanvas();
    if (!canvas.value) return;
    const result = await fabric.loadSVGFromURL("/img/user.svg");
    const objs = result.objects as fabric.FabricObject[];
    const svg = fabric.util.groupSVGElements(objs, result.options);
    const targetWidth = 120;
    svg.scaleToWidth(targetWidth);
    svg.set({ left: (THUMB_WIDTH - svg.getScaledWidth()) / 2, top: (THUMB_HEIGHT - svg.getScaledHeight()) / 2 });
    (svg as any).kithumbsRole = 'PERSON_PLACEHOLDER';
    canvas.value.add(svg);
    canvas.value.setActiveObject(svg);
    canvas.value.requestRenderAll();
}

function openAssetModal() {
    isAssetModalOpen.value = true;
};

watch(openAssetModalFromDriver, (value) => {
    if (value) {
        openAssetModal();
        openAssetModalFromDriver.value = false;
    }
});

async function onAssetsPicked(assets: { id: string; name: string }[]) {
    ensureCanvas();
    if (!canvas.value) return;

    // Add each selected asset as an image to the canvas
    for (const asset of assets) {
        const url = `/api/v1/asset/${asset.id}/view`;
        const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
        if (!img) continue;
        const maxW = 400; // reasonable default size
        img.scaleToWidth(maxW);
        img.set({
            left: (THUMB_WIDTH - img.getScaledWidth()) / 2,
            top: (THUMB_HEIGHT - img.getScaledHeight()) / 2,
        });
        (img as any).kithumbsRole = 'ASSET';
        canvas.value?.add(img);
        canvas.value?.setActiveObject(img);
        canvas.value?.requestRenderAll();
    }

    hasBlocks.value = !!canvas.value?.getObjects().length;
    saveCanvas();
}

function clearCanvas() {
    if (!canvas.value) return;
    canvas.value.clear();
    canvas.value.backgroundColor = '#ffffff';
    canvas.value.requestRenderAll();
    saveCanvas();
}

function downloadImage() {
    ensureCanvas();
    if (!canvas.value) return;
    // Export exactly 1270x720 (matches logical size and what user sees, scaled via CSS only)
    const data = canvas.value.toDataURL({ format: 'png', multiplier: 1 });
    const a = document.createElement('a');
    a.href = data;
    a.download = 'thumbnail-1270x720.png';
    a.click();
}

function deleteSelected() {
    if (!canvas.value) return;
    const obj = canvas.value.getActiveObject();
    if (!obj) return;
    canvas.value.remove(obj);
    canvas.value.discardActiveObject();
    canvas.value.requestRenderAll();
    hasSelection.value = !!canvas.value.getActiveObject();
}

const handler = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        e.preventDefault();
        deleteSelected();
    }
};

const selectStyle = (styleId: string | null) => {
    if (styleId === null || form.value.styleId === styleId) {
        form.value.styleId = null;
    } else {
        form.value.styleId = styleId;
    };
};

const validateAndGenerate = async () => {
    if (form.value.referenceType === 'image' && !referenceBase64.value) {
        showMissingReferenceModal.value = true;
        return;
    }

    if (form.value.referenceType === 'avatar' && !form.value.avatarId) {
        showMissingReferenceModal.value = true;
        return;
    }

    await generateSketch();
};

const handleGenerateAnyway = async () => {
    showMissingReferenceModal.value = false;
    await generateSketch();
};

const generateSketch = async () => {
    if (!canvas.value) return;

    try {
        isGenerating.value = true;
        
        canvas.value.backgroundColor = '#ffffff';
        canvas.value.requestRenderAll();
        const canvasDataURL = canvas.value.toDataURL({ format: 'jpeg', quality: 0.75, multiplier: 1 });

        // 2. Extract layout info to help gpt distinguish between text and instructions
        const objects = canvas.value.getObjects();
        const layoutMetadata = objects.map(obj => {
            const scaledW = Math.round(obj.getScaledWidth());
            const scaledH = Math.round(obj.getScaledHeight());
            const role = (obj as any).kithumbsRole || (obj.type === 'group' ? 'PERSON_PLACEHOLDER' : 'UNKNOWN');
            
            const common = {
                type: obj.type,
                left: Math.round(obj.left || 0),
                top: Math.round(obj.top || 0),
                width: scaledW,
                height: scaledH,
                role: role,
            };

            if (obj instanceof fabric.Textbox) {
                return {
                    ...common,
                    content: obj.text,
                    backgroundColor: obj.backgroundColor,
                };
            }
            
            return common;
        });

        // Send the canvas and metadata to the backend
        const generatedImage = await $generationApi<Image>('/sketch', {
            method: 'POST',
            body: {
                canvasDataURL,
                layoutMetadata,
                styleId: form.value.styleId,
                referenceType: form.value.referenceType,
                avatarId: form.value.avatarId,
                avatarTrainingImageIndex: form.value.trainingImageIndex ? form.value.trainingImageIndex.toString() : undefined,
                reference: form.value.referenceType === 'image' ? referenceBase64.value : undefined,
            },
            headers: {
                'X-Activity': 'GENERATE_SKETCH',
                'X-Credits': String(generationCost.value ?? "3"),
            },
        });

        imageStore.addImage(generatedImage);
        imageStore.selectedImage = generatedImage;

        await navigateTo(`/images/${generatedImage.id}`);
    } catch (error: any) {
        console.error(error);
        toast.show({
            title: t('common.errors.title'),
            message: error.message,
            status: 'error',
        });
    } finally {
        isGenerating.value = false;
    }
}

onMounted(() => {
    window.addEventListener('keydown', handler);
    window.addEventListener('resize', fitCanvas);
    
    // Initialize canvas after DOM is ready
    nextTick(() => {
        initCanvas();
    });
});

onUnmounted(() => {
    window.removeEventListener('keydown', handler);
    window.removeEventListener('resize', fitCanvas);
    
    // Dispose canvas and clean up
    if (canvas.value) {
        canvas.value.dispose();
        canvas.value = null;
    }
});

useHead({ title: clicklabPageTitle('Sketch') });
</script>

<style scoped></style>