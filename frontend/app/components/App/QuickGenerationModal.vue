<template>
    <BaseModal :model-value="modelValue" :size="isMobile ? 'full' : 'md'" @update:modelValue="onModelUpdate" @close="onClose">
        <div class="w-full bg-base-200 flex flex-col h-full lg:h-auto lg:max-h-[85vh]">
            <div class="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 flex-shrink-0">
                <div class="flex items-center gap-2">
                    <Icon name="lucide:zap" class="h-5 w-5 text-primary" />
                    <h2 class="text-lg font-semibold">{{ $t('quickGenerationModal.title') }}</h2>
                </div>
                <div class="flex items-center gap-2">
                    <span class="hidden sm:flex items-center gap-1 text-xs text-base-content/50">
                        <kbd class="kbd kbd-sm">{{ shortcutPrimary }}</kbd>
                        <kbd class="kbd kbd-sm">K</kbd>
                    </span>
                    <button type="button" class="btn btn-ghost btn-sm btn-circle" @click="closeModal">
                        <Icon name="lucide:x" class="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 lg:space-y-4">
                <div class="form-control">
                    <textarea
                        ref="promptInputRef"
                        v-model="prompt"
                        class="textarea textarea-bordered bg-base-100 w-full h-32 sm:h-24 text-base resize-none"
                        :placeholder="$t('quickGenerationModal.placeholder')"
                    />
                </div>

                <div class="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                    <div class="flex-1 sm:flex-initial">
                        <BaseModelSelectorButton type="quickGeneration" @change="onModelChange" />
                    </div>

                    <div class="form-control flex-1 sm:flex-initial">
                        <select v-model="imageType" class="select select-bordered bg-base-100 w-full sm:w-auto">
                            <option value="assets">{{ $t('quickGenerationModal.assets') }}</option>
                            <option value="background">{{ $t('quickGenerationModal.background') }}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="flex-shrink-0 border-t border-base-300">
                <BaseGenerateButton 
                    :is-loading="isLoading" 
                    :credits="generationCost" 
                    :disabled="!isValid"
                    hotkey-enabled 
                    @click="generate" 
                />
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { type Image } from '~~/server/database/schemas/image.schema';
import { type ModelName, getModelCredits } from '~~/server/constants/models-db';

const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const { $generationApi } = useNuxtApp();
const { t } = useI18n();
const toast = useToast();
const { track } = usePosthog();
const userStore = useUserStore();
const imageStore = useImageStore();

const promptInputRef = ref<HTMLTextAreaElement | null>(null);
const prompt = ref('');
const imageType = ref<'assets' | 'background'>('assets');
const isLoading = ref(false);
const shortcutPrimary = ref('Ctrl');
const selectedModel = ref<ModelName>(userStore.getModelPreference('quickGeneration'));

const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);

const isMobile = computed(() => {
    return windowWidth.value < 1024;
});

const generationCost = computed(() => getModelCredits(selectedModel.value));

const isValid = computed(() => prompt.value.trim().length > 0);

const onModelChange = (model: ModelName) => {
    selectedModel.value = model;
};

const generate = async () => {
    if (!isValid.value || isLoading.value) return;

    try {
        isLoading.value = true;
        const generatedImages = await $generationApi<Image[]>('/quick-generation', {
            method: 'POST',
            body: {
                prompt: prompt.value,
                imageQuality: 'medium',
                imageType: imageType.value,
                numberOfImages: 1,
                model: selectedModel.value,
                referenceImageBase64: null,
                advanced: {
                    promptImprovement: true,
                    imageSize: '16:9',
                    useStructuredPrompt: false,
                },
            },
            headers: {
                'X-Activity': 'QUICK_GENERATION',
                'X-Credits': String(generationCost.value),
            },
        });

        track('image.quick-generation.generated', {
            credits: generationCost.value,
            email: userStore.user?.email,
            tier: userStore.tier?.name,
        });

        generatedImages.forEach((image: Image) => {
            imageStore.addImage(image);
        });

        toast.show({
            title: t('common.success.title'),
            message: t('common.success.message'),
            status: 'success',
        });

        prompt.value = '';
        closeModal();

        if (generatedImages.length > 0 && generatedImages[0]) {
            await navigateTo(`/images/${generatedImages[0].id}`);
        }
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
};

const closeModal = () => {
    emit('update:modelValue', false);
};

const onModelUpdate = (v: boolean) => {
    emit('update:modelValue', v);
};

const onClose = () => {
    emit('update:modelValue', false);
};

const focusInput = () => {
    nextTick(() => {
        promptInputRef.value?.focus();
    });
};

watch(() => props.modelValue, (isOpen) => {
    if (isOpen) {
        focusInput();
    }
});

onMounted(() => {
    if (typeof navigator !== 'undefined') {
        shortcutPrimary.value = /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl';
    }
});
</script>