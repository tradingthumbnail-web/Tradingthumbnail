<template>
    <div class="h-full max-h-full flex flex-col min-h-0">
        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">
            <div class="flex items-center justify-between flex-col gap-4">
                <BaseModelSelectorButton type="fineEdit" @change="onModelChange" />
                <BaseModelOptions :model="selectedModel" v-model="modelOptions" />
                <label class="label py-1">
                    <span class="label-text text-xs text-wrap">
                        {{ $t('chatEdition.describeHowYouWantToEditTheImage') }}
                    </span>
                </label>
            </div>

            <div
                class="form-control flex flex-row items-center justify-between gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                <div class="flex flex-col gap-1">
                    <label class="label-text text-xs font-medium flex items-center justify-between">
                        <span>{{ $t('chatEdition.useAdvancedPrompt') }}</span>
                        <input type="checkbox" class="toggle toggle-sm toggle-primary" v-model="useStructuredPrompt" />
                    </label>
                    <span class="text-[10px] text-base-content/50">{{ $t('structuredPrompt.description') }}</span>
                    <p v-if="isStructuredGpt2Blocked" class="text-[10px] text-error">
                        Structured fine edit is not available with GPT Image 2. Choose Flux 2 Edit or turn off advanced prompt.
                    </p>
                </div>
            </div>

            <div v-if="!useStructuredPrompt" class="flex flex-col gap-2">
                <textarea type="text" class="input input-bordered bg-base-100 p-2 h-36 text-wrap" v-model="form.prompt"
                    rows="3" :placeholder="$t('chatEdition.promptPlaceholder')" />
            </div>

            <div v-else class="overflow-y-auto">
                <BaseStructuredPromptBuilder v-model="structuredPrompt" />
            </div>
        </div>

        <div class="flex-shrink-0">
            <BaseGenerateButton :is-loading="isGenerating" :credits="generationCost" hotkey-enabled @click="generateChatEdition"
                :disabled="!isFormValid" />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Image } from '~~/server/database/schemas/image.schema';
import { type StructuredPrompt, createEmptyStructuredPrompt } from '~~/shared/generation/types';
import { type ModelName, type ResolutionValue, getModelCredits, getModelCreditsWithOptions, getModelConfig, resolveModel } from '~~/server/constants/models-db';

const { $generationApi } = useNuxtApp();
const toast = useToast();
const imageStore = useImageStore();
const userStore = useUserStore();
const { t } = useI18n();
const { track } = usePosthog();
const props = defineProps<{
    originalImageId: string;
}>();

const isGenerating = ref(false);
const useStructuredPrompt = ref(false);
const structuredPrompt = ref<StructuredPrompt>(createEmptyStructuredPrompt());
const selectedModel = ref<ModelName>(resolveModel(userStore.getModelPreference('fineEdit'), 'fineEdit'));
const modelOptions = ref<{ resolution?: ResolutionValue; enableWebSearch?: boolean }>({});

const hasModelOptions = computed(() => {
    const config = getModelConfig(selectedModel.value);
    return config?.resolutionOptions || config?.supportsWebSearch;
});

const generationCost = computed(() => {
    if (hasModelOptions.value) {
        return getModelCreditsWithOptions(selectedModel.value, {
            resolution: modelOptions.value.resolution,
            webSearch: modelOptions.value.enableWebSearch,
        });
    }
    return getModelCredits(selectedModel.value);
});

const onModelChange = (model: ModelName) => {
    selectedModel.value = resolveModel(model, 'fineEdit');
    userStore.setModelPreference('fineEdit', selectedModel.value);
};

const form = ref({
    prompt: '',
    imageId: props.originalImageId,
});

const isStructuredGpt2Blocked = computed(
    () => useStructuredPrompt.value && selectedModel.value === 'gpt-image-2',
);

const isFormValid = computed(() => {
    if (isStructuredGpt2Blocked.value) {
        return false;
    }
    if (selectedModel.value === 'fal-ai/nano-banana-2') {
        return true;
    }
    if (useStructuredPrompt.value) {
        return structuredPrompt.value.scene.trim() !== '' || structuredPrompt.value.subjects.some(s => s.description.trim() !== '');
    }
    return form.value.prompt.trim() !== '';
});

const generateChatEdition = async () => {
    try {
        isGenerating.value = true;

        const body: any = {
            imageId: props.originalImageId,
            model: selectedModel.value,
            modelOptions: hasModelOptions.value ? modelOptions.value : undefined,
        };

        if (useStructuredPrompt.value) {
            body.useStructuredPrompt = true;
            body.structuredPromptData = structuredPrompt.value;
        } else {
            body.prompt = form.value.prompt;
        }

        const generatedImage = await $generationApi<Image>('/fine-edit', {
            method: 'POST',
            body,
            headers: {
                'X-Activity': 'FINE_DETAIL_EDITION',
                'X-Credits': String(generationCost.value),
            },
        });

        track('image.fine-edit.generated', {
            credits: generationCost.value,
            email: userStore.user?.email,
            tier: userStore.tier?.name,
            useStructuredPrompt: useStructuredPrompt.value,
        });
        imageStore.addImage(generatedImage);
        await imageStore.selectImage(generatedImage.id);

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
</script>

<style scoped></style>