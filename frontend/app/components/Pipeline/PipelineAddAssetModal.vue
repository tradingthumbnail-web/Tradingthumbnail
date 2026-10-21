<template>
    <BaseModal :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" size="lg">
        <div class="p-6 flex flex-col gap-6 max-h-[85vh]">
            <div class="flex items-center justify-between flex-shrink-0">
                <h3 class="text-xl font-semibold">{{ $t('pipeline.addAsset.title') }}</h3>
                <button type="button" class="btn btn-ghost btn-sm btn-circle" @click="$emit('update:modelValue', false)">
                    <Icon name="lucide:x" class="w-4 h-4" />
                </button>
            </div>

            <div class="form-control flex flex-col gap-2 flex-shrink-0">
                <label class="label">
                    <span class="label-text font-medium">{{ $t('pipeline.addAsset.label') }}</span>
                </label>
                <input 
                    type="text" 
                    class="input input-bordered w-full" 
                    :placeholder="$t('pipeline.addAsset.labelPlaceholder')"
                    v-model="label"
                />
            </div>

            <div class="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">
                <label class="label flex-shrink-0">
                    <span class="label-text font-medium">{{ $t('pipeline.addAsset.selectAssets') }}</span>
                </label>
                <p class="text-sm text-base-content/60 flex-shrink-0">{{ $t('pipeline.addAsset.selectAssetsDescription') }}</p>
                
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 overflow-y-auto p-1 max-h-[40vh]">
                    <div 
                        v-for="asset in assets" 
                        :key="asset.id"
                        class="aspect-square rounded-box border-2 cursor-pointer transition-all overflow-hidden group relative h-36"
                        :class="selectedAssetIds.includes(asset.id) ? 'border-primary ring-2 ring-primary/30' : 'border-base-content/20 hover:border-base-content/40'"
                        @click="toggleAsset(asset.id)"
                    >
                        <img 
                            :src="`/api/v1/asset/${asset.id}/view`" 
                            :alt="asset.name"
                            class="w-full h-full object-cover"
                        />
                        <div 
                            v-if="selectedAssetIds.includes(asset.id)"
                            class="absolute inset-0 bg-primary/20 flex items-center justify-center"
                        >
                            <Icon name="lucide:check" class="w-6 h-6 text-primary" />
                        </div>
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <span class="text-xs text-white truncate block">{{ asset.name }}</span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 mt-2 text-sm text-base-content/60 flex-shrink-0">
                    <Icon name="lucide:info" class="w-4 h-4" />
                    <span v-if="selectedAssetIds.length === 0">{{ $t('pipeline.addAsset.noAssetsSelected') }}</span>
                    <span v-else>{{ selectedAssetIds.length }} {{ $t('pipeline.addAsset.assetsSelected') }}</span>
                </div>
            </div>

            <div class="flex justify-end gap-2 flex-shrink-0">
                <button type="button" class="btn btn-ghost" @click="$emit('update:modelValue', false)">
                    {{ $t('common.cancel') }}
                </button>
                <button 
                    type="button" 
                    class="btn btn-primary" 
                    @click="addAsset"
                    :disabled="!isValid"
                >
                    <Icon name="lucide:plus" class="w-4 h-4" />
                    {{ $t('pipeline.addAsset.add') }}
                </button>
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import type { Asset } from '~~/server/database/schemas/assets.schema';
import type { PipelineElement } from '~~/server/database/schemas/pipeline.schema';

const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'add', element: Omit<PipelineElement, 'fabricObjectId' | 'position'>, firstAssetId: string): void;
}>();

const { data: assets } = await useFetch<Asset[]>('/api/v1/asset');

const label = ref('');
const selectedAssetIds = ref<string[]>([]);

const isValid = computed(() => {
    return label.value.trim() && selectedAssetIds.value.length > 0;
});

watch(() => props.modelValue, (open) => {
    if (open) {
        label.value = '';
        selectedAssetIds.value = [];
    }
});

function toggleAsset(assetId: string) {
    const index = selectedAssetIds.value.indexOf(assetId);
    if (index === -1) {
        selectedAssetIds.value.push(assetId);
    } else {
        selectedAssetIds.value.splice(index, 1);
    }
}

function addAsset() {
    if (!isValid.value) return;

    if (!selectedAssetIds.value[0]) return;
    
    const isConfigurable = selectedAssetIds.value.length > 1;
    
    const element: Omit<PipelineElement, 'fabricObjectId' | 'position'> = {
        id: crypto.randomUUID(),
        type: 'ASSET',
        label: label.value.trim(),
        isConfigurable,
        assetOptions: {
            assetIds: [...selectedAssetIds.value],
            defaultAssetId: selectedAssetIds.value[0],
        },
    };
    
    emit('add', element, selectedAssetIds.value[0]);
    emit('update:modelValue', false);
}
</script>
