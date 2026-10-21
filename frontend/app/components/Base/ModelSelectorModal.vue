<template>
    <BaseModal :model-value="modelValue" :size="isMobile ? 'full' : 'md'" @update:modelValue="onModelUpdate" @close="onClose">
        <div class="w-full bg-base-200 flex flex-col h-full lg:h-auto lg:max-h-[85vh]" data-tour="model-selector-modal">
            <div class="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 flex-shrink-0">
                <div class="flex items-center gap-2">
                    <Icon name="lucide:cpu" class="text-primary" size="24" />
                    <h2 class="text-lg font-semibold">{{ $t('modelSelector.title') }}</h2>
                </div>
                <button type="button" class="btn btn-ghost btn-sm btn-circle" @click="closeModal">
                    <Icon name="lucide:x" class="h-4 w-4" />
                </button>
            </div>

            <div class="flex-1 overflow-y-auto p-4 sm:p-6">
                <p class="text-sm text-base-content/70 mb-4">
                    {{ type === 'quickGeneration' ? $t('modelSelector.quickGenerationDescription') : $t('modelSelector.fineEditDescription') }}
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" data-tour="model-selector-options">
                    <button
                        v-for="model in selectableModels"
                        :key="model"
                        type="button"
                        class="card bg-base-100 transition-all duration-200 hover:border-primary/50 hover:shadow-md p-4 text-left border-2"
                        :class="selectedModel === model ? 'border-primary shadow-md' : 'border-base-200'"
                        @click="selectModel(model)"
                    >
                        <div class="flex items-start gap-3">
                            <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-cyan-500/50">
                                <img :src="providerIcon(modelConfig(model).provider)" class="h-5 w-5" alt="Provider Icon" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 mb-1 flex-wrap">
                                    <span class="font-medium text-sm truncate">{{ modelConfig(model).displayName }}</span>
                                    <span v-if="selectedModel === model" class="badge badge-primary badge-xs">{{ $t('modelSelector.selected') }}</span>
                                </div>
                                <p class="text-xs text-base-content/60 line-clamp-2">{{ getDescription(model) }}</p>
                                <div class="flex items-center gap-2 mt-2">
                                    <span class="badge badge-ghost badge-xs">{{ modelConfig(model).credits }} {{ $t('common.credits') }}</span>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div class="px-4 sm:px-6 py-3 border-t border-base-300 bg-base-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 flex-shrink-0">
                <button type="button" class="btn btn-ghost order-2 sm:order-1" @click="closeModal">{{ $t('common.cancel') }}</button>
                <button type="button" data-tour="model-selector-confirm" class="btn btn-primary order-1 sm:order-2" @click="confirmSelection" :disabled="!selectedModel">
                    {{ $t('modelSelector.confirm') }}
                </button>
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { getModelConfig, PROVIDER_ICONS, getSelectableModels, getModelDescription, type ModelName, type ModelProvider, type SelectableFor, type Locale } from '~~/server/constants/models-db';

const props = defineProps<{
    modelValue: boolean;
    type: SelectableFor;
    currentModel?: ModelName;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    'select': [model: ModelName];
}>();

const userStore = useUserStore();
const { locale } = useI18n();

const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
const isMobile = computed(() => {
    return windowWidth.value < 1024;
});

const selectableModels = computed(() => getSelectableModels(props.type));

const selectedModel = ref<ModelName | undefined>(props.currentModel);

watch(() => props.currentModel, (newVal) => {
    selectedModel.value = newVal;
});

watch(() => props.modelValue, (isOpen) => {
    if (isOpen) {
        selectedModel.value = props.currentModel || selectableModels.value[0];
    }
});

const modelConfig = (model: ModelName) => getModelConfig(model);

const getDescription = (model: ModelName) => getModelDescription(model, locale.value as Locale);

const providerIcon = (provider: ModelProvider) => {
    return PROVIDER_ICONS[provider];
};

const selectModel = (model: ModelName) => {
    selectedModel.value = model;
};

const confirmSelection = () => {
    if (selectedModel.value) {
        userStore.setModelPreference(props.type, selectedModel.value);
        emit('select', selectedModel.value);
        closeModal();
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
</script>