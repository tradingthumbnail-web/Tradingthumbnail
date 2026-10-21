<template>
    <div v-if="props.open" class="fixed bottom-6 right-6 z-40">
        <div class="card bg-base-100 border border-base-200 shadow-lg w-[22rem] max-h-[70vh] flex flex-col overflow-hidden relative" :aria-busy="props.isUploading" data-tour="assets-modal">
            <div class="card-header p-4 flex items-center justify-between">
                <h3 class="text-sm font-semibold">{{ $t('assets.upload.title') }}</h3>
                <button class="btn btn-ghost btn-xs" @click="emit('close')">
                    <Icon name="lucide:x" class="w-4 h-4" />
                </button>
            </div>
            <div class="p-4 pt-0 flex-1 min-h-0 overflow-y-auto">
                <div
                    class="border border-dashed border-base-300 rounded-[var(--radius-box)] p-4 bg-base-200/40 text-center text-sm text-base-content/70"
                    @dragover.prevent="isDragging = true"
                    @dragleave.prevent="isDragging = false"
                    @drop.prevent="onDrop"
                    :class="isDragging ? 'bg-base-200 border-primary' : ''"
                >
                    <p class="mb-2">{{ $t('assets.upload.dragAndDrop') }}</p>
                    <p class="text-xs opacity-70 mb-3">{{ $t('assets.upload.orClickToBrowse') }}</p>
                    <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFileChange" :disabled="props.isUploading" />
                    <button class="btn btn-sm btn-primary" @click="fileInput?.click()" :disabled="props.isUploading">{{ $t('assets.upload.selectFiles') }}</button>
                </div>

                <div v-if="files.length" class="mt-4 grid grid-cols-1 gap-3">
                    <div v-for="(f, idx) in files" :key="idx" class="flex items-center gap-3">
                        <div class="w-14 h-10 rounded overflow-hidden bg-base-200">
                            <img :src="getPreview(f)" alt="" class="w-full h-full object-cover" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="truncate text-sm">{{ f.name }}</p>
                            <p class="text-xs opacity-60">{{ formatBytes(f.size) }}</p>
                        </div>
                        <button class="btn btn-ghost btn-xs" @click="remove(idx)">
                            <Icon name="lucide:trash" class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            <div class="p-4 flex items-center justify-between border-t border-base-200">
                <button class="btn btn-ghost btn-sm" @click="emit('close')" :disabled="props.isUploading">{{ $t('common.close') }}</button>
                <button class="btn btn-primary btn-sm" :disabled="!files.length || props.isUploading" @click="confirm">
                    {{ $t('assets.upload.add', { count: files.length }) }}
                </button>
            </div>
            <div v-if="props.isUploading" class="absolute inset-0 bg-base-100/80 backdrop-blur-sm flex items-center justify-center z-50">
                <span class="loading loading-spinner loading-md text-primary"></span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    open: boolean,
    isUploading: boolean,
}>();
const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'add', files: File[]): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const files = ref<File[]>([]);
const isDragging = ref(false);

function onDrop(e: DragEvent) {
    isDragging.value = false;
    const list = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'));
    if (list.length) files.value = files.value.concat(list);
}

function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const list = Array.from(input.files || []);
    if (list.length) files.value = files.value.concat(list);
    if (fileInput.value) fileInput.value.value = '';
}

function getPreview(f: File) {
    return URL.createObjectURL(f);
}

function formatBytes(bytes: number) {
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

function remove(idx: number) {
    files.value.splice(idx, 1);
}

function confirm() {
    emit('add', files.value);
    files.value = [];
};
</script>

<style scoped>

</style>


