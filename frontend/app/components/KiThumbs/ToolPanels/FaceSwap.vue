<template>
    <div class="h-full max-h-full flex flex-col min-h-0">
        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
            <div class="form-control flex flex-col gap-2">
                <label class="label py-1">
                    <span class="label-text text-xs">{{ $t('faceSwap.sourceFace') }}</span>
                </label>
                <div class="join w-full grid grid-cols-3">
                    <button
                        type="button"
                        class="btn btn-sm join-item"
                        :class="sourceType === 'asset' ? 'btn-primary' : 'btn-ghost border border-base-content/20'"
                        @click="setSourceType('asset')"
                    >
                        {{ $t('faceSwap.asset') }}
                    </button>
                    <button
                        type="button"
                        class="btn btn-sm join-item"
                        :class="sourceType === 'avatar' ? 'btn-primary' : 'btn-ghost border border-base-content/20'"
                        @click="setSourceType('avatar')"
                    >
                        {{ $t('faceSwap.avatar') }}
                    </button>
                    <button
                        type="button"
                        class="btn btn-sm join-item"
                        :class="sourceType === 'upload' ? 'btn-primary' : 'btn-ghost border border-base-content/20'"
                        @click="setSourceType('upload')"
                    >
                        {{ $t('faceSwap.upload') }}
                    </button>
                </div>
                <div v-if="sourceType === 'asset'" class="flex items-center justify-between gap-3">
                    <div class="h-12 w-12 rounded-full border border-base-content/20 overflow-hidden bg-base-200">
                        <BaseKiThumbsImage
                            v-if="sourceAsset"
                            :src="`/api/v1/asset/${sourceAsset.id}/view`"
                            :alt="sourceAsset.name"
                            :container-class="'w-full h-full object-cover'"
                        />
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm w-full" @click="isSourceAssetModalOpen = true">
                        {{ sourceAsset ? $t('faceSwap.changeAsset') : $t('faceSwap.selectAsset') }}
                    </button>
                </div>
                <div v-else-if="sourceType === 'avatar'" class="flex flex-col gap-3">
                    <div class="flex items-center justify-between gap-2">
                        <select class="select select-bordered select-sm flex-1 bg-base-100" v-model="sourceAvatarId"
                            @change="onAvatarChange">
                            <option disabled value="">{{ $t('faceSwap.selectAvatar') }}</option>
                            <option v-for="avatar in avatars" :key="avatar.id" :value="avatar.id">{{ avatar.name }}
                            </option>
                        </select>
                        <div class="h-10 w-10 rounded-full border border-base-content/20 overflow-hidden bg-base-200 shrink-0">
                            <BaseKiThumbsImage
                                v-if="sourceAvatarId"
                                :src="`/api/v1/avatar/${sourceAvatarId}/training-image`"
                                alt="Avatar"
                                :container-class="'w-full h-full object-cover'"
                            />
                        </div>
                    </div>
                    <div v-if="sourceAvatarId && localTrainingImageCount > 0" class="grid grid-cols-3 gap-2 overflow-y-auto" :key="`grid-${sourceAvatarId}`">
                        <BaseKiThumbsImage
                            v-for="idx in localTrainingImageCount"
                            :key="`${sourceAvatarId}-${idx}`"
                            :src="`/api/v1/avatar/${sourceAvatarId}/training-image/${idx}/view`"
                            alt="Avatar training image"
                            :container-class="`aspect-square rounded border-2 cursor-pointer transition-all overflow-hidden ${sourceAvatarImageIndex === idx ? 'border-primary ring-2 ring-primary/30' : 'border-base-content/20 hover:border-base-content/40'}`"
                            @click="sourceAvatarImageIndex = idx"
                        />
                    </div>
                </div>
                <div v-else class="flex flex-col gap-2">
                    <input type="file" accept="image/*" class="file-input file-input-bordered file-input-sm w-full"
                        @change="onSourceFile" />
                    <div v-if="sourcePreview" class="h-16 w-16 rounded-full border border-base-content/20 overflow-hidden">
                        <img :src="sourcePreview" alt="source preview" class="h-full w-full object-cover" />
                    </div>
                </div>
            </div>

            <p class="text-xs text-base-content/60">{{ $t('faceSwap.replaceTarget') }}</p>
        </div>

        <div class="flex-shrink-0">
            <BaseGenerateButton :is-loading="isGenerating" :credits="generationCost" hotkey-enabled
                :disabled="!isValid" @click="generateFaceSwap" />
        </div>

        <BaseAssetModal v-model="isSourceAssetModalOpen" :multiple="false" @confirm="onSourceAssetPicked" />
    </div>
</template>

<script setup lang="ts">
import type { Asset } from '~~/server/database/schemas/assets.schema';
import type { Image } from '~~/server/database/schemas/image.schema';

const props = defineProps<{
    originalImageId: string;
}>();

const { $generationApi } = useNuxtApp();
const { t } = useI18n();
const toast = useToast();
const imageStore = useImageStore();
const userStore = useUserStore();
const { track } = usePosthog();
const { convertFileToBase64 } = useFile();
const avatarStore = useAvatarStore();

const sourceType = ref<'asset' | 'avatar' | 'upload'>('asset');
const sourceAsset = ref<Asset | null>(null);
const sourceAvatarId = ref<string>('');
const sourceAvatarImageIndex = ref<number | null>(null);
const sourceBase64 = ref<string | null>(null);
const sourcePreview = ref<string | null>(null);

const isSourceAssetModalOpen = ref(false);
const isGenerating = ref(false);
const generationCost = ref(1);

const { data: avatarsData } = useFetch('/api/v1/avatar');
const avatars = computed(() => avatarsData.value || []);
const localTrainingImageCount = ref(0);

const isValid = computed(() => {
    let hasSource = false;
    if (sourceType.value === 'asset') hasSource = Boolean(sourceAsset.value?.id);
    else if (sourceType.value === 'avatar') hasSource = Boolean(sourceAvatarId.value && sourceAvatarImageIndex.value !== null);
    else hasSource = Boolean(sourceBase64.value);
    return hasSource && Boolean(props.originalImageId);
});

function revokeSourcePreview() {
    if (sourcePreview.value) {
        URL.revokeObjectURL(sourcePreview.value);
        sourcePreview.value = null;
    }
}

function setSourceType(type: 'asset' | 'avatar' | 'upload') {
    sourceType.value = type;
    sourceAsset.value = null;
    sourceAvatarId.value = '';
    sourceAvatarImageIndex.value = null;
    localTrainingImageCount.value = 0;
    sourceBase64.value = null;
    revokeSourcePreview();
}

async function onAvatarChange() {
    sourceAvatarImageIndex.value = null;
    localTrainingImageCount.value = 0;
    if (sourceAvatarId.value) {
        const count = await avatarStore.getTotalTrainingImages(sourceAvatarId.value);
        localTrainingImageCount.value = count;
    }
}

function onSourceAssetPicked(assets: Asset[]) {
    sourceAsset.value = assets[0] || null;
}

async function onSourceFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;
    if (!file) {
        sourceBase64.value = null;
        revokeSourcePreview();
        return;
    }
    sourceBase64.value = await convertFileToBase64(file);
    revokeSourcePreview();
    sourcePreview.value = URL.createObjectURL(file);
}

onBeforeUnmount(() => {
    revokeSourcePreview();
});

async function generateFaceSwap() {
    const hasSource = sourceType.value === 'asset'
        ? Boolean(sourceAsset.value?.id)
        : sourceType.value === 'avatar'
            ? Boolean(sourceAvatarId.value && sourceAvatarImageIndex.value)
            : Boolean(sourceBase64.value);
    if (!hasSource || !props.originalImageId || isGenerating.value) return;
    try {
        isGenerating.value = true;
        const body: Record<string, unknown> = {
            targetImageId: props.originalImageId,
        };
        if (sourceType.value === 'asset') {
            body.sourceAssetId = sourceAsset.value?.id;
        } else if (sourceType.value === 'avatar') {
            body.sourceAvatarId = sourceAvatarId.value;
            body.sourceAvatarImageIndex = sourceAvatarImageIndex.value;
        } else {
            body.sourceImageBase64 = sourceBase64.value;
        }
        const generatedImage = await $generationApi<Image>('/face-swap', {
            method: 'POST',
            body,
            headers: {
                'X-Activity': 'FACESWAP',
                'X-Credits': String(generationCost.value),
            },
        });

        track('image.face-swap.generated', {
            credits: generationCost.value,
            tier: userStore.tier?.name,
            userId: userStore.user?.id,
        });

        imageStore.addImage(generatedImage);
        imageStore.selectedImage = generatedImage;
        await navigateTo(`/images/${generatedImage.id}`);
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
</script>