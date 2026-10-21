<template>
    <Transition name="fade">
        <div v-if="hasOptions" class="flex flex-col gap-3 p-3 bg-base-100/30 border border-base-100/20 rounded-xl">
            <div v-if="config?.resolutionOptions" class="form-control">
                <div class="flex items-center justify-between">
                    <label class="label-text text-xs font-medium text-base-content/70">
                        {{ $t('modelOptions.resolution') }}
                    </label>
                    <select 
                        v-model="selectedResolution" 
                        class="select select-xs select-bordered bg-base-100/50 w-28"
                        @change="emitChange">
                        <option v-for="opt in config.resolutionOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                </div>
                <span class="text-[10px] text-base-content/50 mt-1">
                    {{ $t('modelOptions.resolutionHint') }}
                </span>
            </div>

            <div v-if="config?.supportsWebSearch" class="form-control">
                <div class="flex items-center justify-between gap-2">
                    <div class="flex flex-col gap-0.5">
                        <label class="label-text text-xs font-medium flex items-center gap-1.5">
                            <Icon name="lucide:globe" size="12" class="text-primary/70" />
                            {{ $t('modelOptions.webSearch') }}
                        </label>
                        <span class="text-[10px] text-base-content/50">
                            {{ $t('modelOptions.webSearchHint', { credits: config.webSearchCredits }) }}
                        </span>
                    </div>
                    <input 
                        type="checkbox" 
                        class="toggle toggle-xs toggle-primary" 
                        v-model="webSearchEnabled"
                        @change="emitChange" />
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { type ModelName, type ResolutionValue, getModelConfig } from '~~/server/constants/models-db';

const props = defineProps<{
    model: ModelName;
    modelValue?: {
        resolution?: ResolutionValue;
        enableWebSearch?: boolean;
    };
}>();

const emit = defineEmits<{
    'update:modelValue': [value: { resolution?: ResolutionValue; enableWebSearch?: boolean }];
}>();

const config = computed(() => getModelConfig(props.model));

const hasOptions = computed(() => {
    return config.value?.resolutionOptions || config.value?.supportsWebSearch;
});

const selectedResolution = ref<ResolutionValue>(props.modelValue?.resolution ?? '1K');
const webSearchEnabled = ref(props.modelValue?.enableWebSearch ?? false);

watch(() => props.model, () => {
    const newConfig = getModelConfig(props.model);
    if (newConfig?.resolutionOptions) {
        const defaultRes = newConfig.resolutionOptions.find(r => r.creditMultiplier === 1);
        selectedResolution.value = defaultRes?.value ?? '1K';
    }
    webSearchEnabled.value = false;
    emitChange();
});

watch(() => props.modelValue, (newVal) => {
    if (newVal?.resolution) selectedResolution.value = newVal.resolution;
    if (newVal?.enableWebSearch !== undefined) webSearchEnabled.value = newVal.enableWebSearch;
}, { deep: true });

function emitChange() {
    emit('update:modelValue', {
        resolution: config.value?.resolutionOptions ? selectedResolution.value : undefined,
        enableWebSearch: config.value?.supportsWebSearch ? webSearchEnabled.value : undefined,
    });
}

onMounted(() => {
    if (hasOptions.value) {
        emitChange();
    }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>