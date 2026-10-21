<template>
    <div class="flex flex-col gap-6 h-full" data-tour="image-to-image-page">
        <div class="flex flex-col gap-1 flex-shrink-0">
            <h1 class="text-2xl font-semibold text-base-content">
                {{ $t('imageToImage.title') }}
            </h1>
            <p class="text-sm text-base-content/70">
                {{ $t('imageToImage.description') }}
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
            <!-- Left: configuration -->
            <div
                class="card bg-base-200 border border-base-200 transition p-4 lg:col-span-4 flex flex-col overflow-hidden" data-tour="image-to-image-config">
                <div class="flex flex-col gap-6 flex-1 overflow-y-auto p-2">
                    <div class="form-control flex flex-col gap-2">
                        <BaseAvatarSelector :avatars="avatars" :avatarId="form.avatarId"
                            @update:avatarId="form.avatarId = $event" />
                    </div>

                    <div class="form-control flex flex-col gap-2">
                        <label class="label">
                            <span class="label-text text-sm font-medium">{{ $t('imageToImage.referenceImage') }}</span>
                        </label>
                        <input type="file" accept="image/*" class="file-input file-input-bordered file-input-sm w-full"
                            @change="onFile" />
                        <div v-if="referencePreview" class="mt-3">
                            <BaseKiThumbsImage :src="referencePreview" alt="reference preview"
                                containerClass="h-auto w-full" :animation-on-hover="false" />
                        </div>
                        <div v-else class="mt-2 text-xs text-base-content/60">{{ $t('imageToImage.uploadReferenceImage')
                            }}</div>
                    </div>

                    <div class="form-control flex flex-col gap-2">
                        <label class="label">
                            <span class="label-text text-sm font-medium">{{ $t('imageToImage.creativityLevel') }}</span>
                        </label>
                        <select class="select select-bordered w-full bg-base-100" v-model="form.creativityLevel">
                            <option value="1">{{ $t('imageToImage.creativityLevels.1') }}</option>
                            <option value="2">{{ $t('imageToImage.creativityLevels.2') }}</option>
                            <option value="3">{{ $t('imageToImage.creativityLevels.3') }}</option>
                            <option value="4">{{ $t('imageToImage.creativityLevels.4') }}</option>
                        </select>
                    </div>

                    <div class="form-control flex flex-col gap-4">
                        <label class="label">
                            <span class="label-text text-sm font-medium">{{ $t('imageToImage.options.title') }}</span>
                        </label>
                        <div class="text-sm flex flex-col gap-2 px-6">
                            <label class="label cursor-pointer justify-start gap-3">
                                <input type="checkbox" class="checkbox checkbox-sm checkbox-primary"
                                    v-model="form.keepBackground" />
                                <span class="label-text">{{ $t('imageToImage.options.keepBackground') }}</span>
                            </label>
                            <label class="label cursor-pointer justify-start gap-3">
                                <input type="checkbox" class="checkbox checkbox-sm checkbox-primary"
                                    v-model="form.matchLighting" />
                                <span class="label-text">{{ $t('imageToImage.options.matchLighting') }}</span>
                            </label>
                        </div>
                    </div>
                </div>
                <BaseGenerateButton :isLoading="isGenerating" :credits="1" @click="onGenerate" hotkeyEnabled
                    :disabled="!form.avatarId || !referencePreview" />
            </div>

            <!-- Right: viewer -->
            <div
                class="rounded-lg bg-base-200 border border-base-200 transition p-4 lg:col-span-8 flex flex-col overflow-hidden" data-tour="image-to-image-viewer">
                <div class="card-header mb-2 flex items-center justify-between flex-shrink-0">
                    <div class="join bg-base-100 rounded-md">
                        <button class="btn btn-sm join-item" :class="viewMode === 'tabs' ? 'btn-primary' : 'btn-ghost'"
                            @click="viewMode = 'tabs'">{{ $t('imageToImage.viewMode.tabs') }}</button>
                        <button class="btn btn-sm join-item" :class="viewMode === 'side' ? 'btn-primary' : 'btn-ghost'"
                            @click="viewMode = 'side'">{{ $t('imageToImage.viewMode.side') }}</button>
                    </div>
                    <div class="text-xs text-base-content/60">{{ hasResult ? $t('imageToImage.viewMode.ready') :
                        $t('imageToImage.viewMode.waitingForInput') }}</div>
                </div>

                <div class="flex-1 overflow-y-auto">
                    <!-- Tabs mode -->
                    <div v-if="viewMode === 'tabs'" class="h-full flex flex-col">
                        <div class="tabs tabs-border border-b-2 w-full border-base-100">
                            <a class="tab" :class="activeTab === 'original' ? 'tab-active' : ''"
                                @click="activeTab = 'original'">Original</a>
                            <a class="tab" :class="activeTab === 'generated' ? 'tab-active' : ''"
                                @click="activeTab = 'generated'">Generated</a>
                        </div>
                        <div class="mt-4 flex-1">
                            <div v-if="activeTab === 'original'" class="rounded-[var(--radius-box)] h-full">
                                <div v-if="referencePreview">
                                    <BaseKiThumbsImage :src="referencePreview" alt="original"
                                        :animationOnHover="false" />
                                </div>
                                <div v-else
                                    class="h-full rounded-[var(--radius-box)] border border-base-200 bg-base-200/40 flex items-center justify-center text-sm text-base-content/70">
                                    {{ $t('imageToImage.uploadReferenceImage') }}
                                </div>
                            </div>
                            <div v-else class="rounded-[var(--radius-box)] h-full">
                                <div v-if="generatedUrl">
                                    <BaseKiThumbsImage :src="generatedUrl" alt="generated" :animationOnHover="false" />
                                </div>
                                <div v-else
                                    class="rounded-[var(--radius-box)] border border-base-200 bg-base-200/40 flex items-center justify-center text-sm text-base-content/70 h-full">
                                    {{ $t('imageToImage.generateToSeeResult') }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Side-by-side mode -->
                    <div v-else class="flex-1 mt-12 border border-base-200 rounded-lg">
                        <figure class="diff aspect-16/9 !grid z-40" tabindex="0">
                            <div class="diff-item-1" role="img" tabindex="0">
                                <img v-if="referencePreview" alt="Original image" :src="referencePreview" />
                            </div>
                            <div class="diff-item-2" role="img">
                                <img
                                v-if="generatedUrl"
                                alt="Generated images"
                                :src="generatedUrl" />
                            </div>
                            <div class="diff-resizer"></div>
                        </figure>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Avatar } from '~~/server/database/schemas/avatar.schema';
import type { Image } from '~~/server/database/schemas/image.schema';

const { t } = useI18n();
const toast = useToast();
const { $generationApi } = useNuxtApp();
const userStore = useUserStore();
const imageStore = useImageStore();
const { track } = usePosthog();
const { convertFileToBase64 } = useFile();

const { data: avatars } = await useFetch<Avatar[]>('/api/v1/avatar');

const isGenerating = ref(false);
const generationCost = ref(2);
const form = ref({
    avatarId: null as string | null,
    keepBackground: true,
    matchLighting: true,
    referenceImageBase64: null as string | null,
    creativityLevel: 2 as 1 | 2 | 3 | 4,
});

const referenceFile = ref<File | null>(null);
const referencePreview = ref<string | null>(null);
const generatedUrl = ref<string | null>(null);
const hasResult = computed(() => Boolean(generatedUrl.value));

const viewMode = ref<'tabs' | 'side'>('tabs');
const activeTab = ref<'original' | 'generated'>('original');

async function onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;
    referenceFile.value = file;
    if (file) {
        const base64 = await convertFileToBase64(file);
        form.value.referenceImageBase64 = base64;
        referencePreview.value = URL.createObjectURL(file);
    } else {
        referencePreview.value = null;
        form.value.referenceImageBase64 = null;
    }
}

async function onGenerate() {
    isGenerating.value = true;
    try {
        const { generatedImage, newImageUrl } = await $generationApi<{ generatedImage: Image, newImageUrl: string }>('/image-to-image', {
            method: 'POST',
            body: form.value,
            headers: {
                'X-Activity': 'IMAGE_TO_IMAGE',
                'X-Credits': String(generationCost.value),
            },
        });

        track('image.image-to-image.generated', {
            credits: generationCost.value,
            email: userStore.user?.email,
            tier: userStore.tier?.name,
        });
        imageStore.addImage(generatedImage);
        await imageStore.selectImage(generatedImage.id);
        activeTab.value = 'generated';
        generatedUrl.value = `/api/v1/image/${generatedImage.id}/view`;

        toast.show({
            title: t('common.success.title'),
            message: t('common.success.message'),
            status: 'success',
        });

    } catch (error: any) {
        console.error(error);
        toast.show({
            title: t('common.errors.title'),
            message: error.message,
            status: 'error',
        });
    } finally {
        isGenerating.value = false;
    }
}

useHead({ title: clicklabPageTitle('Image to Image') });
</script>

<style scoped></style>