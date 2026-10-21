<template>
    <BaseModal :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" size="md">
        <div class="p-6 flex flex-col gap-6">
            <div class="flex items-center justify-between">
                <h3 class="text-xl font-semibold">{{ $t('pipeline.addText.title') }}</h3>
                <button type="button" class="btn btn-ghost btn-sm btn-circle" @click="$emit('update:modelValue', false)">
                    <Icon name="lucide:x" class="w-4 h-4" />
                </button>
            </div>

            <div class="form-control flex flex-col gap-2">
                <label class="label">
                    <span class="label-text font-medium">{{ $t('pipeline.addText.textType') }}</span>
                </label>
                <div class="flex gap-2">
                    <label 
                        class="flex-1 cursor-pointer border rounded-box p-4 transition-all"
                        :class="textType === 'fixed' ? 'border-primary bg-primary/10' : 'border-base-content/20 hover:border-base-content/40'"
                    >
                        <input type="radio" v-model="textType" value="fixed" class="hidden" />
                        <div class="flex flex-col gap-1">
                            <span class="font-medium flex items-center gap-2">
                                <Icon name="lucide:lock" class="w-4 h-4" />
                                {{ $t('pipeline.addText.fixedText') }}
                            </span>
                            <span class="text-xs text-base-content/60">{{ $t('pipeline.addText.fixedTextDescription') }}</span>
                        </div>
                    </label>
                    <label 
                        class="flex-1 cursor-pointer border rounded-box p-4 transition-all"
                        :class="textType === 'configurable' ? 'border-primary bg-primary/10' : 'border-base-content/20 hover:border-base-content/40'"
                    >
                        <input type="radio" v-model="textType" value="configurable" class="hidden" />
                        <div class="flex flex-col gap-1">
                            <span class="font-medium flex items-center gap-2">
                                <Icon name="lucide:settings-2" class="w-4 h-4" />
                                {{ $t('pipeline.addText.configurableText') }}
                            </span>
                            <span class="text-xs text-base-content/60">{{ $t('pipeline.addText.configurableTextDescription') }}</span>
                        </div>
                    </label>
                </div>
            </div>

            <div class="form-control flex flex-col gap-2">
                <label class="label">
                    <span class="label-text font-medium">{{ $t('pipeline.editor.elementLabel') }}</span>
                </label>
                <input 
                    type="text" 
                    class="input input-bordered w-full" 
                    :placeholder="$t('pipeline.addText.labelPlaceholder')"
                    v-model="label"
                />
            </div>

            <div v-if="textType === 'fixed'" class="form-control flex flex-col gap-2">
                <label class="label">
                    <span class="label-text font-medium">{{ $t('pipeline.addText.text') }}</span>
                </label>
                <input 
                    type="text" 
                    class="input input-bordered w-full" 
                    :placeholder="$t('pipeline.addText.textPlaceholder')"
                    v-model="fixedText"
                />
            </div>

            <div v-else class="flex flex-col gap-4">
                <div class="form-control flex flex-col gap-2">
                    <label class="label">
                        <span class="label-text font-medium">{{ $t('pipeline.addText.placeholder') }}</span>
                    </label>
                    <input 
                        type="text" 
                        class="input input-bordered w-full" 
                        :placeholder="$t('pipeline.addText.placeholderPlaceholder')"
                        v-model="placeholder"
                    />
                </div>
                <div class="form-control flex flex-col gap-2">
                    <label class="label">
                        <span class="label-text font-medium">{{ $t('pipeline.addText.defaultText') }}</span>
                    </label>
                    <input 
                        type="text" 
                        class="input input-bordered w-full" 
                        :placeholder="$t('pipeline.addText.defaultTextPlaceholder')"
                        v-model="defaultText"
                    />
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-2">
                <button type="button" class="btn btn-ghost" @click="$emit('update:modelValue', false)">
                    {{ $t('common.cancel') }}
                </button>
                <button 
                    type="button" 
                    class="btn btn-primary" 
                    @click="addText"
                    :disabled="!isValid"
                >
                    <Icon name="lucide:plus" class="w-4 h-4" />
                    {{ $t('pipeline.addText.add') }}
                </button>
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import type { PipelineElement } from '~~/server/database/schemas/pipeline.schema';

const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'add', element: Omit<PipelineElement, 'fabricObjectId' | 'position'>): void;
}>();

const textType = ref<'fixed' | 'configurable'>('configurable');
const label = ref('');
const fixedText = ref('');
const placeholder = ref('');
const defaultText = ref('');

const isValid = computed(() => {
    if (!label.value.trim()) return false;
    if (textType.value === 'fixed' && !fixedText.value.trim()) return false;
    return true;
});

watch(() => props.modelValue, (open) => {
    if (open) {
        textType.value = 'configurable';
        label.value = '';
        fixedText.value = '';
        placeholder.value = '';
        defaultText.value = '';
    }
});

function addText() {
    if (!isValid.value) return;
    
    const element: Omit<PipelineElement, 'fabricObjectId' | 'position'> = {
        id: crypto.randomUUID(),
        type: 'TEXT',
        label: label.value.trim(),
        isConfigurable: textType.value === 'configurable',
        textOptions: textType.value === 'fixed' 
            ? { fixedText: fixedText.value.trim() }
            : { 
                placeholder: placeholder.value.trim() || undefined,
                defaultText: defaultText.value.trim() || undefined,
            },
    };
    
    emit('add', element);
    emit('update:modelValue', false);
}
</script>
