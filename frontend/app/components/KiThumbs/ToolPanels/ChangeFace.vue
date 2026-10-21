<template>
    <div class="h-full max-h-full flex flex-col min-h-0">
        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
            <!-- <div class="form-control">
                <label class="label py-1">
                    <span class="label-text text-xs">
                        Intensidad
                    </span>
                </label>
                <input type="range" min="0" max="100" value="60" class="range range-xs text-primary" />
            </div> -->
    
            <div class="form-control">
                <label class="label py-1">
                    <span class="label-text text-xs">
                        {{ $t('changeFace.avatar') }}
                    </span>
                </label>
            </div>
            <div class="flex items-center justify-between">
                <BaseKiThumbsImage v-if="form.avatarId" :src="`/api/v1/avatar/${form.avatarId}/training-image`" alt="Avatar Training Image" class="max-w-10 max-h-10 rounded-full" />
                <span v-else class="w-10 h-10 rounded-full bg-base-200 border border-base-content/40 flex items-center justify-center">
                    <Icon name="lucide:user" size="48" class="text-base-content/40" />
                </span>
                <select class="select select-bordered w-3/4 bg-base-100" v-model="form.avatarId">
                    <option disabled value="">{{ $t('changeFace.selectAvatar') }}</option>
                    <option v-for="avatar in avatars" :key="avatar.id" :value="avatar.id">{{ avatar.name }}</option>
                </select>
            </div>

            <div class="mt-2">
                <button type="button" class="btn btn-ghost btn-sm gap-6 w-full items-center justify-between" @click="advancedOpen = !advancedOpen" aria-expanded="false">
                    {{ $t('changeFace.advancedOptions') }}
                    <Icon name="lucide:chevron-down" class="h-4 w-4" />
                </button>

                <Transition name="fade">
                    <div v-show="advancedOpen" class="mt-3 p-3 bg-base-200 border border-base-200 rounded-md text-sm flex flex-col gap-6">
                        <div class="form-control space-y-1">
                            <label class="label py-1">
                                <span class="label-text text-xs">
                                    {{ $t('changeFace.prompt') }}
                                </span>
                            </label>
                            <textarea class="input input-bordered bg-base-100 p-2 h-24" v-model="form.prompt" rows="3" />
                        </div>
                    </div>
                </Transition>
            </div>
        </div>

        <div class="flex-shrink-0">
            <BaseGenerateButton :is-loading="isGenerating" :credits="generationCost" hotkey-enabled @click="changeFaceGeneration" :disabled="!form.avatarId" />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Image } from '~~/server/database/schemas/image.schema';

const { $generationApi } = useNuxtApp();

const toast = useToast();
const imageStore = useImageStore();
const userStore = useUserStore();

const { t } = useI18n();
const { track } = usePosthog();
const { getPathFromCanvas, canvas, clearCanvas } = useCanvas();
const { convertPathToMask } = useCanvasPath();

const { data: avatars } = useFetch('/api/v1/avatar');

const props = defineProps<{
    originalImageId: string;
}>();

const isGenerating = ref(false);
const advancedOpen = ref(false);
const generationCost = ref(1);

const form = ref({
    avatarId: null as string | null,
    prompt: 'human face',
    pathMask: '',
    originalImageId: props.originalImageId,
});

const changeFaceGeneration = async () => {
    if (!canvas.value) return;

    try {
        isGenerating.value = true;
        const path = getPathFromCanvas();
        if (!path) {
            toast.show({
                title: t('common.errors.title'),
                message: t('common.errors.noPathFound'),
                status: 'info',
            });
            return;
        }
        const pathMask = await convertPathToMask(path, { width: 1270, height: 720 });
        form.value.pathMask = pathMask;

        const generatedImage = await $generationApi<Image>('/change-face', {
            method: 'POST',
            body: form.value,
            headers: {
                'X-Activity': 'CHANGE_FACE',
                'X-Credits': String(generationCost.value),
            },
        });

        track('image.change-face.generated', {
            credits: generationCost.value,
            email: userStore.user?.email,
            tier: userStore.tier?.name,
        });
        imageStore.addImage(generatedImage);
        imageStore.selectedImage = generatedImage;
        clearCanvas();

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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>