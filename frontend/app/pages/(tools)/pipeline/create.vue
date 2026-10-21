<template>
    <div class="flex flex-col gap-6 h-full" data-tour="pipeline-create-page">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0" data-tour="pipeline-create-header">
            <div class="flex items-center gap-3">
                <NuxtLink to="/pipeline" class="btn btn-ghost btn-sm btn-circle">
                    <Icon name="lucide:arrow-left" class="w-4 h-4" />
                </NuxtLink>
                <div class="flex flex-col gap-1">
                    <h1 class="text-2xl font-semibold text-base-content">{{ $t('pipeline.editor.newPipeline') }}</h1>
                    <p class="text-sm text-base-content/70">{{ $t('pipeline.description') }}</p>
                </div>
            </div>
            <button 
                type="button" 
                data-tour="pipeline-create-save"
                class="btn btn-primary gap-2" 
                @click="savePipeline"
                :disabled="isSaving || !isValid"
            >
                <span v-if="isSaving" class="loading loading-spinner loading-sm"></span>
                <Icon v-else name="lucide:save" class="w-4 h-4" />
                {{ isSaving ? $t('pipeline.editor.saving') : $t('pipeline.editor.save') }}
            </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
            <div class="card bg-base-200 border border-base-200 p-4 lg:col-span-4 flex flex-col overflow-hidden">
                <div class="flex flex-col gap-6 flex-1 overflow-y-auto p-2" data-tour="pipeline-create-form">
                    <div class="form-control flex flex-col gap-2">
                        <label class="label">
                            <span class="label-text font-medium">{{ $t('pipeline.editor.name') }}</span>
                        </label>
                        <input 
                            type="text" 
                            class="input input-bordered w-full" 
                            :placeholder="$t('pipeline.editor.namePlaceholder')"
                            v-model="pipelineStore.editorName"
                        />
                    </div>

                    <div class="form-control flex flex-col gap-2">
                        <label class="label">
                            <span class="label-text font-medium">{{ $t('pipeline.editor.description') }}</span>
                        </label>
                        <textarea 
                            class="textarea textarea-bordered w-full" 
                            :placeholder="$t('pipeline.editor.descriptionPlaceholder')"
                            v-model="pipelineStore.editorDescription"
                            rows="2"
                        ></textarea>
                    </div>

                    <div class="divider my-0"></div>

                    <div class="flex flex-col gap-3" data-tour="pipeline-create-elements">
                        <span class="label-text font-medium">{{ $t('pipeline.editor.elements') }}</span>
                        
                        <div class="flex flex-wrap gap-2">
                            <button type="button" class="btn btn-sm btn-outline gap-2" @click="isAddAssetModalOpen = true">
                                <Icon name="lucide:image-plus" class="w-4 h-4" />
                                {{ $t('pipeline.editor.addAsset') }}
                            </button>
                            <button type="button" class="btn btn-sm btn-outline gap-2" @click="isAddTextModalOpen = true">
                                <Icon name="lucide:type" class="w-4 h-4" />
                                {{ $t('pipeline.editor.addText') }}
                            </button>
                            <button type="button" class="btn btn-sm btn-outline gap-2" @click="isAddAvatarModalOpen = true">
                                <Icon name="lucide:user-plus" class="w-4 h-4" />
                                {{ $t('pipeline.editor.addAvatar') }}
                            </button>
                        </div>
                    </div>

                    <div v-if="pipelineStore.editorElements.length === 0" class="flex-1 flex flex-col items-center justify-center gap-2 text-center py-8">
                        <Icon name="lucide:layers" class="w-10 h-10 text-base-content/30" />
                        <span class="text-sm text-base-content/60">{{ $t('pipeline.editor.noElements') }}</span>
                        <span class="text-xs text-base-content/40">{{ $t('pipeline.editor.noElementsDescription') }}</span>
                    </div>

                    <div v-else class="flex flex-col gap-2">
                        <div 
                            v-for="element in pipelineStore.editorElements" 
                            :key="element.id"
                            class="flex items-center gap-3 p-3 rounded-box border border-base-content/10 bg-base-100 group"
                        >
                            <Icon :name="getElementIcon(element.type)" class="w-4 h-4 text-primary flex-shrink-0" />
                            <div class="flex-1 min-w-0">
                                <span class="font-medium text-sm truncate block">{{ element.label }}</span>
                                <span class="text-xs text-base-content/50">
                                    {{ element.isConfigurable ? $t('pipeline.editor.configurable') : $t('pipeline.editor.fixed') }}
                                </span>
                            </div>
                            <button 
                                type="button" 
                                class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                                @click="removeElement(element.id)"
                            >
                                <Icon name="lucide:x" class="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card bg-base-200 border border-base-200 p-4 lg:col-span-8 flex flex-col overflow-hidden">
                <span class="label-text font-medium mb-3">{{ $t('pipeline.editor.canvasPreview') }}</span>
                
                <div class="flex-1 overflow-auto" data-tour="pipeline-create-canvas">
                    <div class="rounded-[var(--radius-box)] border border-base-200 bg-base-200/40 aspect-video w-full min-h-[300px] flex items-center justify-center relative">
                        <div ref="canvasHost" class="w-full h-full p-4 flex items-center justify-center bg-white">
                            <div v-if="!hasBlocks" class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div class="text-base-content/60 text-sm flex flex-col items-center gap-2">
                                    <Icon name="lucide:mouse-pointer-square-dashed" class="w-5 h-5" />
                                    <span>{{ $t('pipeline.editor.noElementsDescription') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 mt-3">
                    <button 
                        type="button" 
                        class="btn btn-sm btn-ghost border border-base-content/40"
                        :class="hasSelection ? '' : 'btn-disabled'" 
                        @click="deleteSelected"
                    >
                        <Icon name="lucide:trash-2" class="w-4 h-4" />
                    </button>
                    <button 
                        type="button" 
                        class="btn btn-sm btn-ghost border border-base-content/40"
                        @click="clearCanvas"
                    >
                        <Icon name="lucide:eraser" class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        <PipelineAddTextModal 
            v-model="isAddTextModalOpen" 
            @add="onTextAdded" 
        />
        <PipelineAddAssetModal 
            v-model="isAddAssetModalOpen" 
            @add="onAssetAdded" 
        />
        <PipelineAddAvatarModal 
            v-model="isAddAvatarModalOpen" 
            @add="onAvatarAdded" 
        />
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import * as fabric from 'fabric';
import type { PipelineElement } from '~~/server/database/schemas/pipeline.schema';
import { useDriver } from '~/composables/useDriver';

const THUMB_WIDTH = 1270;
const THUMB_HEIGHT = 720;

const { t } = useI18n();
const toast = useToast();
const router = useRouter();
const pipelineStore = usePipelineStore();
const driver = useDriver();

const canvasHost = ref<HTMLDivElement | null>(null);
let canvas = shallowRef<fabric.Canvas | null>(null);

const isAddTextModalOpen = ref(false);
const isAddAssetModalOpen = ref(false);
const isAddAvatarModalOpen = ref(false);
const isSaving = ref(false);
const hasBlocks = ref(false);
const hasSelection = ref(false);

const isValid = computed(() => {
    return pipelineStore.editorName.trim() && pipelineStore.editorElements.length > 0;
});

onMounted(async () => {
    pipelineStore.resetEditor();
    nextTick(() => initCanvas());
    window.addEventListener('resize', fitCanvas);
    window.addEventListener('keydown', handleKeydown);
    await driver.startTour('/pipeline/create');
});

onUnmounted(() => {
    window.removeEventListener('resize', fitCanvas);
    window.removeEventListener('keydown', handleKeydown);
    if (canvas.value) {
        canvas.value.dispose();
        canvas.value = null;
    }
});

function initCanvas() {
    if (!canvasHost.value || canvas.value) return;
    
    const c = document.createElement('canvas');
    c.className = 'w-full h-full';
    canvasHost.value.appendChild(c);
    
    canvas.value = new fabric.Canvas(c, {
        width: THUMB_WIDTH,
        height: THUMB_HEIGHT,
        selection: true,
        enableRetinaScaling: false,
    });
    
    canvas.value.on('object:added', updateHasBlocks);
    canvas.value.on('object:removed', updateHasBlocks);
    canvas.value.on('selection:created', () => hasSelection.value = true);
    canvas.value.on('selection:updated', () => hasSelection.value = true);
    canvas.value.on('selection:cleared', () => hasSelection.value = false);
    
    nextTick(() => fitCanvas());
}

function fitCanvas() {
    if (!canvas.value || !canvasHost.value) return;
    const rect = canvasHost.value.getBoundingClientRect();
    const containerWidth = Math.max(1, rect.width);
    const containerHeight = Math.max(1, rect.height);
    const scale = Math.min(containerWidth / THUMB_WIDTH, containerHeight / THUMB_HEIGHT);
    canvas.value.setDimensions({ width: THUMB_WIDTH, height: THUMB_HEIGHT });
    canvas.value.setDimensions({ width: THUMB_WIDTH * scale, height: THUMB_HEIGHT * scale }, { cssOnly: true } as any);
    canvas.value.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.value.requestRenderAll();
}

function updateHasBlocks() {
    hasBlocks.value = canvas.value ? canvas.value.getObjects().length > 0 : false;
}

function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        e.preventDefault();
        deleteSelected();
    }
}

function deleteSelected() {
    if (!canvas.value) return;
    const obj = canvas.value.getActiveObject();
    if (!obj) return;
    
    const elementId = (obj as any).pipelineElementId;
    if (elementId) {
        pipelineStore.removeElement(elementId);
    }
    
    canvas.value.remove(obj);
    canvas.value.discardActiveObject();
    canvas.value.requestRenderAll();
    hasSelection.value = false;
}

function clearCanvas() {
    if (!canvas.value) return;
    canvas.value.clear();
    canvas.value.backgroundColor = '#ffffff';
    canvas.value.requestRenderAll();
    pipelineStore.editorElements = [];
}

function removeElement(elementId: string) {
    const objects = canvas.value?.getObjects() || [];
    const obj = objects.find((o: any) => o.pipelineElementId === elementId);
    if (obj && canvas.value) {
        canvas.value.remove(obj);
        canvas.value.requestRenderAll();
    }
    pipelineStore.removeElement(elementId);
}

function getElementIcon(type: PipelineElement['type']) {
    switch (type) {
        case 'ASSET': return 'lucide:image';
        case 'AVATAR': return 'lucide:user';
        case 'TEXT': return 'lucide:type';
        default: return 'lucide:box';
    }
}

async function onTextAdded(element: Omit<PipelineElement, 'fabricObjectId' | 'position'>) {
    if (!canvas.value) return;
    
    const displayText = element.isConfigurable 
        ? (element.textOptions?.defaultText || element.textOptions?.placeholder || element.label)
        : (element.textOptions?.fixedText || element.label);
    
    const textbox = new fabric.Textbox(displayText, {
        left: THUMB_WIDTH / 2,
        top: THUMB_HEIGHT / 2,
        originX: 'center',
        originY: 'center',
        width: 640,
        fontSize: 72,
        fill: element.isConfigurable ? '#1e40af' : '#000',
        fontFamily: 'Inter, ui-sans-serif, system-ui',
        textAlign: 'center',
        backgroundColor: element.isConfigurable ? '#bfdbfe' : '#e5e5e5',
        cornerStyle: 'circle',
    });
    
    const fabricObjectId = crypto.randomUUID();
    (textbox as any).pipelineElementId = element.id;
    
    canvas.value.add(textbox);
    canvas.value.setActiveObject(textbox);
    canvas.value.requestRenderAll();
    
    const fullElement: PipelineElement = {
        ...element,
        fabricObjectId,
        position: {
            x: textbox.left || 0,
            y: textbox.top || 0,
            width: textbox.getScaledWidth(),
            height: textbox.getScaledHeight(),
        },
    };
    
    pipelineStore.addElement(fullElement);
}

async function onAssetAdded(element: Omit<PipelineElement, 'fabricObjectId' | 'position'>, firstAssetId: string) {
    if (!canvas.value) return;
    
    try {
        const url = `/api/v1/asset/${firstAssetId}/view`;
        const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
        if (!img) return;
        
        const maxW = 400;
        img.scaleToWidth(maxW);
        img.set({
            left: (THUMB_WIDTH - img.getScaledWidth()) / 2,
            top: (THUMB_HEIGHT - img.getScaledHeight()) / 2,
        });
        
        const fabricObjectId = crypto.randomUUID();
        (img as any).pipelineElementId = element.id;
        
        canvas.value.add(img);
        canvas.value.setActiveObject(img);
        canvas.value.requestRenderAll();
        
        const fullElement: PipelineElement = {
            ...element,
            fabricObjectId,
            position: {
                x: img.left || 0,
                y: img.top || 0,
                width: img.getScaledWidth(),
                height: img.getScaledHeight(),
            },
        };
        
        pipelineStore.addElement(fullElement);
    } catch (error) {
        console.error('Failed to load asset image', error);
    }
}

async function onAvatarAdded(element: Omit<PipelineElement, 'fabricObjectId' | 'position'>) {
    if (!canvas.value) return;
    
    try {
        const result = await fabric.loadSVGFromURL("/img/user.svg");
        const objs = result.objects as fabric.FabricObject[];
        const svg = fabric.util.groupSVGElements(objs, result.options);
        
        const targetWidth = 200;
        svg.scaleToWidth(targetWidth);
        svg.set({ 
            left: (THUMB_WIDTH - svg.getScaledWidth()) / 2, 
            top: (THUMB_HEIGHT - svg.getScaledHeight()) / 2 
        });
        
        const fabricObjectId = crypto.randomUUID();
        (svg as any).pipelineElementId = element.id;
        
        canvas.value.add(svg);
        canvas.value.setActiveObject(svg);
        canvas.value.requestRenderAll();
        
        const fullElement: PipelineElement = {
            ...element,
            fabricObjectId,
            position: {
                x: svg.left || 0,
                y: svg.top || 0,
                width: svg.getScaledWidth(),
                height: svg.getScaledHeight(),
            },
        };
        
        pipelineStore.addElement(fullElement);
    } catch (error) {
        console.error('Failed to load avatar placeholder', error);
    }
}

async function savePipeline() {
    if (!isValid.value || !canvas.value) return;
    
    isSaving.value = true;
    try {
        const objects = canvas.value.getObjects();
        for (const elem of pipelineStore.editorElements) {
            const obj = objects.find((o: any) => o.pipelineElementId === elem.id);
            if (obj) {
                pipelineStore.updateElement(elem.id, {
                    position: {
                        x: obj.left || 0,
                        y: obj.top || 0,
                        width: obj.getScaledWidth(),
                        height: obj.getScaledHeight(),
                    },
                });
            }
        }
        
        const fabricJson = canvas.value.toJSON();
        const canvasData = pipelineStore.getCanvasData(fabricJson);
        
        await pipelineStore.createPipeline({
            name: pipelineStore.editorName,
            description: pipelineStore.editorDescription || undefined,
            canvasData,
            config: pipelineStore.editorConfig,
        });
        
        toast.show({
            title: t('common.success.title'),
            message: t('pipeline.editor.saveSuccess'),
            status: 'success',
        });
        
        router.push('/pipeline');
    } catch (error: any) {
        toast.show({
            title: t('common.errors.title'),
            message: error.message,
            status: 'error',
        });
    } finally {
        isSaving.value = false;
    }
}

useHead({ title: clicklabPageTitle(t('pipeline.editor.newPipeline')) });
</script>