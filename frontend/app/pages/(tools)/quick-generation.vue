<template>
    <div class="flex flex-col gap-6 h-full" data-tour="quick-generation-page">
        <div class="flex flex-col gap-1.5 flex-shrink-0">
            <h1 class="text-2xl font-bold text-base-content">{{ $t('quickGeneration.title') }}</h1>
            <p class="text-sm text-base-content/50">{{ $t('quickGeneration.description') }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
            <div class="card bg-base-200 border border-base-100/10 rounded-2xl p-5 lg:col-span-4 flex flex-col overflow-hidden gap-5" data-tour="quick-generation-forms">
                <div class="flex-shrink-0 flex items-center justify-between">
                    <h2 class="text-base font-bold">{{ $t('quickGeneration.configuration') }}</h2>
                    <BaseModelSelectorButton type="quickGeneration" @change="onModelChange" />
                </div>

                <BaseModelOptions 
                    :model="selectedModel" 
                    v-model="modelOptions" 
                />

                <div class="flex items-center justify-between gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
                    <div class="flex flex-col gap-0.5">
                        <label class="text-sm font-medium flex items-center gap-1.5">
                            <Icon name="lucide:sparkles" size="14" class="text-primary" />
                            {{ $t('structuredPrompt.enableStructuredPrompt') }}
                        </label>
                        <span class="text-[11px] text-base-content/50">{{ $t('structuredPrompt.description') }}</span>
                    </div>
                    <input type="checkbox" class="toggle toggle-sm toggle-primary" v-model="generationForm.advanced.useStructuredPrompt" />
                </div>
                
                <div class="flex flex-col gap-5 flex-1 overflow-y-auto">
                    <div class="form-control" v-if="!generationForm.advanced.useStructuredPrompt">
                        <label class="text-sm font-semibold text-base-content mb-2">
                            {{ $t('common.generation.prompt') }}
                        </label>
                        <textarea
                            class="textarea textarea-bordered bg-base-100/50 w-full h-28 resize-none text-sm leading-relaxed focus:bg-base-100"
                            :placeholder="$t('common.generation.promptPlaceholder')" v-model="generationForm.prompt" />
                    </div>

                    <div class="form-control">
                        <label class="text-sm font-semibold text-base-content mb-2">
                            {{ $t('quickGeneration.typeOfGeneration') }}
                        </label>
                        <select class="select select-bordered bg-base-100/50 w-full focus:bg-base-100" v-model="generationForm.imageType">
                            <option value="assets">{{ $t('quickGeneration.assets') }}</option>
                            <option value="background">{{ $t('quickGeneration.background') }}</option>
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-control">
                            <label class="text-sm font-semibold text-base-content mb-2">
                                {{ $t('common.generation.imageQuality') }}
                            </label>
                            <select class="select select-bordered bg-base-100/50 w-full focus:bg-base-100" v-model="generationForm.imageQuality">
                                <option value="low">{{ $t('common.low') }}</option>
                                <option value="medium">{{ $t('common.medium') }}</option>
                                <option value="high">{{ $t('common.high') }}</option>
                            </select>
                        </div>

                        <div class="form-control">
                            <label class="text-sm font-semibold text-base-content mb-2">
                                {{ $t('common.generation.numberOfImages') }}
                            </label>
                            <select class="select select-bordered w-full bg-base-100/50 focus:bg-base-100" v-model="generationForm.numberOfImages">
                                <option>1</option>
                                <option>2</option>
                                <option>3</option>
                                <option>4</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <button type="button" class="btn btn-ghost btn-sm gap-2 w-full justify-between text-base-content/60 hover:text-base-content"
                            @click="advancedOpen = !advancedOpen" aria-expanded="false">
                            <span class="flex items-center gap-2">
                                <Icon name="lucide:sliders-horizontal" size="14" />
                                {{ $t('common.generation.advancedOptions') }}
                            </span>
                            <Icon name="lucide:chevron-down" class="h-4 w-4 transition-transform duration-200" :class="{ 'rotate-180': advancedOpen }" />
                        </button>

                        <Transition name="fade">
                            <div v-show="advancedOpen"
                                class="mt-3 p-4 bg-base-100/30 border border-base-100/20 rounded-xl text-sm flex flex-col gap-5">
                                
                                <div class="flex items-center justify-between gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                    <div class="flex flex-col gap-0.5">
                                        <label class="text-xs font-medium flex items-center gap-1.5">
                                            <Icon name="lucide:sparkles" size="12" class="text-primary" />
                                            {{ $t('structuredPrompt.enableStructuredPrompt') }}
                                        </label>
                                        <span class="text-[10px] text-base-content/50">{{ $t('structuredPrompt.description') }}</span>
                                    </div>
                                    <input type="checkbox" class="toggle toggle-xs toggle-primary" v-model="generationForm.advanced.useStructuredPrompt" />
                                </div>

                                <div class="flex items-center justify-between" v-if="!generationForm.advanced.useStructuredPrompt">
                                    <label class="text-xs font-medium text-base-content/70">
                                        {{ $t('common.generation.promptImprovement') }}
                                    </label>
                                    <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" v-model="generationForm.advanced.promptImprovement" />
                                </div>

                                <div class="flex items-center justify-between">
                                    <label class="text-xs font-medium text-base-content/70">
                                        {{ $t('common.generation.imageSize') }}
                                    </label>
                                    <select class="select select-xs select-bordered bg-base-100/50" v-model="generationForm.advanced.imageSize">
                                        <option>16:9</option>
                                        <option>1:1</option>
                                    </select>
                                </div>

                                <div class="form-control">
                                    <label class="text-xs font-medium text-base-content/70 mb-2">
                                        {{ $t('common.generation.referenceImage') }}
                                    </label>
                                    <input type="file" class="file-input file-input-sm file-input-bordered w-full bg-base-100/50" accept="image/*" @change="onFile" />
                                </div>

                                <div v-if="referencePreview" class="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
                                    <img :src="referencePreview" alt="reference preview" class="h-16 w-16 rounded-lg object-cover" />
                                    <span class="text-xs text-base-content/60">Reference image uploaded</span>
                                </div>
                            </div>
                        </Transition>
                    </div>

                    <Transition name="slide-fade">
                        <div v-if="generationForm.advanced.useStructuredPrompt" class="border-t border-base-100/20 pt-5">
                            <div class="flex items-center gap-2 mb-3">
                                <Icon name="lucide:layers" size="16" class="text-primary" />
                                <h3 class="text-sm font-semibold">{{ $t('structuredPrompt.title') }}</h3>
                            </div>
                            <BaseStructuredPromptBuilder v-model="generationForm.advanced.structuredPromptData" />
                        </div>
                    </Transition>
                </div>
                <BaseGenerateButton :isLoading="isLoading" :credits="generationCost" @click="generate" hotkeyEnabled :disabled="isGenerateDisabled" data-tour="quick-generation-create" />
            </div>

            <div class="card bg-base-200 border border-base-100/10 rounded-2xl p-5 lg:col-span-8 flex flex-col overflow-hidden" data-tour="quick-generation-gallery">
                <div class="flex items-center justify-between flex-shrink-0 mb-4">
                    <h2 class="text-base font-bold">{{ $t('common.preview') || 'Preview' }}</h2>
                    <span class="text-xs text-base-content/40" v-if="imageStore.images.length">{{ imageStore.images.length }} images</span>
                </div>
                <div class="flex-1 overflow-y-auto">
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        <template v-if="Array.isArray(imageStore.images) && imageStore.images.length">
                            <NuxtLink
                                v-for="img in imageStore.images"
                                :key="img.id"
                                :to="`/images/${img.id}`"
                                class="group relative rounded-xl border border-base-100/10 bg-base-100/30 hover:border-primary/30 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                            >
                                <BaseKiThumbsImage
                                    :src="`/api/v1/image/${img.id}/view`"
                                    alt="Image"
                                    :container-class="'aspect-square group-hover:scale-105 transition-transform duration-500'"
                                    :show-download-on-hover="true"
                                />
                                <div class="absolute inset-0 bg-gradient-to-t from-base-300/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <div class="w-7 h-7 rounded-full bg-primary/90 flex items-center justify-center">
                                        <Icon name="lucide:expand" size="12" class="text-primary-content" />
                                    </div>
                                </div>
                            </NuxtLink>
                        </template>

                        <div v-else class="col-span-full h-64 rounded-xl border border-base-100/10 bg-base-100/20 flex flex-col items-center justify-center text-center p-6">
                            <div class="w-16 h-16 rounded-2xl bg-base-200/50 flex items-center justify-center mb-4">
                                <Icon name="lucide:image-plus" size="28" class="text-base-content/30" />
                            </div>
                            <p class="text-sm text-base-content/50">{{ $t('common.nothingToShow') || 'Nothing to show yet. Generate to preview.' }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import { type Image } from "~~/server/database/schemas/image.schema";
import { type StructuredPrompt, createEmptyStructuredPrompt } from "~~/shared/generation/types";
import { type ModelName, type ResolutionValue, getModelCreditsWithOptions, getModelConfig } from "~~/server/constants/models-db";

const { $generationApi } = useNuxtApp();

const { t } = useI18n();
const toast = useToast();
const { track } = usePosthog();
const { convertFileToBase64 } = useFile();
const userStore = useUserStore();
const imageStore = useImageStore();

const selectedModel = ref<ModelName>(userStore.getModelPreference('quickGeneration'));
const modelOptions = ref<{ resolution?: ResolutionValue; enableWebSearch?: boolean }>({});

const onModelChange = (model: ModelName) => {
    selectedModel.value = model;
    userStore.setModelPreference('quickGeneration', model);
};

const hasModelOptions = computed(() => {
    const config = getModelConfig(selectedModel.value);
    return config?.resolutionOptions || config?.supportsWebSearch;
});

const referencePreview = ref<string | null>(null);
const advancedOpen = ref(false);
const isLoading = ref(false);
const qualities = ['low', 'medium', 'high'] as const;
type QualityType = typeof qualities[number];

const qualityPriceMap = {
    low: 1,
    medium: 2,
    high: 3,
};

const generationCost = computed(() => {
    if (hasModelOptions.value) {
        const modelCredits = getModelCreditsWithOptions(selectedModel.value, {
            resolution: modelOptions.value.resolution,
            webSearch: modelOptions.value.enableWebSearch,
        });
        return modelCredits * generationForm.value.numberOfImages;
    }
    const baseCost = generationForm.value.numberOfImages * qualityPriceMap[generationForm.value.imageQuality];
    return generationForm.value.advanced.useStructuredPrompt ? baseCost + 1 : baseCost;
});

const generationForm = ref({
    prompt: '',
    imageQuality: 'medium' as QualityType,
    imageType: 'assets' as 'assets' | 'background',
    numberOfImages: 1,
    advanced: {
        promptImprovement: true,
        imageSize: '16:9' as '1:1' | '16:9',
        useStructuredPrompt: false,
        structuredPromptData: createEmptyStructuredPrompt() as StructuredPrompt,
    },
    referenceImageBase64: null as string | null,
});

const isGenerateDisabled = computed(() => {
    if (generationForm.value.advanced.useStructuredPrompt) {
        const data = generationForm.value.advanced.structuredPromptData;
        return !data.scene || !generationForm.value.imageType || !generationForm.value.imageQuality || !generationForm.value.numberOfImages;
    }
    return !generationForm.value.prompt || !generationForm.value.imageType || !generationForm.value.imageQuality || !generationForm.value.numberOfImages;
});

const onFile = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files && target.files[0] ? target.files[0] : null;
    if (file) {
        const base64 = await convertFileToBase64(file);
        generationForm.value.referenceImageBase64 = base64;
        referencePreview.value = URL.createObjectURL(file);
    } else {
        referencePreview.value = null;
        generationForm.value.referenceImageBase64 = null;
    }
}

const generate = async () => {
    try {
        isLoading.value = true;
        const generatedImages = await $generationApi<Image[]>('/quick-generation', {
            method: 'POST',
            body: {
                ...generationForm.value,
                model: selectedModel.value,
                modelOptions: hasModelOptions.value ? modelOptions.value : undefined,
            },
            headers: {
                'X-Activity': 'QUICK_GENERATION',
                'X-Credits': String(generationCost.value),
            }
        });
        track('image.quick-generation.generated', {
            credits: generationCost.value,
            email: userStore.user?.email,
            tier: userStore.tier?.name,
            useStructuredPrompt: generationForm.value.advanced.useStructuredPrompt,
        });

        generatedImages.forEach((image: Image) => {
            imageStore.addImage(image);
        });
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

onMounted(async () => {
    if (imageStore.hasInitialized) return;
    await imageStore.getImages();
});

useHead({
    title: clicklabPageTitle(t('quickGeneration.title')),
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
