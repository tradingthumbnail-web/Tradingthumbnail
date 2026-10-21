<template>
    <div class="flex flex-col gap-6 h-full" data-tour="assets-page">
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
            <div class="flex items-end gap-4">
                <div>
                    <h1 class="text-2xl font-semibold text-base-content">{{ $t('assets.title') }}</h1>
                    <p class="text-sm text-base-content/70">{{ $t('assets.description') }}</p>
                </div>
                <button class="btn btn-outline btn-sm border border-base-content/40" :disabled="!assets?.length" @click="toggleSelectMode">
                    <Icon name="lucide:mouse-pointer-square" size="16" mode="svg" />
                    <span class="text-md font-medium">{{ selectMode ? $t('common.cancel') : $t('common.select') }}</span>
                </button>
            </div>
            <div class="flex items-center gap-2">
                <button class="btn btn-primary btn-sm" @click="openAssetModal" data-tour="upload-assets">
                    <Icon name="lucide:upload" class="w-4 h-4" />
                    <span class="ml-1">{{ $t('common.upload') }}</span>
                </button>
                <!-- <button class="btn btn-ghost btn-sm" :disabled="!assets?.length" @click="clearAssets">{{ $t('common.clear') }}</button> -->
            </div>
        </div>

        <!-- Content -->
        <div class="card flex-1 min-h-0 overflow-y-auto p-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div
                    v-for="a in assetStore.assets"
                    :key="a.id"
                    class="card bg-base-100 border border-base-200 p-3 relative group"
                    :class="{ 'ring-2 ring-[var(--color-primary)]': isSelected(a.id) }"
                    @click="onCardClick(a.id)"
                >
                    <div class="absolute top-6 right-6 flex items-center gap-1 z-10">
                        <label v-if="selectMode" class="btn btn-ghost btn-xs btn-circle">
                            <input type="checkbox" class="checkbox checkbox-xs" :checked="isSelected(a.id)" @click.stop="toggleSelect(a.id)" />
                        </label>
                        <template v-else>
                            <button class="btn btn-ghost btn-xs btn-circle p-0.5" :disabled="removingIds.has(a.id)" @click.stop="removeBackground(a)">
                                <Icon v-if="!removingIds.has(a.id)" name="lucide:wand-2" size="20" mode="svg" />
                                <span v-else class="loading loading-spinner loading-xs" />
                            </button>
                            <button class="btn btn-ghost btn-xs btn-circle p-0.5" @click.stop="openDeleteModal(a)">
                                <Icon name="lucide:trash-2" size="24" mode="svg" />
                            </button>
                        </template>
                    </div>

                    <div class="aspect-video rounded-[var(--radius-box)] overflow-hidden bg-base-200">
                        <BaseKiThumbsImage :src="`/api/v1/asset/${a.id}/view`" :alt="a.id" :container-class="'aspect-video'" />
                    </div>
                    <div class="mt-3 flex items-center justify-between gap-2">
                        <div class="min-w-0 space-y-2">
                            <p class="text-sm font-medium truncate">{{ a.name }}</p>
                            <div class="flex items-center gap-2 text-xs opacity-70 space-x-2">
                                <span class="badge badge-ghost badge-xs uppercase">{{ a.type }}</span>
                                <span>{{ a.isPublic ? $t('assets.public') : $t('assets.private') }}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1">
                            <button class="btn btn-ghost btn-xs" @click.stop="assetStore.togglePublic(a.id)">{{ a.isPublic ? $t('assets.makePrivate') : $t('assets.makePublic') }}</button>
                        </div>
                    </div>
                </div>

                <div v-if="!assetStore.assets.length" class="col-span-full h-48 rounded-[var(--radius-box)] border border-base-200 bg-base-200/40 flex items-center justify-center text-sm text-base-content/70">
                    {{ $t('assets.noAssets') }}
                </div>
            </div>
        </div>

        <!-- Bulk bar -->
        <div v-if="selectMode" class="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[20rem]">
            <div class="card border border-base-200 bg-base-100 shadow p-4 flex items-center gap-2">
                <span class="text-sm font-medium">{{ selectedIds.size }} {{ $t('common.selected') }}</span>
                <div class="flex items-center gap-4">
                    <button class="btn btn-ghost" @click="selectAll">{{ $t('common.selectAll') }}</button>
                    <button class="btn btn-ghost" @click="clearSelection" :disabled="selectedIds.size === 0">{{ $t('common.clear') }}</button>
                </div>
                <button class="btn btn-error" :disabled="selectedIds.size === 0" @click="openBulkDeleteModal">
                    <Icon name="lucide:trash-2" size="16" mode="svg" />
                    <span class="ml-1">{{ $t('common.delete') }}</span>
                </button>
            </div>
        </div>

        <!-- Corner upload modal -->
        <AssetsUploadModal :open="showAssetModal" :isUploading="addingAssets" @close="closeAssetModal" @add="onAdd" />

        <!-- Delete single modal -->
        <dialog ref="deleteModalRef" class="modal" @cancel.prevent>
            <div class="modal-box">
                <h3 class="font-medium text-base-content">{{ $t('assets.deleteAsset') }}</h3>
                <p class="py-2 text-sm text-base-content/70">{{ $t('assets.deleteAssetConfirm') }}</p>
                <div class="modal-action">
                    <form method="dialog" class="flex items-center gap-2">
                        <button class="btn btn-outline btn-sm border border-base-content/40" @click="closeDeleteModal">{{ $t('common.cancel') }}</button>
                        <button class="btn btn-error btn-sm" @click="confirmDeleteSingle">{{ $t('common.delete') }}</button>
                    </form>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="closeDeleteModal">{{ $t('common.close') }}</button>
            </form>
        </dialog>

        <!-- Delete bulk modal -->
        <dialog ref="bulkDeleteModalRef" class="modal" @cancel.prevent>
            <div class="modal-box">
                <h3 class="font-medium text-base-content">{{ $t('assets.deleteSelected') }}</h3>
                <p class="py-2 text-sm text-base-content/70">{{ $t('assets.deleteSelectedConfirm') }}</p>
                <div class="modal-action">
                    <form method="dialog" class="flex items-center gap-2">
                        <button class="btn btn-ghost btn-sm" @click="closeBulkDeleteModal">{{ $t('common.cancel') }}</button>
                        <button class="btn btn-error btn-sm" @click="confirmDeleteBulk">{{ $t('common.delete') }}</button>
                    </form>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="closeBulkDeleteModal">{{ $t('common.close') }}</button>
            </form>
        </dialog>
    </div>
</template>

<script setup lang="ts">
import type { Asset } from '~~/server/database/schemas/assets.schema';

const { t } = useI18n();
const { convertFileToBase64 } = useFile();
const { openAssetModal, closeAssetModal, showAssetModal } = useAsset();
const assetStore = useAssetStore();
const selectMode = ref(false);
const selectedIds = reactive(new Set<string>());
const deleteModalRef = ref<HTMLDialogElement | null>(null);
const bulkDeleteModalRef = ref<HTMLDialogElement | null>(null);
const toDeleteId = ref<string | null>(null);
const removingIds = reactive(new Set<string>());
const addingAssets = ref<boolean>(false);

const { isRemoving, removeBackgroundFromImage } = useBackgroundRemoval();
const { show: showToast } = useToast();

const { data: assets, refresh: refreshAssets } = await useFetch('/api/v1/asset', {
    transform: (data) => {
        if (assetStore.assets.length === 0) {
            assetStore.assets = data;
        }
        return data;
    }
});

const onAdd = async (files: File[]) => {
    const base64Files = await Promise.all(files.map(async (file) => {
        const base64 = await convertFileToBase64(file);
        return {
            fileName: file.name,
            base64: base64,
        };
    }));
    try {
        addingAssets.value = true;
        const { assets } = await $fetch('/api/v1/asset', {
            method: 'POST',
            body: {
                files: base64Files
            }
        });
        showToast({ status: 'success', title: t('assets.upload.assetsUploaded'), message: t('assets.upload.assetsUploadedSuccessfully') });
        assetStore.assets.unshift(...assets);
        closeAssetModal();
    } catch (error) {
        console.error(error);
        showToast({ status: 'error', title: t('common.errors.title'), message: t('common.errors.unknownError') });
    } finally {
        addingAssets.value = false;
    }
};

const toggleSelectMode = () => {
    selectMode.value = !selectMode.value;
    if (!selectMode.value) selectedIds.clear();
};
const isSelected = (id: string) => selectedIds.has(id);
const toggleSelect = (id: string) => {
    if (selectedIds.has(id)) selectedIds.delete(id); else selectedIds.add(id);
};
const onCardClick = (id: string) => {
    if (!selectMode.value) return;
    toggleSelect(id);
};
const selectAll = () => {
    if (!assets?.value) return;
    assets.value.forEach((a: any) => selectedIds.add(a.id));
};
const clearSelection = () => selectedIds.clear();

const openDeleteModal = (asset: any) => {
    toDeleteId.value = asset.id;
    deleteModalRef.value?.showModal();
};
const closeDeleteModal = () => {
    toDeleteId.value = null;
    if (deleteModalRef.value?.open) deleteModalRef.value?.close();
};
const confirmDeleteSingle = async () => {
    if (!toDeleteId.value) return;
    try {
        await assetStore.deleteAsset(toDeleteId.value);      
        closeDeleteModal();
    } catch (error) {
        console.error(error);
    }
};

// Remove background from an asset and save as image
const removeBackground = async (asset: any) => {
    if (!asset?.id) return;
    const config = useRuntimeConfig();
    try {
        removingIds.add(asset.id);
        const newAsset = await removeBackgroundFromImage(`${config.public.appUrl}/api/v1/asset/${asset.id}/view`, asset.id);
        assetStore.addAsset(newAsset as unknown as Asset);
        showToast({ status: 'success', title: t('assets.backgroundRemoved'), message: t('assets.savedAsNewImage') });
    } catch (error: any) {
        console.error(error);
        showToast({ status: 'error', title: t('assets.failedToRemoveBackground'), message: error?.message || t('assets.tryAgainLater') });
    } finally {
        removingIds.delete(asset.id);
    }
};

// Delete bulk
const openBulkDeleteModal = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteModalRef.value?.showModal();
};
const closeBulkDeleteModal = () => {
    if (bulkDeleteModalRef.value?.open) bulkDeleteModalRef.value?.close();
};
const confirmDeleteBulk = async () => {
    const ids = Array.from(selectedIds);
    try {
        for (const id of ids) await assetStore.deleteAsset(id);
        selectedIds.clear();
        selectMode.value = false;
        closeBulkDeleteModal();
    } catch (error) {
        console.error(error);
    }
};

useHead({
    title: clicklabPageTitle('Assets'),
});
</script>

<style scoped>

</style>