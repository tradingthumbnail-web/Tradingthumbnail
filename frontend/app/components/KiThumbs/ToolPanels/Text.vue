<template>
    <div class="h-full max-h-full flex flex-col min-h-0">
        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
            <div class="flex flex-col gap-2" v-if="!textForm">
                <label class="label py-1">
                    <span class="label-text text-xs">
                        {{ $t('text.addAndControlTheTextOnYourImage') }}
                    </span>
                </label>
                <button class="btn btn-outline border-base-100" @click="addTextToCanvas">
                    <Icon name="lucide:plus" size="16" mode="svg" />
                    {{ $t('text.addText') }}
                </button>
            </div>

            <template v-if="textForm">
            <!-- Text Input -->
            <div class="flex flex-col gap-2">
                <label class="label py-1">
                    <span class="label-text text-xs">{{ $t('text.textContent') }}</span>
                </label>
                <input 
                    type="text" 
                    class="input input-bordered bg-base-100 text-sm" 
                    v-model="form.text" 
                    :placeholder="$t('text.enterYourTextHere')"
                />
            </div>

            <!-- Font Family -->
            <div class="flex flex-col gap-2">
                <label class="label py-1">
                    <span class="label-text text-xs">{{ $t('text.fontFamily') }}</span>
                </label>
                <select class="select select-bordered bg-base-100 text-sm" v-model="form.fontFamily">
                    <option value="Anton">Anton</option>
                    <option value="Bangers">Bangers</option>
                    <option value="CrimsonText">CrimsonText</option>
                    <option value="LilitaOne">LilitaOne</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="NotoSans">NotoSans</option>
                    <option value="PermanentMarker">PermanentMarker</option>
                </select>
            </div>

            <!-- Font Size -->
            <div class="flex flex-col gap-2">
                <label class="label py-1">
                    <span class="label-text text-xs">{{ $t('text.fontSize') }}</span>
                </label>
                <input 
                    type="range" 
                    class="range range-primary range-sm" 
                    min="12" 
                    max="120" 
                    v-model.number="form.fontSize"
                />
                <div class="text-xs text-base-content/60 text-center">{{ form.fontSize }}px</div>
            </div>

            <!-- Text Color -->
            <div class="flex flex-col gap-2">
                <label class="label py-1">
                    <span class="label-text text-xs">{{ $t('text.textColor') }}</span>
                </label>
                <div class="flex items-center gap-2">
                    <input 
                        type="color" 
                        class="w-8 h-8 rounded border border-base-300/60 cursor-pointer" 
                        v-model="form.fill"
                    />
                    <input 
                        type="text" 
                        class="input input-bordered bg-base-100 text-sm flex-1" 
                        v-model="form.fill" 
                        placeholder="#000000"
                    />
                </div>
            </div>

            <!-- Background Color -->
            <div class="flex flex-col gap-2">
                <label class="label py-1">
                    <span class="label-text text-xs">{{ $t('text.backgroundColor') }}</span>
                </label>
                <div class="flex items-center gap-2">
                    <input 
                        type="color" 
                        class="w-8 h-8 rounded border border-base-300/60 cursor-pointer" 
                        v-model="form.backgroundColor"
                    />
                    <input 
                        type="text" 
                        class="input input-bordered bg-base-100 text-sm flex-1" 
                        v-model="form.backgroundColor" 
                        placeholder="#ffffff"
                    />
                    <button 
                        class="btn btn-ghost btn-sm" 
                        @click="form.backgroundColor = 'transparent'"
                        :class="{ 'btn-active': form.backgroundColor === 'transparent' }"
                    >
                        None
                    </button>
                </div>
            </div>

            <!-- Text Alignment -->
            <div class="flex flex-col gap-2">
                <label class="label py-1">
                    <span class="label-text text-xs">{{ $t('text.textAlignment') }}</span>
                </label>
                <div class="join flex">
                    <button 
                        class="btn btn-sm join-item flex-1"
                        :class="form.textAlign === 'left' ? 'btn-primary' : 'btn-ghost border border-base-300/60'"
                        @click="form.textAlign = 'left'"
                        type="button"
                    >Left</button>
                    <button 
                        class="btn btn-sm join-item flex-1"
                        :class="form.textAlign === 'center' ? 'btn-primary' : 'btn-ghost border border-base-300/60'"
                        @click="form.textAlign = 'center'"
                        type="button"
                    >Center</button>
                    <button 
                        class="btn btn-sm join-item flex-1"
                        :class="form.textAlign === 'right' ? 'btn-primary' : 'btn-ghost border border-base-300/60'"
                        @click="form.textAlign = 'right'"
                        type="button"
                    >Right</button>
                </div>
            </div>

            <!-- Position Controls -->
            <div class="flex flex-col gap-2">
                <label class="label py-1">
                    <span class="label-text text-xs">{{ $t('text.position') }}</span>
                </label>
                <div class="grid grid-cols-2 gap-2">
                    <div class="flex flex-col gap-1">
                        <span class="text-xs text-base-content/60">{{ $t('text.xPosition') }}</span>
                        <input 
                            type="number" 
                            class="input input-bordered bg-base-100 text-sm" 
                            v-model.number="form.left" 
                            min="0"
                            step="1"
                        />
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-xs text-base-content/60">{{ $t('text.yPosition') }}</span>
                        <input 
                            type="number" 
                            class="input input-bordered bg-base-100 text-sm" 
                            v-model.number="form.top" 
                            min="0"
                            step="1"
                        />
                    </div>
                </div>
            </div>
            </template>
        </div>

        <div class="flex-shrink-0 flex gap-2 flex-col" v-if="textForm">
            <button 
                class="btn btn-primary border-base-300/60" 
                @click="generateNewImageVersion"
                :disabled="!form.text"
            >
                <Icon name="lucide:plus" size="16" mode="svg" />
                {{ $t('text.saveNewImageVersion') }}
            </button>
            <button 
                class="btn btn-ghost border border-base-300/60" 
                @click="removeSelectedText"
            >
                <Icon name="lucide:trash-2" size="16" mode="svg" />
                {{ $t('text.deleteText') }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Image } from '~~/server/database/schemas/image.schema';
import * as fabric from 'fabric';

const { canvas } = useCanvas();
const toast = useToast();
const { t } = useI18n();
const { track } = usePosthog();
const imageStore = useImageStore();
const userStore = useUserStore();

const props = defineProps<{
    originalImageId: string;
}>();

const isGenerating = ref(false);
const generationCost = ref(0);

const textForm = shallowRef<fabric.Textbox | null>(null);

const form = reactive({
    text: 'Your text here',
    fontFamily: 'Anton',
    fontSize: 24 as number,
    fill: '#000000',
    backgroundColor: 'transparent',
    left: 100 as number,
    top: 100 as number,
    textAlign: 'left' as 'left' | 'center' | 'right',
});

function syncFromObjectToForm(obj: fabric.Textbox) {
    form.text = obj.text || '';
    form.fontFamily = (obj.fontFamily as any) || 'Anton';
    form.fontSize = (obj.fontSize as any) || 24;
    form.fill = (obj.fill as any) || '#000000';
    form.backgroundColor = (obj.backgroundColor as any) || 'transparent';
    form.left = (obj.left as any) ?? 100;
    form.top = (obj.top as any) ?? 100;
    form.textAlign = (obj.textAlign as any) || 'left';
}

function applyFormToObject() {
    if (!canvas.value || !textForm.value) return;
    textForm.value.set({
        text: form.text,
        fontFamily: form.fontFamily,
        fontSize: Number(form.fontSize),
        fill: form.fill,
        backgroundColor: form.backgroundColor,
        left: Number(form.left),
        top: Number(form.top),
        textAlign: form.textAlign,
    } as any);
    textForm.value.setCoords();
    canvas.value.requestRenderAll();
}

const addTextToCanvas = () => {
    if (!canvas.value) return;
    const textbox = new fabric.Textbox(form.text || 'Your text here', {
        left: form.left,
        top: form.top,
        width: 360,
        fontSize: form.fontSize,
        fontFamily: form.fontFamily,
        fill: form.fill,
        backgroundColor: form.backgroundColor,
        textAlign: form.textAlign,
        editable: true,
    } as any);
    textbox.set('id', 'text-layer');
    canvas.value.add(textbox);
    canvas.value.setActiveObject(textbox);
    textForm.value = textbox;
    syncFromObjectToForm(textbox);
    canvas.value.requestRenderAll();
};

watch(textForm, (newObj, oldObj) => {
    if (oldObj) {
        // TODO: investigar si podem treure el evento des del canvas
        oldObj.off('modified');
        (oldObj as any).off('changed');
    }
    if (newObj) {
        // Keep form in sync when user edits or moves the text directly on canvas
        newObj.on('modified', () => syncFromObjectToForm(newObj));
        (newObj as any).on('changed', () => syncFromObjectToForm(newObj));
    }
});

// Reflect form edits on the canvas object
watch(() => ({ ...form }), () => applyFormToObject(), { deep: true });

function onSelectionChange() {
    if (!canvas.value) return;
    const active = canvas.value.getActiveObject();
    if (active && active.type === 'textbox') {
        textForm.value = active as fabric.Textbox;
        syncFromObjectToForm(active as fabric.Textbox);
    }
}

onMounted(() => {
    if (!canvas.value) return;
    // If there is already a textbox on canvas (e.g. persisted), pick it
    const existing = canvas.value.getObjects().find(o => (o as any).type === 'textbox') as fabric.Textbox | undefined;
    if (existing) {
        textForm.value = existing;
        syncFromObjectToForm(existing);
    }
    canvas.value.on('selection:created', onSelectionChange);
    canvas.value.on('selection:updated', onSelectionChange);
    canvas.value.on('selection:cleared', () => {
        // Keep controls visible for the last text object; no action needed
    });
    canvas.value.on('object:modified', (e: any) => {
        if (e?.target && e.target === textForm.value) syncFromObjectToForm(e.target);
    });
    canvas.value.on('object:removed', (e: any) => {
        if (e?.target && e.target === textForm.value) {
            textForm.value = null;
        }
    });
});

onBeforeUnmount(() => {
    if (!canvas.value) return;
    canvas.value.off('selection:created', onSelectionChange);
    canvas.value.off('selection:updated', onSelectionChange);
});

const removeSelectedText = () => {
    if (!canvas.value || !textForm.value) return;
    canvas.value.remove(textForm.value);
    canvas.value.discardActiveObject();
    textForm.value = null;
    canvas.value.requestRenderAll();
};

const generateNewImageVersion = async () => {
    if (!canvas.value) return;
    try {
        isGenerating.value = true;

        const canvasDataURL = canvas.value.toDataURL({ format: 'png', multiplier: 1 });
        
        const canvasBackground = (canvas.value.backgroundImage as any) || 
            canvas.value.getObjects().find((obj: any) => obj.get('id') === 'background-image');
        
        if (!canvasBackground) {
            toast.show({
                title: t('common.errors.title'),
                message: 'Background image not found',
                status: 'error',
            });
            return;
        }
        
        const imageRectangle = canvasBackground.getBoundingRect();
        const generatedImage = await $fetch<Image>('/api/v1/image/new-version', {
            method: 'POST',
            body: {
                canvasDataURL,
                imageRectangle,
                imageId: props.originalImageId,
            },
        });

        track('text.added', {
            credits: generationCost.value,
            email: userStore.user?.email,
            tier: userStore.tier?.name,
        });
        imageStore.addImage(generatedImage);
        await imageStore.selectImage(generatedImage.id);

        await navigateTo(`/images/${generatedImage.id}`);
    } catch (error: any) {
        console.error('Failed to generate new image version', error);
        toast.show({
            title: t('common.errors.title'),
            message: error.message,
            status: 'error',
        });
    } finally {
        isGenerating.value = false;
    }
};
</script>

<style scoped>

</style>