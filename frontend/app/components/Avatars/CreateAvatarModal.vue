<template>
    <dialog ref="modalRef" class="modal" @cancel.prevent>
        <div class="modal-box w-[90vw] h-[90vh] max-w-none p-0 bg-base-200 transition-transform duration-300 ease-out"
        >
            <!-- Close button -->
            <button class="btn btn-ghost btn-sm absolute right-2 top-2" @click="onClose" aria-label="Close">
                <Icon name="lucide:x" class="h-4 w-4" />
            </button>

            <div class="flex flex-col md:flex-row h-full">
                <!-- Info sidebar -->
                <aside
                    class="md:w-1/3 border-b md:border-b-0 md:border-r p-4 sm:p-6 overflow-auto border-base-200 flex flex-col gap-4">
                    <div class="flex flex-col">
                        <h3 class="text-lg font-medium text-base-content">{{ $t('avatars.create.title') || 'Create anavatar' }}</h3>
                        <p class="text-sm text-base-content/70 mt-1">{{ $t('avatars.create.subtitle') || 'Follow the guidelines for best results.' }}</p>
                    </div>

                    <!-- Guideline image -->
                    <div class="flex-1 rounded-box overflow-hidden aspect-square">
                        <img src="~/assets/img/reference_avatar.png" alt="Avatar" class="w-full h-full object-cover" />
                    </div>

                    <div class="space-y-3 text-sm text-base-content/80">
                        <div class="flex items-start gap-2">
                            <Icon name="lucide:check-circle" class="h-4 w-4 text-[var(--color-primary)] mt-0.5" />
                            <p>{{ $t('avatars.create.tips.one') || 'Upload between <span class="font-medium" > 12–20 </span> clear, varied photos of the same person.' }}</p>
                        </div>
                        <div class="flex items-start gap-2">
                            <Icon name="lucide:check-circle" class="h-4 w-4 text-[var(--color-primary)] mt-0.5" />
                            <p>{{ $t('avatars.create.tips.two') || 'Include different angles, lighting, and expressions. Avoid duplicates.' }}</p>
                        </div>
                        <div class="flex items-start gap-2">
                            <Icon name="lucide:alert-circle" class="h-4 w-4 text-warning mt-0.5" />
                            <p>{{ $t('avatars.create.tips.three') || 'Ensure you have the right to use these images and consent from the person.' }}</p>
                        </div>
                    </div>
                </aside>

                <!-- Form area -->
                <section class="flex-1 p-4 sm:p-6 overflow-auto">
                    <form class="flex flex-col h-full" @submit.prevent="onSubmit">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Name -->
                            <div class="form-control flex gap-2 items-center">
                                <label class="label">
                                    <span class="label-text text-sm">{{ $t('avatars.create.name') || 'Name' }}</span>
                                </label>
                                <input type="text" class="input input-bordered" placeholder="Willyrex"
                                    v-model="form.name" />
                                <label class="label min-h-5">
                                    <span class="label-text-alt text-error" v-if="showErrors && !validName">{{
                                        $t('common.required') || 'Required' }}</span>
                                </label>
                            </div>

                            <!-- Genre -->
                            <div class="form-control flex gap-2 items-center">
                                <label class="label">
                                    <span class="label-text text-sm">{{ $t('avatars.create.genre') || 'Genre' }}</span>
                                </label>
                                <select v-model="form.genre" class="select select-bordered">
                                    <option disabled value="">{{ $t('common.select') || 'Select' }}</option>
                                    <option value="female">{{ $t('avatars.create.genreFemale') || 'Female' }}</option>
                                    <option value="male">{{ $t('avatars.create.genreMale') || 'Male' }}</option>
                                    <option value="other">{{ $t('common.other') || 'Other' }}</option>
                                </select>
                                <label class="label min-h-5">
                                    <span class="label-text-alt text-error" v-if="showErrors && !validGenre">{{
                                        $t('common.required') || 'Required' }}</span>
                                </label>
                            </div>
                        </div>

                        <!-- Upload -->
                        <div class="flex-1 flex flex-col min-h-0 p-4 gap-4">
                            <div class="flex items-center justify-between">
                                <label class="label p-0">
                                    <span class="label-text text-sm">{{ $t('avatars.create.photos') || 'Photos (12–20 required)' }}</span>
                                </label>
                                <div class="text-xs text-base-content/70">{{ files.length }} / 12–20</div>
                            </div>
                            <div class="card border border-base-200 rounded-box flex flex-col min-h-0">
                                <input type="file" class="file-input w-full" multiple accept="image/*" @change="onFilesSelected" />
                                <p class="text-xs text-base-content/70 mt-2">{{ $t('avatars.create.photosHint') ||
                                    'Upload clear, varied photos. JPG or PNG.' }}</p>
                                <div
                                    class="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 flex-1 overflow-auto">
                                    <div v-for="(item, idx) in files" :key="item.key"
                                        class="relative group h-40 sm:h-32 md:h-40 rounded-box overflow-hidden bg-base-200">
                                        <img :src="item.url" :alt="item.file.name"
                                            class="w-full h-full object-cover pointer-events-none" />
                                        <button type="button"
                                            class="btn btn-ghost btn-xs btn-circle absolute top-1 right-1 bg-base-100/80 hover:bg-base-100 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                            @click="removeFile(idx)" aria-label="Remove">
                                            <Icon name="lucide:x" class="h-3 w-3 text-base-content" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-1 text-error text-xs" v-if="showErrors && !validFiles">{{
                                $t('avatars.create.photosError') || 'Please upload between 12 and 20 photos.' }}</div>
                        </div>

                        <!-- Confirmation -->
                        <div class="mt-4 form-control p-2">
                            <label class="label cursor-pointer justify-start gap-3">
                                <input type="checkbox" class="checkbox checkbox-sm bg-base-100" v-model="form.confirm" />
                                <span class="label-text text-sm">{{ $t('avatars.create.consent') || 'I confirm I have the right and consent to use these photos for training.' }}</span>
                            </label>
                            <label class="label min-h-5">
                                <span class="label-text-alt text-error" v-if="showErrors && !form.confirm">{{
                                    $t('common.required') || 'Required' }}</span>
                            </label>
                        </div>

                        <!-- Footer actions -->
                        <div class="mt-auto pt-4 border-t border-base-200 flex items-center justify-end gap-2">
                            <button type="button" class="btn btn-ghost btn-sm" @click="onClose">{{ $t('common.cancel')
                                || 'Cancel' }}</button>
                            <button type="submit" class="btn btn-primary btn-sm" :disabled="!isValid || isGenerating">
                                <Icon name="svg-spinners:bars-scale-fade" size="16" mode="svg" v-if="isGenerating" />
                                {{ isGenerating ? $t('common.generating') || 'Generating...' : $t('avatars.create.action') || 'Create avatar' }}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button aria-label="Close" @click="onClose"></button>
        </form>
    </dialog>
</template>

<script setup lang="ts">
const modalRef = ref<HTMLDialogElement | null>(null);

type Genre = '' | 'female' | 'male' | 'other';

const { t } = useI18n();
const { showAvatarCreateModal } = useAvatar();
const toast = useToast();

const MAX_IMAGE_DIMENSION = 768;
const JPEG_QUALITY = 0.75;

async function compressImage(file: File): Promise<{ blob: Blob; base64: string }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            
            let { width, height } = img;
            if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
                if (width > height) {
                    height = (height / width) * MAX_IMAGE_DIMENSION;
                    width = MAX_IMAGE_DIMENSION;
                } else {
                    width = (width / height) * MAX_IMAGE_DIMENSION;
                    height = MAX_IMAGE_DIMENSION;
                }
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to compress image'));
                        return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = (reader.result as string).split(',')[1] as string;
                        resolve({ blob, base64 });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                },
                'image/jpeg',
                JPEG_QUALITY
            );
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
}
const props = defineProps<{
    show: boolean;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'create', payload: { name: string; genre: Genre; files: File[] }): void;
    (e: 'refresh'): void;
}>();

const isGenerating: Ref<boolean> = ref(false);
const form = reactive<{ name: string; genre: Genre; confirm: boolean }>({
    name: '',
    genre: '',
    confirm: false,
});

type SelectedImage = { file: File; url: string; key: string; base64string: string; fileType: string; blob: Blob };
const files = ref<SelectedImage[]>([]);
const showErrors = ref<boolean>(false);

const validName = computed(() => form.name.trim().length > 0);
const validGenre = computed(() => !!form.genre);
const validFiles = computed(() => files.value.length >= 12 && files.value.length <= 20);
const isValid = computed(() => validName.value && validGenre.value && validFiles.value && form.confirm);

const onFilesSelected = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const list = input.files;
    if (!list) return;
    const incoming = Array.from(list).filter(f => f.type.startsWith('image/'));
    const existingKeys = new Set(files.value.map(i => i.key));
    const newItems: SelectedImage[] = [];
    for (const f of incoming) {
        const key = `${f.name}|${f.size}|${f.lastModified}`;
        if (existingKeys.has(key)) continue;
        try {
            const { blob, base64 } = await compressImage(f);
            newItems.push({ 
                file: f,
                url: URL.createObjectURL(blob),
                key,
                base64string: base64,
                fileType: 'image/jpeg',
                blob,
            });
        } catch (err) {
            console.error('Failed to compress image:', f.name, err);
        }
    }
    files.value = [...files.value, ...newItems];
    input.value = '';
};

const removeFile = (idx: number) => {
    const item = files.value[idx];
    if (!item) return;
    URL.revokeObjectURL(item.url);
    files.value.splice(idx, 1);
};

const reset = () => {
    form.name = '';
    form.genre = '' as Genre;
    form.confirm = false;
    files.value.forEach(i => URL.revokeObjectURL(i.url));
    files.value = [];
    showErrors.value = false;
};

const open = () => {
    showAvatarCreateModal.value = true;
    if (!modalRef.value?.open) modalRef.value?.showModal();
};

const close = () => {
    showAvatarCreateModal.value = false;
    if (modalRef.value?.open) modalRef.value?.close();
};

const onClose = () => {
    close();
    emit('close');
};

const onSubmit = async () => {
    try {
        if (!isValid.value) {
            showErrors.value = true;
            return;
        };

        isGenerating.value = true;
        let usedFallback = false;
        let uploadId = '';
        let uploads: { storageKey: string; uploadUrl: string }[] = [];

        try {
            const presignedResponse = await fetch('/api/v1/avatar/train/presigned-urls', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: files.value.map((file) => ({
                        fileType: file.fileType
                    })),
                }),
            });
            if (!presignedResponse.ok) {
                throw new Error('Failed to prepare upload');
            }
            const presignedPayload: { uploadId: string; uploads: { storageKey: string; uploadUrl: string }[] } = await presignedResponse.json();
            uploadId = presignedPayload.uploadId;
            uploads = presignedPayload.uploads;

            await Promise.all(uploads.map((upload, index) => {
                const file = files.value[index];
                if (!file) return Promise.resolve();
                return fetch(upload.uploadUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': file.fileType
                    },
                    body: file.blob
                }).then((res) => {
                    if (!res.ok) {
                        throw new Error('Failed to upload image');
                    }
                });
            }));
        } catch {
            usedFallback = true;
        }

        if (!usedFallback) {
            await $fetch('/api/v1/avatar/train/lora-avatar', {
                method: 'POST',
                body: {
                    files: uploads.map((upload) => ({
                        storageKey: upload.storageKey
                    })),
                    uploadId,
                    name: form.name.trim(),
                    genre: form.genre,
                },
            });
        } else {
            await $fetch('/api/v1/avatar/train/lora-avatar', {
                method: 'POST',
                body: {
                    files: files.value.map((file) => ({
                        base64string: file.base64string,
                        fileType: file.fileType
                    })),
                    name: form.name.trim(),
                    genre: form.genre,
                },
            });
        }
        // TODO mirar les localizations
        toast.show({
            title: t('avatars.create.success.title'),
            message: t('avatars.create.success.message'),
            status: 'success',
        });
        emit('close');
        emit('refresh');
    } catch (error) {
        console.error(error);
        toast.show({
            title: t('avatars.create.error.title'),
            message: t('avatars.create.error.message'),
            status: 'error',
        });
    } finally {
        isGenerating.value = false;
    }
};

watch(
    () => props.show,
    (val) => {
        if (val) {
            open();
        } else {
            close();
        }
    }
);

onBeforeUnmount(() => {
    files.value.forEach(i => URL.revokeObjectURL(i.url));
});

defineExpose({ open, close, reset });
</script>

<style scoped></style>