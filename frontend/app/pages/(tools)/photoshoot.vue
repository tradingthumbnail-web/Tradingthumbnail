<template>
    <div class="flex flex-col gap-6 h-full" data-tour="photoshoot-page">
        <div class="flex flex-col gap-1 flex-shrink-0">
            <h1 class="text-2xl font-semibold text-base-content">{{ $t('photoshoot.title') }}</h1>
            <p class="text-sm text-base-content/70">{{ $t('photoshoot.description') }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
            <!-- Left config panel -->
            <div class="card bg-base-200 border border-base-200 transition p-4 lg:col-span-4 flex flex-col overflow-hidden" data-tour="photoshoot-config">
                <div class="flex flex-col gap-6 flex-1 overflow-y-auto p-2">
                    <!-- Avatar selection -->
                    <div class="form-control flex flex-col gap-2">
                        <BaseAvatarSelector :avatars="avatars" :avatarId="form.avatarId" @update:avatarId="form.avatarId = $event" />
                        <p v-if="!avatars?.length" class="text-xs text-base-content/60">{{ $t('avatars.empty.description') }}</p>
                    </div>

                    <!-- Description -->
                    <div class="form-control flex flex-col gap-2">
                        <label class="label">
                            <span class="label-text text-sm font-medium">{{ $t('photoshoot.describeCharacter') }}</span>
                        </label>
                        <textarea class="textarea textarea-bordered bg-base-100 h-24 w-full" v-model="form.description" :placeholder="$t('photoshoot.describeCharacterPlaceholder')"></textarea>
                    </div>

                    <!-- Expression -->
                    <div class="form-control flex flex-col gap-2">
                        <label class="label">
                            <span class="label-text text-sm font-medium">{{ $t('photoshoot.expression') }}</span>
                        </label>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
                            <button v-for="opt in expressions" :key="opt" type="button"
                                class="btn btn-sm join-item"
                                :class="form.expression === opt ? 'btn-primary' : 'btn-ghost border border-base-100 bg-base-100'"
                                @click="form.expression = opt">{{ opt }}</button>
                        </div>
                    </div>

                    <!-- Camera angle -->
                    <div class="form-control flex flex-col gap-2">
                        <label class="label">
                            <span class="label-text text-sm font-medium">{{ $t('photoshoot.cameraAngle') }}</span>
                        </label>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                            <button v-for="opt in cameraAngles" :key="opt" type="button"
                                class="btn btn-sm"
                                :class="form.cameraAngle === opt ? 'btn-primary' : 'btn-ghost border border-base-100 bg-base-100'"
                                @click="form.cameraAngle = opt">{{ opt }}</button>
                        </div>
                    </div>

                    <!-- Background -->
                    <div class="form-control flex flex-col gap-2">
                        <label class="label">
                            <span class="label-text text-sm font-medium">{{ $t('photoshoot.background') }}</span>
                        </label>
                        <div class="grid md:grid-cols-2 grid-cols-1 items-center gap-2 p-2">
                            <button v-for="bg in backgrounds" :key="bg.value" type="button"
                                class="btn btn-sm"
                                :class="form.background === bg.value ? 'btn-primary' : 'btn-ghost border border-base-100 bg-base-100'"
                                @click="form.background = bg.value">
                                <span class="w-3 h-3 rounded-full mr-2 border border-base-300" :style="{ background: bg.preview }"></span>
                                {{ bg.label }}
                            </button>
                        </div>
                    </div>

                    <!-- Variations -->
                    <div class="form-control flex flex-col gap-2">
                        <label class="label">
                            <span class="label-text text-sm font-medium">{{ $t('photoshoot.numberOfVariations') }}</span>
                        </label>
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-2 p-2">
                            <button v-for="n in [1,2,3,4]" :key="n" type="button"
                                class="btn btn-sm join-item"
                                :class="form.variations === n ? 'btn-primary' : 'btn-ghost border border-base-100 bg-base-100'"
                                @click="form.variations = n">{{ n }}</button>
                        </div>
                    </div>

                    <!-- Reference image upload -->
                    <div class="form-control flex flex-col gap-2 pb-6">
                        <label class="label">
                            <span class="label-text text-sm font-medium">{{ $t('photoshoot.referenceImage') }}</span>
                        </label>
                        <input type="file" accept="image/*" class="file-input file-input-bordered file-input-sm w-full bg-base-100" @change="onFile" />
                        <div v-if="referencePreview" class="mt-2 text-xs text-base-content/70 flex items-center gap-2">
                            <img :src="referencePreview" alt="preview" class="h-10 w-10 rounded object-cover" />
                            <span>{{ $t('common.preview') }}</span>
                        </div>
                    </div>
                </div>

                <BaseGenerateButton :isLoading="isGenerating" :credits="generationCost" @click="onGenerate" hotkeyEnabled :disabled="!form.avatarId" />
            </div>

            <!-- Right gallery -->
            <div class="card bg-base-200 border border-base-200 transition p-4 lg:col-span-8 flex flex-col overflow-hidden" data-tour="photoshoot-gallery">
                <div class="card-header mb-2 flex items-center justify-between flex-shrink-0">
                    <h2 class="text-lg font-bold">{{ $t('photoshoot.generatedImages') }}</h2>
                    <div class="flex items-center gap-2">
                        <div class="text-xs text-base-content/60">{{ characterImages.length }} {{ $t('common.images') }}</div>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto">
                    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pr-1">
                    <div v-for="img in characterImages" :key="img.id" class="relative group">
                        <NuxtLink :to="`/images/${img.id}`">
                            <BaseKiThumbsImage :src="`/api/v1/image/${img.id}/view`" :alt="'image-'+img.id" containerClass="aspect-square" />
                            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-base-300/50"></div>
                        </NuxtLink>
                        <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button class="btn btn-ghost btn-xs btn-circle" :class="img.favorited ? 'text-primary' : ''" @click="imageStore.toggleFavorite(img.id);">
                                <Icon name="lucide:heart" class="w-4 h-4" />
                            </button>
                            <button class="btn btn-ghost btn-xs btn-circle" @click="download(img)">
                                <Icon name="lucide:download" class="w-4 h-4" />
                            </button>
                            <button class="btn btn-ghost btn-xs btn-circle" @click="openDeleteModal(img)">
                                <Icon name="lucide:trash" class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                        <div v-if="characterImages.length === 0" class="col-span-full h-48 rounded-[var(--radius-box)] border border-base-200 bg-base-200/40 flex items-center justify-center text-sm text-base-content/70">
                            {{ $t('photoshoot.noImages') }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Delete single modal (UI only) -->
    <dialog ref="deleteModalRef" class="modal" @cancel.prevent @submit.prevent="confirmDelete">
        <div class="modal-box">
            <h3 class="font-medium text-base-content">{{ $t('archive.deleteImage') }}</h3>
            <p class="py-2 text-sm text-base-content/70">{{ $t('archive.deleteImageConfirm') }}</p>
            <div class="modal-action">
                <form method="dialog" class="flex items-center gap-2">
                    <button class="btn btn-outline btn-sm border border-base-content/40" @click="closeDeleteModal">{{ $t('common.cancel') }}</button>
                    <button class="btn btn-error btn-sm" type="submit">{{ $t('common.delete') }}</button>
                </form>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button @click="closeDeleteModal">{{ $t('common.close') }}</button>
        </form>
    </dialog>
    

</template>

<script setup lang="ts">
import { type Image } from "~~/server/database/schemas/image.schema";
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';

const { $generationApi } = useNuxtApp();

const { t } = useI18n();
const toast = useToast();
const imageStore = useImageStore();
const userStore = useUserStore();
const { track } = usePosthog()
const isGenerating = ref(false);
const route = useRoute();

const { data: avatars, pending, error, refresh: refreshAvatars } = await useFetch('/api/v1/avatar');

const expressions = [
    t('photoshoot.expressions.neutral'),
    t('photoshoot.expressions.happy'),
    t('photoshoot.expressions.serious'),
    t('photoshoot.expressions.sad'),
    t('photoshoot.expressions.confident'),
    t('photoshoot.expressions.surprised'),
];
const cameraAngles = [
    t('photoshoot.cameraAngles.frontal'),
    t('photoshoot.cameraAngles.profile'),
    t('photoshoot.cameraAngles.threeQuarters'),
    t('photoshoot.cameraAngles.lowAngle'),
];
const backgrounds = [
    { label: t('photoshoot.backgrounds.none'), value: 'none', preview: 'transparent' },
    { label: t('photoshoot.backgrounds.white'), value: 'white', preview: '#ffffff' },
    { label: t('photoshoot.backgrounds.black'), value: 'black', preview: '#000000' },
    { label: t('photoshoot.backgrounds.chroma'), value: 'chroma', preview: '#00ff57' },
];
const characterImages = computed(() => imageStore.images.filter((img: Image) => img.type === 'CHARACTER'));

const form = ref({
    avatarId: '',
    description: '',
    expression: t('photoshoot.expressions.neutral'),
    cameraAngle: t('photoshoot.cameraAngles.frontal'),
    background: 'none',
    variations: 1,
    reference: null as File | null,
});
const generationCost = computed(() => {
    return form.value.variations * 1;
});

const referencePreview = ref<string | null>(null);

function onFile(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files && target.files[0] ? target.files[0] : null;
    form.value.reference = file;
    if (file) {
        const url = URL.createObjectURL(file);
        referencePreview.value = url;
    } else {
        referencePreview.value = null;
    }
}

async function onGenerate() {
    if (!form.value.avatarId) return;
    try {
        isGenerating.value = true;
        const generatedImages = await $generationApi<Image[]>('/photoshoot', {
            headers: {
                'X-Activity': 'GENERATE_CHARACTER_IMAGE',
                'X-Credits': String(generationCost.value),
            },
            method: 'POST',
            body: form.value,
        });
        track('image.characters.generated', {
            credits: generationCost.value,
            email: userStore.user?.email,
            tier: userStore.tier?.name,
        });

        generatedImages.forEach((image: Image) => {
            imageStore.addImage(image);
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

async function remove(id: string) {
    try {
        await imageStore.deleteImage(id);
    } catch (error: any) {
        console.error(error);
        toast.show({
            title: t('common.errors.title'),
            message: error.message,
            status: 'error',
        });
    }
}

function download(img: { id: string; src: string }) {
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `image-${img.id}.jpg`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
}

const deleteModalRef = ref<HTMLDialogElement | null>(null);
const deleteCandidate = ref<Image | null>(null);

function openDeleteModal(item: Image) {
    deleteCandidate.value = item;
    deleteModalRef.value?.showModal();
}

function closeDeleteModal() {
    deleteCandidate.value = null;
    if (deleteModalRef.value?.open) deleteModalRef.value?.close();
}

async function confirmDelete() {
    if (!deleteCandidate.value) return;
    await remove(deleteCandidate.value.id);
    closeDeleteModal();
}

onMounted(async () => {
    if (!imageStore.hasInitialized) {
        await imageStore.getImages();
    };

    if (route.query.avatarId) {
        form.value.avatarId = route.query.avatarId as string;
    }
});

useHead({ title: clicklabPageTitle('Photoshoot') });
</script>

<style scoped>

</style>