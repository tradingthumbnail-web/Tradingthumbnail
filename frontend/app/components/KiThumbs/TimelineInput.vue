<template>
    <form class="w-full" @submit.prevent="emitSubmit">
        <div class="w-full h-full flex items-center">
            <textarea v-model="prompt" type="text" class="input input-bordered bg-base-100 h-full flex-1 p-4" :placeholder="props.placeholder" />
            <BaseGenerateButton :isLoading="props.isLoading" :credits="props.generationCost" @click="emitSubmit" hotkeyEnabled :disabled="!prompt.trim().length" />
        </div>
    </form>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ 
    placeholder?: string,
    isLoading: boolean,
    generationCost: number,

}>(), {
    placeholder: () => useI18n().t('timelineInput.placeholder'),
    isLoading: false,
    generationCost: 0,
});

const prompt = ref('');

const emit = defineEmits<{
    (e: 'submit', value: string): void,
}>();

function emitSubmit() {
    const value = prompt.value.trim();
    if (!value) return;
    emit('submit', value);
    prompt.value = '';
}
</script>

<style scoped>
</style>

