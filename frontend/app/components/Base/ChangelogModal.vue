<template>
    <dialog ref="dialogRef" class="modal" @close="handleClose">
        <div class="modal-box max-w-2xl">
            <div class="flex flex-col gap-6">
                <div class="space-y-2">
                    <h2 class="text-2xl font-semibold text-base-content">{{ changelog.title }}</h2>
                    <p class="text-sm text-base-content/60">{{ $t('common.version') }} {{ changelog.version }}</p>
                </div>

                <div class="space-y-3 max-h-96 overflow-y-auto">
                    <div v-for="(feature, index) in changelog.features" :key="index" class="flex items-start gap-3 pb-2">
                        <Icon name="lucide:check-circle" class="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        <p class="text-sm text-base-content">{{ feature }}</p>
                    </div>
                </div>

                <div class="modal-action">
                    <form method="dialog" class="flex items-center gap-6">
                        <button type="button" class="btn btn-accent" @click="navigateToChangelog">
                            {{ $t('common.changelog.viewAllChangelogs') }}
                        </button>
                        <button class="btn btn-primary">
                            {{ $t('common.close') }}
                        </button>
                    </form>
                </div>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>
</template>

<script setup lang="ts">
const { getLatestChangelog, markAsViewed } = useChangelog();

const dialogRef = ref<HTMLDialogElement | null>(null);
const changelog = computed(() => getLatestChangelog());

const handleClose = () => {
    markAsViewed();
};

const navigateToChangelog = () => {
    dialogRef.value?.close();
    navigateTo('/changelog');
};

defineExpose({
    showModal: () => dialogRef.value?.showModal(),
    close: () => dialogRef.value?.close(),
});
</script>