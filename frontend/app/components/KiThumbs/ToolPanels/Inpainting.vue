<template>
    <div class="h-full max-h-full flex flex-col min-h-0">
        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
            <label class="label py-1">
                <span class="label-text text-xs text-wrap">
                    {{ $t('inpainting.prompt') }}
                </span>
            </label>
            <textarea type="text" class="input input-bordered bg-base-100 p-2 h-36 text-wrap" v-model="form.prompt" rows="3" :placeholder="$t('inpainting.promptPlaceholder')" />
        </div>

        <div class="flex-shrink-0">
            <BaseGenerateButton :is-loading="isGenerating" :credits="generationCost" hotkey-enabled @click="inpaintingGeneration" :disabled="!form.prompt" />
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
const { getPathFromCanvas, canvas } = useCanvas();
const { convertPathToMask, clearPath } = useCanvasPath();

const props = defineProps<{
    originalImageId: string;
}>();

const isGenerating = ref(false);
const generationCost = ref(1);

const form = ref({
    prompt: '',
    pathMask: '',
    originalImageId: props.originalImageId,
});

const inpaintingGeneration = async () => {
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

        const generatedImage = await $generationApi<Image>('/inpainting', {
            method: 'POST',
            body: {
                prompt: form.value.prompt,
                pathMask: form.value.pathMask,
                originalImageId: form.value.originalImageId,
            },
            headers: {
                'X-Activity': 'INPAINTING',
                'X-Credits': String(generationCost.value),
            },
            timeout: 120_000,
        });

        track('image.inpainting.generated', {
            credits: generationCost.value,
            email: userStore.user?.email,
            tier: userStore.tier?.name,
        });
        imageStore.addImage(generatedImage);
        clearPath(canvas.value);
        
        await imageStore.selectImage(generatedImage.id);

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
</style>