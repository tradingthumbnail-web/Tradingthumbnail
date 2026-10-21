<template>
    <div v-if="!modalStore.isOpen" class="w-full h-full">
        <KiThumbsEditor :imageId="imageId" />
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
const route = useRoute();
const modalStore = useModalStore();
const imageStore = useImageStore();

const imageId = computed(() => route.params.imageId as string);

onMounted(async () => {
    if (!imageStore.hasInitialized) {
        await imageStore.initialize(30);
    };
    await imageStore.selectImage(imageId.value);
});

watch(imageId, async (newId, oldId) => {
    if (!newId || newId === oldId) return;
    await imageStore.selectImage(newId);
});

useHead({ title: computed(() => clicklabPageTitle(`Image ${imageId.value}`)) });
</script>

<style scoped>
</style>