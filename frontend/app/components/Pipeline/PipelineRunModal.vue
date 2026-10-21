<template>
    <BaseModal :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" size="lg">
        <div class="flex flex-col h-full max-h-[85vh] bg-base-200" v-if="pipeline">
            <div class="p-6 flex flex-col gap-1 flex-shrink-0 border-b border-base-content/10">
                <h3 class="text-xl font-semibold">{{ $t('pipeline.runModal.title') }}: {{ pipeline.name }}</h3>
                <p class="text-sm text-base-content/60">{{ $t('pipeline.runModal.subtitle') }}</p>
            </div>

            <div class="flex-1 overflow-y-auto p-6">
                <div v-if="configurableElements.length === 0" class="text-center py-8 text-base-content/60">
                    {{ $t('pipeline.editor.noElements') }}
                </div>

                <div v-else class="flex flex-col gap-6">
                    <div 
                        v-for="element in configurableElements" 
                        :key="element.id" 
                        class="form-control flex flex-col gap-2"
                    >
                        <label class="label">
                            <span class="label-text font-medium flex items-center gap-2">
                                <Icon :name="getElementIcon(element)" class="w-4 h-4 text-primary" />
                                {{ element.label }}
                            </span>
                        </label>

                        <input 
                            v-if="element.type === 'TEXT'"
                            type="text"
                            class="input input-bordered w-full"
                            :placeholder="element.textOptions?.placeholder"
                            v-model="formValues[element.id]!.text"
                        />

                        <div v-else-if="element.type === 'ASSET'" class="dropdown dropdown-bottom w-full">
                            <label tabindex="0" class="btn btn-ghost w-full justify-start gap-3 border border-base-content/20 h-auto min-h-12 py-2 bg-base-100">
                                <img 
                                    v-if="formValues[element.id]?.assetId" 
                                    :src="`/api/v1/asset/${formValues[element.id]?.assetId}/view`" 
                                    class="w-10 h-10 rounded object-cover flex-shrink-0"
                                />
                                <div v-else class="w-10 h-10 rounded bg-base-300 flex items-center justify-center flex-shrink-0">
                                    <Icon name="lucide:image" class="w-5 h-5 text-base-content/40" />
                                </div>
                                <span class="truncate">{{ getAssetName(formValues[element.id]?.assetId || '') || $t('pipeline.runModal.selectAsset') }}</span>
                                <Icon name="lucide:chevron-down" class="w-4 h-4 ml-auto flex-shrink-0" />
                            </label>
                            <ul tabindex="0" class="dropdown-content menu bg-base-200 rounded-box w-full max-h-60 overflow-y-auto shadow-lg z-50 p-2">
                                <li v-for="assetId in element.assetOptions?.assetIds" :key="assetId">
                                    <a 
                                        class="flex items-center gap-3 p-2"
                                        :class="formValues[element.id]?.assetId === assetId ? 'active' : ''"
                                        @click="formValues[element.id]!.assetId = assetId"
                                    >
                                        <img 
                                            :src="`/api/v1/asset/${assetId}/view`" 
                                            class="w-12 h-12 rounded object-cover flex-shrink-0"
                                        />
                                        <span class="truncate">{{ getAssetName(assetId) }}</span>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <template v-else-if="element.type === 'AVATAR'">
                            <div v-if="element.avatarOptions?.characterType === 'uploadable'" class="flex flex-col gap-3">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    class="file-input file-input-bordered w-full"
                                    @change="onCharacterImageUpload(element.id, $event)"
                                />
                                <div v-if="characterPreviews[element.id]" class="flex items-center gap-3 p-3 rounded-box">
                                    <img 
                                        :src="characterPreviews[element.id]" 
                                        class="w-16 h-16 rounded object-cover"
                                    />
                                    <div class="flex flex-col gap-1">
                                        <span class="text-sm font-medium">{{ $t('pipeline.runModal.imageLoaded') }}</span>
                                        <button 
                                            type="button" 
                                            class="btn btn-ghost btn-xs"
                                            @click="clearCharacterImage(element.id)"
                                        >
                                            <Icon name="lucide:x" class="w-3 h-3" />
                                            {{ $t('common.remove') }}
                                        </button>
                                    </div>
                                </div>
                                <div v-else class="text-sm text-base-content/60 flex items-center gap-2">
                                    <Icon name="lucide:info" class="w-4 h-4" />
                                    {{ $t('pipeline.runModal.noImageSelected') }}
                                </div>
                            </div>

                            <div v-else class="dropdown dropdown-bottom w-full">
                                <label tabindex="0" class="btn btn-ghost w-full justify-start gap-3 border border-base-content/20 h-auto min-h-12 py-2">
                                    <img 
                                        v-if="formValues[element.id]?.avatarId" 
                                        :src="`/api/v1/avatar/${formValues[element.id]?.avatarId}/training-image/1/view`" 
                                        class="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                    />
                                    <div v-else class="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center flex-shrink-0">
                                        <Icon name="lucide:user" class="w-5 h-5 text-base-content/40" />
                                    </div>
                                    <span class="truncate">{{ getAvatarName(formValues[element.id]?.avatarId || '') || $t('pipeline.runModal.selectAvatar') }}</span>
                                    <Icon name="lucide:chevron-down" class="w-4 h-4 ml-auto flex-shrink-0" />
                                </label>
                                <ul tabindex="0" class="dropdown-content menu rounded-box w-full max-h-60 overflow-y-auto shadow-lg z-50 p-2">
                                    <li v-for="avatarId in element.avatarOptions?.avatarIds" :key="avatarId">
                                        <a 
                                            class="flex items-center gap-3 p-2"
                                            :class="formValues[element.id]?.avatarId === avatarId ? 'active' : ''"
                                            @click="formValues[element.id]!.avatarId = avatarId"
                                        >
                                            <img 
                                                :src="`/api/v1/avatar/${avatarId}/training-image/1/view`" 
                                                class="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                            />
                                            <span class="truncate">{{ getAvatarName(avatarId) }}</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </template>
                    </div>

                    <div class="divider my-0"></div>

                    <div class="form-control flex flex-col gap-2">
                        <label class="label">
                            <span class="label-text font-medium flex items-center gap-2">
                                <Icon name="lucide:message-square" class="w-4 h-4 text-primary" />
                                {{ $t('pipeline.runModal.additionalInstructions') }}
                            </span>
                            <span class="label-text-alt text-base-content/50">{{ $t('common.optional') }}</span>
                        </label>
                        <textarea 
                            class="textarea textarea-bordered w-full" 
                            :placeholder="$t('pipeline.runModal.additionalInstructionsPlaceholder')"
                            v-model="additionalInstructions"
                            rows="2"
                        />
                    </div>

                    <div 
                        v-if="hasReferenceImage" 
                        class="form-control"
                    >
                        <label class="label cursor-pointer justify-start gap-3">
                            <input 
                                type="checkbox" 
                                class="toggle toggle-primary" 
                                v-model="useSimilarStyle"
                            />
                            <div class="flex flex-col gap-0.5">
                                <span class="label-text font-medium">{{ $t('pipeline.runModal.useSimilarStyle') }}</span>
                                <span class="label-text-alt text-base-content/50">{{ $t('pipeline.runModal.useSimilarStyleDescription') }}</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div class="flex-shrink-0 border-t border-base-content/10">
                <BaseGenerateButton 
                    :isLoading="isGenerating" 
                    :credits="PIPELINE_GENERATION_COST" 
                    :hotkeyEnabled="true"
                    :disabled="!isFormValid"
                    @click="runPipeline" 
                />
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import * as fabric from 'fabric';
import type { Pipeline, PipelineElement, PipelineRunParameters } from '~~/server/database/schemas/pipeline.schema';
import type { Asset } from '~~/server/database/schemas/assets.schema';
import type { Avatar } from '~~/server/database/schemas/avatar.schema';
import type { Image } from '~~/server/database/schemas/image.schema';

const PIPELINE_GENERATION_COST = 5;

const props = defineProps<{
    modelValue: boolean;
    pipeline: Pipeline | null;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'generated', image: Image): void;
}>();

const { t } = useI18n();
const toast = useToast();
const { $generationApi } = useNuxtApp();
const { convertFileToBase64 } = useFile();

const { data: assets } = await useFetch<Asset[]>('/api/v1/asset');
const { data: avatars } = await useFetch<Avatar[]>('/api/v1/avatar');

const isGenerating = ref(false);
const formValues = ref<Record<string, { text?: string; assetId?: string; avatarId?: string; characterImageBase64?: string }>>({});
const characterPreviews = ref<Record<string, string>>({});
const additionalInstructions = ref('');
const useSimilarStyle = ref(true);

const hasReferenceImage = computed(() => 
    !!props.pipeline?.config?.referenceImageStorageKey
);

const configurableElements = computed(() => 
    props.pipeline?.canvasData?.elements?.filter(e => e.isConfigurable) ?? []
);

const isFormValid = computed(() => {
    return configurableElements.value.every(elem => {
        const val = formValues.value[elem.id];
        if (!val) return false;
        if (elem.type === 'TEXT') return true;
        if (elem.type === 'ASSET') return !!val.assetId;
        if (elem.type === 'AVATAR') {
            if (elem.avatarOptions?.characterType === 'uploadable') {
                return !!val.characterImageBase64;
            }
            return !!val.avatarId;
        }
        return true;
    });
});

watch(() => props.pipeline, (pipeline) => {
    if (pipeline) {
        initFormValues();
    }
}, { immediate: true });

watch(() => props.modelValue, (open) => {
    if (open && props.pipeline) {
        initFormValues();
    }
});

function initFormValues() {
    if (!props.pipeline) return;
    
    const values: Record<string, { text?: string; assetId?: string; avatarId?: string; characterImageBase64?: string }> = {};
    
    for (const elem of configurableElements.value) {
        if (elem.type === 'TEXT') {
            values[elem.id] = { text: elem.textOptions?.defaultText || '' };
        } else if (elem.type === 'ASSET') {
            values[elem.id] = { assetId: elem.assetOptions?.defaultAssetId || elem.assetOptions?.assetIds?.[0] || '' };
        } else if (elem.type === 'AVATAR') {
            if (elem.avatarOptions?.characterType === 'uploadable') {
                values[elem.id] = { characterImageBase64: '' };
            } else {
                values[elem.id] = { avatarId: elem.avatarOptions?.defaultAvatarId || elem.avatarOptions?.avatarIds?.[0] || '' };
            }
        }
    }
    
    formValues.value = values;
    characterPreviews.value = {};
    additionalInstructions.value = '';
    useSimilarStyle.value = true;
}

function getAssetName(assetId: string): string {
    if (!assetId) return '';
    const asset = assets.value?.find(a => a.id === assetId);
    return asset?.name || assetId;
}

function getAvatarName(avatarId: string): string {
    if (!avatarId) return '';
    const avatar = avatars.value?.find(a => a.id === avatarId);
    return avatar?.name || avatarId;
}

function getElementIcon(element: PipelineElement) {
    if (element.type === 'ASSET') return 'lucide:image';
    if (element.type === 'AVATAR') {
        if (element.avatarOptions?.characterType === 'uploadable') return 'lucide:upload';
        return 'lucide:user';
    }
    if (element.type === 'TEXT') return 'lucide:type';
    return 'lucide:box';
}

async function onCharacterImageUpload(elementId: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const base64 = await convertFileToBase64(file);
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    
    formValues.value[elementId]!.characterImageBase64 = base64Data;
    characterPreviews.value[elementId] = URL.createObjectURL(file);
}

function clearCharacterImage(elementId: string) {
    formValues.value[elementId]!.characterImageBase64 = '';
    if (characterPreviews.value[elementId]) {
        URL.revokeObjectURL(characterPreviews.value[elementId]);
        delete characterPreviews.value[elementId];
    }
}

async function generateCanvasDataUrl(): Promise<string> {
    if (!props.pipeline) return '';

    const canvasEl = document.createElement('canvas');
    const canvas = new fabric.Canvas(canvasEl, {
        width: 1270,
        height: 720,
        backgroundColor: '#ffffff',
    });
    
    try {
        for (const elem of props.pipeline.canvasData.elements) {
            const val = formValues.value[elem.id];
            const pos = elem.position;
            
            if (elem.type === 'TEXT') {
                const text = elem.isConfigurable 
                    ? (val?.text || elem.textOptions?.defaultText || elem.textOptions?.placeholder || elem.label)
                    : (elem.textOptions?.fixedText || elem.label);
                
                const textbox = new fabric.Textbox(text, {
                    left: pos.x,
                    top: pos.y,
                    width: pos.width,
                    fontSize: 72,
                    fill: elem.isConfigurable ? '#1e40af' : '#000',
                    fontFamily: 'Inter, ui-sans-serif, system-ui',
                    textAlign: 'center',
                    backgroundColor: elem.isConfigurable ? '#fde68a' : '#cccccc',
                });
                canvas.add(textbox);
            }
            
            if (elem.type === 'ASSET') {
                const assetId = val?.assetId || elem.assetOptions?.defaultAssetId || elem.assetOptions?.assetIds?.[0];
                if (assetId) {
                    try {
                        const assetUrl = `/api/v1/asset/${assetId}/view`;
                        const img = await fabric.FabricImage.fromURL(assetUrl, { crossOrigin: 'anonymous' });
                        if (img) {
                            img.scaleToWidth(pos.width);
                            img.set({
                                left: pos.x,
                                top: pos.y,
                            });
                            canvas.add(img);
                        }
                    } catch (error) {
                        console.error('Failed to load asset image', error);
                    }
                }
            }
            
            if (elem.type === 'AVATAR') {
                try {
                    const result = await fabric.loadSVGFromURL("/img/user.svg");
                    const objs = result.objects as fabric.FabricObject[];
                    const svg = fabric.util.groupSVGElements(objs, result.options);
                    svg.scaleToWidth(pos.width);
                    svg.set({
                        left: pos.x,
                        top: pos.y,
                    });
                    canvas.add(svg);
                } catch (error) {
                    console.error('Failed to load avatar SVG', error);
                }
            }
        }
        
        canvas.requestRenderAll();
        return canvas.toDataURL({ format: 'png', multiplier: 1 });
    } finally {
        canvas.dispose();
    }
}

async function runPipeline() {
    if (!props.pipeline || !isFormValid.value) return;
    
    isGenerating.value = true;
    try {
        const canvasDataUrl = await generateCanvasDataUrl();
        
        const parameters: PipelineRunParameters = {};
        for (const [elemId, val] of Object.entries(formValues.value)) {
            parameters[elemId] = val;
        }
        
        const result = await $generationApi<Image>('/pipeline', {
            method: 'POST',
            body: { 
                pipelineId: props.pipeline.id, 
                parameters, 
                canvasDataUrl,
                useSimilarStyle: useSimilarStyle.value,
                additionalInstructions: additionalInstructions.value.trim() || undefined,
            },
            headers: {
                'X-Activity': 'GENERATE_PIPELINE',
                'X-Credits': String(PIPELINE_GENERATION_COST),
            },
        });
        
        toast.show({
            title: t('common.success.title'),
            message: t('common.success.message'),
            status: 'success',
        });
        
        emit('update:modelValue', false);
        emit('generated', result);
        
    } catch (error: any) {
        toast.show({
            title: t('common.errors.title'),
            message: error.message || t('common.errors.unknownError'),
            status: 'error',
        });
    } finally {
        isGenerating.value = false;
    }
}

onUnmounted(() => {
    Object.values(characterPreviews.value).forEach(url => {
        URL.revokeObjectURL(url);
    });
});
</script>