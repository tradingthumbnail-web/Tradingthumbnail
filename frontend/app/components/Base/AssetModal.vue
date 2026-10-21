<template>
    <dialog ref="modalRef" class="modal">
        <div class="modal-box max-w-5xl p-0 overflow-y-auto rounded-[var(--radius-box)] border border-base-300/60 bg-base-100/95" >
            <!-- Header -->
            <div class="flex items-center gap-3 px-4 py-3 border-b border-base-300/60 bg-base-100/80 backdrop-blur">
                <Icon name="lucide:folder" class="h-5 w-5 text-base-content/70" />
                <h2 class="text-sm font-medium tracking-wide text-base-content/80">{{ $t('assets.selectAsset') }}</h2>
                <div class="ml-auto flex items-center gap-2">
                    <div class="relative">
                        <Icon name="lucide:search" class="z-50 absolute left-2 top-1/2 -translate-y-1/2 text-base-content/50" size="16" mode="svg" />
                        <input
                            v-model.trim="searchQuery"
                            type="search"
                            class="input input-ghost h-9 pl-8 pr-3 w-56 md:w-72 text-sm"
                            :placeholder="$t('assets.searchAsset')"
                            @input="handleSearch"
                        />
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm" @click="closeModal" aria-label="Close">
                        <Icon name="lucide:x" class="h-4 w-4" />
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div class="p-4">
                <!-- Controls Row -->
                <div class="flex items-center justify-between mb-3">
                    <div class="text-xs text-base-content/60">
                        <span v-if="filteredAssets.length === 0">{{ $t('assets.noAssets') }}</span>
                        <span v-else>{{ filteredAssets.length }} {{ $t('common.assets') }}</span>
                        <span v-if="selectedIds.size"> • {{ selectedIds.size }} {{ $t('common.selected') }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button type="button" class="btn btn-ghost btn-sm" @click="clearSelection" :disabled="selectedIds.size === 0">{{ $t('common.clear') }}</button>
                        <button type="button" class="btn btn-ghost btn-sm" @click="selectAll" :disabled="filteredAssets.length === 0">{{ $t('common.selectAll') }}</button>
                    </div>
                </div>

                <!-- Grid -->
                <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div v-for="i in 12" :key="i" class="aspect-square rounded-[var(--radius-box)] bg-base-200 animate-pulse" />
                </div>

                <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-[50vh] overflow-y-auto p-2">
                    <button
                        v-for="asset in filteredAssets"
                        :key="asset.id"
                        type="button"
                        class="group relative aspect-square rounded-[var(--radius-box)] overflow-hidden border border-base-300/60 focus:outline-none focus-visible:ring focus-visible:ring-[var(--color-primary)]"
                        :class="isSelected(asset.id) ? 'ring ring-offset-0 ring-[var(--color-primary)]' : ''"
                        @click="onAssetClick(asset)"
                    >
                        <BaseKiThumbsImage
                            :src="`/api/v1/asset/${asset.id}/view`"
                            :alt="asset.name"
                            :container-class="'w-full h-full aspect-square'"
                        />

                        <!-- Selection indicator -->
                        <div class="absolute inset-0 bg-base-100/0 group-hover:bg-base-100/5 transition-colors"></div>
                        <div v-if="isSelected(asset.id)" class="absolute top-2 right-2">
                            <span class="badge badge-primary gap-1 text-[10px]">
                                <Icon name="lucide:check" class="h-3 w-3" />
                                {{ $t('common.selected') }}
                            </span>
                        </div>
                        <div class="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-base-100/80 to-transparent">
                            <p class="text-[11px] truncate text-base-content/80">{{ asset.name }}</p>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-4 py-3 border-t border-base-300/60 bg-base-100/80 backdrop-blur flex items-center justify-between">
                <div class="text-xs text-base-content/60">
                    <span v-if="multiple">{{ $t('common.multiSelect') }}</span>
                    <span v-else>Single select</span>
                </div>
                <div class="modal-action m-0">
                    <button type="button" class="btn btn-ghost" @click="closeModal">{{ $t('common.cancel') }}</button>
                    <button type="button" class="btn btn-primary" :disabled="selectedIds.size === 0" @click="confirmSelection" id="confirm-button">
                        {{ $t('assets.add', { count: selectedIds.size || '' }) }}
                    </button>
                </div>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button @click="closeModal">{{ $t('common.close') }}</button>
        </form>
    </dialog>
</template>

<script setup lang="ts">
import type { Asset } from "~~/server/database/schemas/assets.schema";

const props = withDefaults(defineProps<{
    modelValue: boolean;
    multiple?: boolean;
    preselectedIds?: string[];
}>(), {
    multiple: true,
    preselectedIds: () => []
});

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    'confirm': [assets: Asset[]];
    'cancel': [];
}>();

const assetStore = useAssetStore();
const modalRef = ref<HTMLDialogElement | null>(null);
const searchQuery = ref('');
const selectedIds = ref<Set<string>>(new Set(props.preselectedIds));

const { data, pending } = await useFetch<Asset[]>("/api/v1/asset", {
    immediate: true,
    transform: (incoming) => {
        if (assetStore.assets.length === 0) {
            assetStore.assets = incoming;
        }
        return incoming;
    }
});

const allAssets = computed<Asset[]>(() => {
    return (assetStore.assets && assetStore.assets.length > 0)
        ? assetStore.assets as Asset[]
        : (data?.value || []);
});

const isLoading = computed(() => pending?.value === true && allAssets.value.length === 0);

const filteredAssets = computed<Asset[]>(() => {
    const q = searchQuery.value.toLowerCase();
    if (!q) return allAssets.value;
    return allAssets.value.filter(a => a.name.toLowerCase().includes(q));
});

function handleSearch() {
    // no-op, computed handles filtering
}

function isSelected(id: string): boolean {
    return selectedIds.value.has(id);
}

function toggle(id: string) {
    if (selectedIds.value.has(id)) {
        selectedIds.value.delete(id);
    } else {
        if (!props.multiple) {
            selectedIds.value.clear();
        }
        selectedIds.value.add(id);
    }
}

function onAssetClick(asset: Asset) {
    toggle(asset.id);
    if (!props.multiple) {
        confirmSelection();
    }
}

function selectAll() {
    const ids = filteredAssets.value.map(a => a.id);
    selectedIds.value = new Set(ids);
}

function clearSelection() {
    selectedIds.value.clear();
}

const selectedAssets = computed<Asset[]>(() => {
    const idSet = selectedIds.value;
    return allAssets.value.filter(a => idSet.has(a.id));
});

function closeModal() {
    emit('cancel');
    emit('update:modelValue', false);
    closeDialog();
}

function confirmSelection() {
    emit('confirm', selectedAssets.value);
    emit('update:modelValue', false);
}

function openModal() {
    modalRef.value?.showModal();
}

function closeDialog() {
    modalRef.value?.close();
}

watch(() => props.modelValue, (open) => {
    if (open) {
        openModal();
    } else {
        closeDialog();
    }
});

// ESC handling
function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && props.modelValue) {
        closeModal();
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown);
});

// Expose imperative API for parent refs
function showModal() { openModal(); }
function close() { closeDialog(); }
defineExpose({ showModal, close });
</script>

<style scoped>
.modal-box {
    max-height: 85vh;
}
</style>