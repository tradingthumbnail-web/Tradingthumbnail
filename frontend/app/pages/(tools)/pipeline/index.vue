<template>
    <div class="flex flex-col gap-6 h-full" data-tour="pipeline-page">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-tour="pipeline-header">
            <div class="flex flex-col gap-1">
                <h1 class="text-2xl font-semibold text-base-content">{{ $t('pipeline.title') }}</h1>
                <p class="text-sm text-base-content/70">{{ $t('pipeline.description') }}</p>
            </div>
            <NuxtLink to="/pipeline/create" data-tour="pipeline-create" class="btn btn-primary gap-2">
                <Icon name="lucide:plus" class="w-4 h-4" />
                {{ $t('pipeline.create') }}
            </NuxtLink>
        </div>

        <div v-if="pipelineStore.loading" class="flex-1 flex items-center justify-center">
            <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>

        <div v-else-if="pipelineStore.pipelines.length === 0" class="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div class="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center">
                <Icon name="lucide:workflow" class="text-base-content/40" size="42" />
            </div>
            <div class="flex flex-col gap-2">
                <h3 class="text-lg font-medium text-base-content">{{ $t('pipeline.noPipelines') }}</h3>
                <p class="text-sm text-base-content/60 max-w-md">{{ $t('pipeline.noPipelinesDescription') }}</p>
            </div>
            <NuxtLink to="/pipeline/create" class="btn btn-primary gap-2">
                <Icon name="lucide:plus" class="w-4 h-4" />
                {{ $t('pipeline.createFirst') }}
            </NuxtLink>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="pipeline-cards">
            <PipelineCard 
                v-for="pipeline in pipelineStore.pipelines" 
                :key="pipeline.id"
                :pipeline="pipeline"
                @run="openRunModal"
                @edit="editPipeline"
                @delete="confirmDeletePipeline"
            />
        </div>

        <PipelineRunModal 
            v-model="isRunModalOpen"
            :pipeline="selectedPipeline"
            @generated="onImageGenerated"
        />

        <BaseModal v-model="isDeleteModalOpen" size="sm">
            <div class="p-6 flex flex-col gap-4">
                <h3 class="text-lg font-semibold">{{ $t('pipeline.deleteConfirmTitle') }}</h3>
                <p class="text-sm text-base-content/70">{{ $t('pipeline.deleteConfirmMessage') }}</p>
                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" class="btn btn-ghost" @click="isDeleteModalOpen = false">
                        {{ $t('common.cancel') }}
                    </button>
                    <button type="button" class="btn btn-error" @click="deletePipeline" :disabled="isDeleting">
                        <span v-if="isDeleting" class="loading loading-spinner loading-sm"></span>
                        {{ $t('common.delete') }}
                    </button>
                </div>
            </div>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import type { Pipeline } from '~~/server/database/schemas/pipeline.schema';
import type { Image } from '~~/server/database/schemas/image.schema';
import { useDriver } from '~/composables/useDriver';

const { t } = useI18n();
const toast = useToast();
const router = useRouter();
const pipelineStore = usePipelineStore();
const imageStore = useImageStore();
const driver = useDriver();

const isRunModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const selectedPipeline = ref<Pipeline | null>(null);
const pipelineToDelete = ref<Pipeline | null>(null);

onMounted(async () => {
    if (!pipelineStore.hasInitialized) {
        await pipelineStore.fetchPipelines();
    }
    await driver.startTour('/pipeline');
});

function openRunModal(pipeline: Pipeline) {
    selectedPipeline.value = pipeline;
    isRunModalOpen.value = true;
}

function editPipeline(pipeline: Pipeline) {
    router.push(`/pipeline/${pipeline.id}/edit`);
}

function confirmDeletePipeline(pipeline: Pipeline) {
    pipelineToDelete.value = pipeline;
    isDeleteModalOpen.value = true;
}

async function deletePipeline() {
    if (!pipelineToDelete.value) return;
    
    isDeleting.value = true;
    try {
        await pipelineStore.deletePipeline(pipelineToDelete.value.id);
        toast.show({
            title: t('common.success.title'),
            message: t('pipeline.deleteSuccess'),
            status: 'success',
        });
    } catch (error: any) {
        toast.show({
            title: t('common.errors.title'),
            message: error.message,
            status: 'error',
        });
    } finally {
        isDeleting.value = false;
        isDeleteModalOpen.value = false;
        pipelineToDelete.value = null;
    }
}

function onImageGenerated(image: Image) {
    imageStore.addImage(image);
    imageStore.selectedImage = image;
    router.push(`/images/${image.id}`);
}

useHead({ title: clicklabPageTitle(t('pipeline.title')) });
</script>