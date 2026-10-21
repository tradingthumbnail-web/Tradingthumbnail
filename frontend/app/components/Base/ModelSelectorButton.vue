<template>
    <div>
        <button
            type="button"
            class="btn btn-ghost btn-sm gap-2 border border-base-300 hover:border-primary/50 pl-1"
            @click="isModalOpen = true"
        >
            <div class="w-5 h-5 rounded flex items-center justify-center bg-cyan-500/50">
                <img :src="providerIcon" class="h-4 w-4" alt="Provider Icon" />
            </div>
            <span class="text-xs font-medium truncate max-w-[120px]">{{ currentModelDisplayName }}</span>
            <Icon name="lucide:chevron-down" size="16" class="text-base-content/50" />
        </button>

        <BaseModelSelectorModal
            v-model="isModalOpen"
            :type="type"
            :current-model="currentModel"
            @select="onModelSelect"
        />
    </div>
</template>

<script setup lang="ts">
import { getModelConfig, PROVIDER_ICONS, type ModelName, type SelectableFor } from '~~/server/constants/models-db';

const props = defineProps<{
    type: SelectableFor;
}>();

const emit = defineEmits<{
    'change': [model: ModelName];
}>();

const userStore = useUserStore();
const isModalOpen = ref(false);

const currentModel = computed<ModelName>(() => {
    return userStore.getModelPreference(props.type);
});

const currentModelConfig = computed(() => getModelConfig(currentModel.value));

const currentModelDisplayName = computed(() => currentModelConfig.value.displayName);

const providerIcon = computed(() => {
    return PROVIDER_ICONS[currentModelConfig.value.provider];
});

const onModelSelect = (model: ModelName) => {
    userStore.setModelPreference(props.type, model);
    emit('change', model);
};
</script>