<template>
    <div class="flex flex-col gap-6 h-full" data-tour="quick-thumbnail-page">
        <!-- Hero -->
        <div class="flex-shrink-0">
            <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="space-y-1">
                    <h1 class="text-2xl font-semibold text-base-content">{{ $t('quickThumb.title') }}</h1>
                    <p class="text-sm text-base-content/70">{{ $t('quickThumb.description') }}</p>
                </div>
                <div class="flex items-center gap-2">
                    <div class="badge badge-primary badge-outline">{{ $t('common.beta') }}</div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
            <!-- Left: steps and form -->
            <div class="card bg-base-200 border border-base-200 p-4 flex flex-col overflow-hidden lg:col-span-4" data-tour="quick-thumbnail-forms">
                <!-- Steps header -->
                <div class="flex-shrink-0 flex flex-col gap-6" data-tour="quick-thumbnail-steps">
                    <div class="flex items-start justify-between gap-2">
                        <h2 class="text-lg font-bold">{{ $t('quickThumb.steps') }}</h2>
                    </div>
                    <ul class="steps w-full">
                        <li class="step" :class="currentStep >= 0 ? 'step-primary' : ''">{{ $t('quickThumb.basics') }}</li>
                        <li class="step" :class="currentStep >= 1 ? 'step-primary' : ''">{{ $t('quickThumb.type') }}</li>
                        <li class="step" :class="currentStep >= 2 ? 'step-primary' : ''">{{ $t('quickThumb.avatar') }}</li>
                        <li class="step" :class="currentStep >= 3 ? 'step-primary' : ''">{{ $t('quickThumb.details') }}</li>
                    </ul>
                </div>

                <!-- Step content -->
                <div class="flex-1 overflow-y-auto p-4">
                    <Transition name="fade-slide" mode="out-in">
                        <div v-if="currentStep === 0" key="step-0" class="flex flex-col gap-3">
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">{{ $t('quickThumb.whatIsTheVideoTitle') }}</legend>
                                <input type="text" class="input w-full text-wrap" v-model="quickThumbForm.title"
                                    :placeholder="$t('quickThumb.placeholderVideoTitle')" />
                                <p class="label text-wrap">{{ $t('quickThumb.itDoesntHaveToBeTheFinalTitle') }}</p>
                            </fieldset>
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">{{ $t('quickThumb.whatIsTheDescriptionOfTheThumbScene') }}</legend>
                                <textarea type="text" class="input w-full text-wrap h-28" v-model="quickThumbForm.sceneDescription"
                                    :placeholder="$t('quickThumb.placeholderThumbSceneDescription')" />
                                <p class="label text-wrap">{{ $t('quickThumb.describeInOneSentenceWhatTheThumbnailSceneIsAbout') }}</p>
                            </fieldset>
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">{{ $t('quickThumb.whatEmotionsDoYouWantToConvey') }}</legend>
                                <select class="select select-bordered w-full" v-model="quickThumbForm.emotions">
                                    <option v-for="emotion in emotions" :key="emotion.value" :value="emotion.value">{{ emotion.label }}</option>
                                </select>
                                <p class="label text-wrap">{{ $t('quickThumb.selectTheEmotionYouWantToConveyInTheThumbnail') }}</p>
                            </fieldset>
                        </div>

                        <div v-else-if="currentStep === 1" key="step-1" class="flex flex-col gap-3">
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">{{ $t('quickThumb.whatKindOfVideoItIs') }}</legend>
                                <select class="select select-bordered w-full" v-model="quickThumbForm.typeOfVideo">
                                    <option v-for="type in types" :key="type.value" :value="type.value">{{ type.label }}</option>
                                </select>
                                <p class="label text-wrap">{{ $t('quickThumb.selectWhatTypeIsMoreCloseToYourVideo') }}</p>
                            </fieldset>

                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">{{ $t('quickThumb.whatThumbnailStyleDoYouPrefer') }}</legend>
                                <select class="select select-bordered w-full" v-model="quickThumbForm.thumbnailStyle">
                                    <option v-for="s in thumbnailStyles" :key="s.value" :value="s.value">{{ s.label }}</option>
                                </select>
                                <p class="label text-wrap">{{ $t('quickThumb.chooseTheOverallAestheticOfTheThumbnail') }}</p>
                            </fieldset>
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">{{ $t('quickThumb.whichLayoutDoYouPrefer') }}</legend>
                                <select class="select select-bordered w-full" v-model="quickThumbForm.layout">
                                    <option v-for="l in layouts" :key="l.value" :value="l.value">{{ l.label }}</option>
                                </select>
                                <p class="label text-wrap">{{ $t('quickThumb.selectHowElementsAreArranged') }}</p>
                            </fieldset>
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">{{ $t('quickThumb.shouldItIncludeAnySpecificBackground') }}</legend>
                                <select class="select select-bordered w-full" v-model="quickThumbForm.backgroundType">
                                    <option v-for="b in backgrounds" :key="b.value" :value="b.value">{{ b.label }}</option>
                                </select>
                            </fieldset>
                        </div>

                        <div v-else-if="currentStep === 2" key="step-2" class="flex flex-col gap-3">
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">{{ $t('quickThumb.shouldWeIncludeYourAvatarOrFaceInTheThumbnail') }}</legend>
                                <div class="join w-full bg-base-100">
                                    <input class="join-item btn flex-1 border-base-100" type="radio" name="includeAvatar" :aria-label="$t('common.yes')" :value="true" v-model="quickThumbForm.includeAvatar" />
                                    <input class="join-item btn flex-1 border-base-100" type="radio" name="includeAvatar" :aria-label="$t('common.no')" :value="false" v-model="quickThumbForm.includeAvatar" />
                                </div>
                                <p class="label text-wrap">{{ $t('quickThumb.chooseWhetherToFeatureAnAvatarOrFace') }}</p>
                                <div v-if="quickThumbForm.includeAvatar" class="mt-2">
                                    <BaseAvatarSelector v-model:avatarId="quickThumbForm.avatarId" :avatars="avatars" />
                                </div>
                            </fieldset>

                            <template v-if="quickThumbForm.includeAvatar">
                                <fieldset class="fieldset">
                                    <legend class="fieldset-legend">{{ $t('quickThumb.whatEmotionOrExpressionShouldYourAvatarShow') }}</legend>
                                    <select class="select select-bordered w-full" v-model="quickThumbForm.avatarEmotion">
                                        <option v-for="e in avatarEmotions" :key="e.value" :value="e.value">{{ e.label }}</option>
                                    </select>
                                </fieldset>
                                <fieldset class="fieldset">
                                    <legend class="fieldset-legend">{{ $t('quickThumb.characterPosition') }}</legend>
                                    <div class="grid grid-cols-3 gap-2 card border border-base-200 bg-base-100 p-4">
                                        <button
                                            v-for="p in positions"
                                            :key="p.value"
                                            @click="quickThumbForm.avatarPosition = p.value"
                                            :class="quickThumbForm.avatarPosition === p.value ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'"
                                            class="btn btn-sm"
                                        >
                                            {{ p.icon }}
                                        </button>
                                    </div>
                                </fieldset>
                            </template>
                        </div>

                        <div v-else key="step-3" class="flex flex-col gap-3">
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">{{ $t('quickThumb.doYouWantTheThumbnailToIncludeTextOrHeadline') }}</legend>
                                <div class="join w-full bg-base-100">
                                    <input class="join-item btn flex-1 border-base-100" type="radio" name="includeText" :aria-label="$t('common.yes')" :value="true" v-model="quickThumbForm.includeText" />
                                    <input class="join-item btn flex-1 border-base-100" type="radio" name="includeText" :aria-label="$t('common.no')" :value="false" v-model="quickThumbForm.includeText" />
                                </div>
                                <p class="label text-wrap">{{ $t('quickThumb.toggleWhetherAShortHeadlineShouldBeIncluded') }}</p>
                            </fieldset>
                            <fieldset v-if="quickThumbForm.includeText" class="fieldset">
                                <legend class="fieldset-legend">{{ $t('quickThumb.whatShortTextDoYouWantToAppear') }}</legend>
                                <input type="text" class="input w-full" v-model="quickThumbForm.textHeadline" :placeholder="$t('quickThumb.placeholderShortText')" />
                                <p class="label text-wrap">{{ $t('quickThumb.keepItConciseForBestResults') }}</p>
                            </fieldset>
                            <fieldset v-if="quickThumbForm.includeText" class="fieldset">
                                <legend class="fieldset-legend">{{ $t('quickThumb.textPosition') }}</legend>
                                <div class="grid grid-cols-3 gap-2 card border border-base-200 bg-base-100 p-4">
                                    <button
                                        v-for="p in positions"
                                        :key="p.value"
                                        @click="quickThumbForm.textPosition = p.value"
                                        :class="quickThumbForm.textPosition === p.value ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'"
                                        class="btn btn-sm"
                                    >
                                        {{ p.icon }}
                                    </button>
                                </div>
                            </fieldset>
                        </div>
                    </Transition>
                </div>

                <!-- Navigation -->
                <BaseGenerateButton v-if="currentStep === steps.length - 1" class="w-full" @click="generateThumbs" :isLoading="isLoading" :credits="generationCost" hotkeyEnabled />
                <div class="flex items-end justify-between gap-2 flex-shrink-0">
                    <button class="btn btn-ghost btn-sm" :disabled="currentStep === 0" @click="prevStep">{{ $t('common.back') }}</button>
                    <button v-if="currentStep < steps.length - 1" class="btn btn-primary btn-sm" @click="nextStep">
                        {{ $t('common.next') }}
                    </button>
                </div>
            </div>

            <!-- Right: thumbnails gallery -->
            <div class="card bg-base-200 border border-base-200 p-4 flex flex-col overflow-hidden lg:col-span-8 relative" data-tour="quick-thumbnail-preview">
                <!-- Right side mode switcher -->
                <div class="flex items-center justify-between flex-shrink-0 mb-2">
                    <h2 class="text-lg font-bold">{{ $t('common.workspace') }}</h2>
                    <div class="join bg-base-100">
                        <input class="join-item btn btn-sm" type="radio" name="right-mode" aria-label="Preview" :class="rightMode === 'preview' ? 'btn-primary' : 'btn-ghost opacity-70'" @click="rightMode = 'preview'">
                        <input class="join-item btn btn-sm" type="radio" name="right-mode" aria-label="Thumbnails" :class="rightMode === 'thumbnails' ? 'btn-primary' : 'btn-ghost opacity-70'" @click="rightMode = 'thumbnails'">
                    </div>
                </div>
                <div class="flex items-center gap-2 justify-end" v-if="generatedThumbs.length > 0">
                    <button class="btn btn-primary btn-sm" @click="downloadAllThumbnails">
                        {{ $t('common.download') }}
                    </button>
                    <button class="btn btn-primary btn-sm" @click="openInEditor">
                        {{ $t('common.openInEditor') }}
                    </button>
                </div>

                <!-- Preview -->
                <div v-show="rightMode === 'preview'" class="mt-2">
                    <div class="rounded-[var(--radius-box)] border border-base-200 bg-base-200/40 aspect-video w-full min-h-[240px] flex items-center justify-center relative">
                        <div ref="canvasHost" class="w-full h-full p-4 flex items-center justify-center bg-white">
                            <div v-if="!previewHasContent" class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div class="text-base-content/60 text-sm flex flex-col items-center gap-2">
                                    <Icon name="lucide:mouse-pointer-square-dashed" class="w-5 h-5" />
                                    <span>{{ $t('quickThumb.adjustTheFormToPreviewTheStructure') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Thumbnails and loading steps -->
                <div v-show="rightMode === 'thumbnails'" class="flex-1 overflow-y-auto mt-2">
                    <div class="grid grid-cols-1 gap-4 pr-1 h-full">
                        <div v-for="t in generatedThumbs" :key="t.id" class="relative group h-full max-h-[1200px]">
                            <BaseKiThumbsImage :src="imageStore.getImageSrc(t.id)" :alt="'thumb-' + t.id" containerClass="aspect-video" />
                        </div>
                        <div v-if="!generatedThumbs.length && !isLoading" class="col-span-full h-full rounded-[var(--radius-box)] border border-base-200 bg-base-200/40 flex items-center justify-center text-sm text-base-content/70">
                            {{ $t('quickThumb.answerTheStepsAndClickGenerateToSeeThumbnails') }}
                        </div>
                    </div>
                </div>

                <!-- General thinking overlay -->
                <div v-if="isLoading" class="absolute inset-0 z-20 bg-base-100/70 backdrop-blur-sm flex items-center justify-center">
                    <div class="card bg-base-100 border border-base-200 shadow p-4 max-w-md w-full mx-4">
                        <h3 class="font-semibold mb-2">{{ $t('quickThumb.workingOnYourThumbnail') }}</h3>
                        <div class="space-y-3">
                            <div class="flex items-center gap-3">
                                <span v-if="loadingStep < 1" class="loading loading-spinner loading-sm text-primary"></span>
                                <Icon v-else name="lucide:check" class="w-4 h-4 text-success" />
                                <div>
                                    <p class="font-medium">{{ $t('quickThumb.preparing') }}</p>
                                    <p class="text-xs text-base-content/70">{{ $t('quickThumb.warmingUpMagic') }}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <span v-if="loadingStep < 2" class="loading loading-spinner loading-sm text-primary"></span>
                                <Icon v-else name="lucide:check" class="w-4 h-4 text-success" />
                                <div>
                                    <p class="font-medium">{{ $t('quickThumb.generating') }}</p>
                                    <p class="text-xs text-base-content/70">{{ $t('quickThumb.askingTheModelNicely') }}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <span v-if="loadingStep < 3" class="loading loading-spinner loading-sm text-primary"></span>
                                <Icon v-else name="lucide:check" class="w-4 h-4 text-success" />
                                <div>
                                    <p class="font-medium">{{ $t('quickThumb.finalizing') }}</p>
                                    <p class="text-xs text-base-content/70">{{ $t('quickThumb.polishingResults') }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import type { Image } from '~~/server/database/schemas/image.schema';
import * as fabric from 'fabric';
import { useKiThumbsComposer } from '~/composables/useKiThumbs/composer';

const { t } = useI18n();
const { track } = usePosthog();
const toast = useToast();
const { $generationApi } = useNuxtApp();
const userStore = useUserStore();
const imageStore = useImageStore();

const { data: avatars } = await useFetch('/api/v1/avatar');

const steps = ['Basics', 'Type', 'Avatar', 'Details'];
const currentStep = ref(0);
const isLoading = ref(false);
const rightMode = ref<'preview' | 'thumbnails'>('preview');
const loadingStep = ref(0);
const generationCost = computed(() => {
    const totalThumbnails = 1;
    let baseCostPerThumbnail = 1;
    if (quickThumbForm.value.includeAvatar) {
        baseCostPerThumbnail += 2;
    };
    return baseCostPerThumbnail * totalThumbnails;
});

const generatedThumbs = ref<Image[]>([]);

const THUMB_WIDTH = 1270;
const THUMB_HEIGHT = 720;
const canvasHost = ref<HTMLDivElement | null>(null);
let canvas = shallowRef<fabric.Canvas | null>(null);
const previewHasContent = ref(false);

function initPreviewCanvas() {
    if (!canvasHost.value || canvas.value) return;
    const c = document.createElement('canvas');
    c.setAttribute('aria-label', t('quickThumb.quickThumbsPreview'));
    c.className = 'w-full h-full';
    canvasHost.value.appendChild(c);

    canvas.value = new fabric.Canvas(c, {
        width: THUMB_WIDTH,
        height: THUMB_HEIGHT,
        selection: false,
        enableRetinaScaling: false,
    });
    canvas.value.backgroundColor = '#ffffff';

    canvas.value.on('object:added', () => {
        previewHasContent.value = (canvas.value?.getObjects().length || 0) > 0;
    });
    canvas.value.on('object:removed', () => {
        previewHasContent.value = (canvas.value?.getObjects().length || 0) > 0;
    });

    nextTick(() => fitPreviewCanvas());
}

function fitPreviewCanvas() {
    if (!canvas.value || !canvasHost.value) return;
    const rect = canvasHost.value.getBoundingClientRect();
    const containerWidth = Math.max(1, rect.width);
    const containerHeight = Math.max(1, rect.height);
    const scale = Math.min(containerWidth / THUMB_WIDTH, containerHeight / THUMB_HEIGHT);
    canvas.value.setDimensions({ width: THUMB_WIDTH, height: THUMB_HEIGHT });
    canvas.value.setDimensions({ width: THUMB_WIDTH * scale, height: THUMB_HEIGHT * scale }, { cssOnly: true } as any);
    canvas.value.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.value.requestRenderAll();
}

const emotions = [
    { value: 'happy', label: t('quickThumb.emotions.happy') },
    { value: 'sad', label: t('quickThumb.emotions.sad') },
    { value: 'angry', label: t('quickThumb.emotions.angry') },
    { value: 'surprised', label: t('quickThumb.emotions.surprised') },
    { value: 'confused', label: t('quickThumb.emotions.confused') },
    { value: 'excited', label: t('quickThumb.emotions.excited') },
    { value: 'bored', label: t('quickThumb.emotions.bored') },
];
const types = [
    { value: 'tutorial', label: t('quickThumb.types.tutorial') },
    { value: 'review', label: t('quickThumb.types.review') },
    { value: 'reaction', label: t('quickThumb.types.reaction') },
    { value: 'vlog', label: t('quickThumb.types.vlog') },
    { value: 'comparison', label: t('quickThumb.types.comparison') },
    { value: 'narrative', label: t('quickThumb.types.narrative') },
];
const thumbnailStyles = [
    { value: 'cinematic', label: t('quickThumb.thumbnailStyles.cinematic') },
    { value: 'clean-minimal', label: t('quickThumb.thumbnailStyles.clean-minimal') },
    { value: 'clickbait', label: t('quickThumb.thumbnailStyles.clickbait') },
    { value: 'bold-colorful', label: t('quickThumb.thumbnailStyles.bold-colorful') },
    { value: 'text-heavy', label: t('quickThumb.thumbnailStyles.text-heavy') },
    { value: 'no-text', label: t('quickThumb.thumbnailStyles.no-text') },
];
const layouts = [
    { value: 'centered-face', label: t('quickThumb.layouts.centered-face') },
    { value: 'split-screen', label: t('quickThumb.layouts.split-screen') },
    { value: 'object-focus', label: t('quickThumb.layouts.object-focus') },
    { value: 'background-blur', label: t('quickThumb.layouts.background-blur') },
    { value: 'before-after', label: t('quickThumb.layouts.before-after') },
    { value: 'close-up', label: t('quickThumb.layouts.close-up') },
];
const positions = [
    { value: 'top-left', label: t('quickThumb.positions.top-left'), icon: '◤' },
    { value: 'top-center', label: t('quickThumb.positions.top-center'), icon: '▲' },
    { value: 'top-right', label: t('quickThumb.positions.top-right'), icon: '◥' },
    { value: 'center-left', label: t('quickThumb.positions.center-left'), icon: '◀' },
    { value: 'center', label: t('quickThumb.positions.center'), icon: '●' },
    { value: 'center-right', label: t('quickThumb.positions.center-right'), icon: '▶' },
    { value: 'bottom-left', label: t('quickThumb.positions.bottom-left'), icon: '◣' },
    { value: 'bottom-center', label: t('quickThumb.positions.bottom-center'), icon: '▼' },
    { value: 'bottom-right', label: t('quickThumb.positions.bottom-right'), icon: '◢' },
];
const avatarEmotions = [
    { value: 'surprised', label: t('quickThumb.avatarEmotions.surprised') },
    { value: 'angry', label: t('quickThumb.avatarEmotions.angry') },
    { value: 'confident', label: t('quickThumb.avatarEmotions.confident') },
    { value: 'happy', label: t('quickThumb.avatarEmotions.happy') },
    { value: 'thinking', label: t('quickThumb.avatarEmotions.thinking') },
    { value: 'neutral', label: t('quickThumb.avatarEmotions.neutral') },
];
const backgrounds = [
    { value: 'custom', label: t('quickThumb.backgrounds.custom') },
    { value: 'city', label: t('quickThumb.backgrounds.city') },
    { value: 'room', label: t('quickThumb.backgrounds.room') },
    { value: 'sky', label: t('quickThumb.backgrounds.sky') },
    { value: 'abstract-colors', label: t('quickThumb.backgrounds.abstract-colors') },
    { value: 'blurred-context', label: t('quickThumb.backgrounds.blurred-context') },
];

const quickThumbForm = ref({
    title: '',
    sceneDescription: '',
    emotions: 'happy',
    typeOfVideo: 'tutorial',
    thumbnailStyle: 'cinematic',
    includeText: false,
    textHeadline: '',
    layout: 'centered-face',
    includeAvatar: false,
    avatarId: '',
    avatarEmotion: 'surprised',
    avatarPosition: 'center',
    backgroundType: 'custom',
    textPosition: 'center',
});

function nextStep() { if (currentStep.value < steps.length - 1) currentStep.value += 1; }
function prevStep() { if (currentStep.value > 0) currentStep.value -= 1; }
async function generateThumbs() {
    // Safe checks
    if (quickThumbForm.value.includeAvatar && !quickThumbForm.value.avatarId) {
        toast.show({
            title: t('common.errors.title'),
            message: t('quickThumb.errors.pleaseSelectAnAvatar'),
            status: 'error',
        });
        return;
    }
    if (quickThumbForm.value.includeText && !quickThumbForm.value.textHeadline) {
        toast.show({
            title: t('common.errors.title'),
            message: t('quickThumb.errors.pleaseEnterAHeadline'),
            status: 'error',
        });
        return;
    }

    try {
        isLoading.value = true;
        loadingStep.value = 0;
        rightMode.value = 'thumbnails';

        // Timed three-step loading progression
        setTimeout(() => loadingStep.value = 1, 20000);
        setTimeout(() => loadingStep.value = 2, 50000);

        const canvasDataUrl = canvas.value?.toDataURL({ format: 'png', multiplier: 1 });
        const generatedImages = await $generationApi<Image[]>('/quick-thumb', {
            method: 'POST',
            body: { ...quickThumbForm.value, canvasDataUrl },
            headers: {
                'X-Activity': 'QUICK_THUMB',
                'X-Credits': String(generationCost.value),
            }
        });

        if (!generatedImages || generatedImages.length === 0) {
            console.error('Failed to generate thumbnails');
            throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
        };

        // Finalizing step
        loadingStep.value = 3;

        track('image.quick-thumb.generated', {
            credits: generationCost.value,
            email: userStore.user?.email,
            tier: userStore.tier?.name,
        });

        // Add the generated images to the store
        generatedImages.forEach((image: Image) => {
            imageStore.addImage(image);
        });

        // Set the generated thumbnails
        generatedThumbs.value = generatedImages || [];
        await imageStore.selectImage(generatedImages[0]!.id);
    } catch (error: any) {
        console.error(error);
        toast.show({
            title: t('common.errors.title'),
            message: error.message,
            status: 'error',
        });
    } finally {
        // Small delay to let the user see the last step
        setTimeout(() => {
            isLoading.value = false;
            loadingStep.value = 0;
        }, 600);
    }
};

const downloadAllThumbnails = () => {
    generatedThumbs.value.forEach((image: Image) => {
        const a = document.createElement('a');
        a.href = imageStore.getImageSrc(image.id);
        a.download = image.id + '.png';
        a.click();
    });
};
const openInEditor = async () => {
    const image = generatedThumbs.value[0]!;
    if (!image) return;
    await imageStore.selectImage(image.id);
    await navigateTo(`/images/${image.id}`);
}

useHead({ title: clicklabPageTitle(t('quickThumb.title')) });

const { composeThumbnail } = useKiThumbsComposer();

onMounted(async () => {
    window.addEventListener('resize', fitPreviewCanvas);
    await nextTick(async () => {
        initPreviewCanvas();
        if (canvas.value) {
            await composeThumbnail(canvas.value, quickThumbForm.value)
        };
    });
});

onUnmounted(() => {
    window.removeEventListener('resize', fitPreviewCanvas);
    if (canvas.value) {
        canvas.value.dispose();
        canvas.value = null;
    }
});

watch(quickThumbForm, () => {
    if (!canvas.value) return;
    composeThumbnail(canvas.value, quickThumbForm.value);
}, { deep: true });
</script>

<style scoped>
</style>