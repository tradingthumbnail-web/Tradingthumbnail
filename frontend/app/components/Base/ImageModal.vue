<template>
  <Teleport to="body">
    <div v-if="modalStore.isOpen && modalStore.imageId" class="fixed inset-0 z-50 flex items-center justify-center">
      <div
        class="absolute inset-0 bg-base-300/70 backdrop-blur-sm"
        @click="handleClose"
      />
      <div
        class="relative w-[92vw] h-[92vh] rounded-[var(--radius-box)] bg-base-100/95 border border-base-300/60 shadow-xl overflow-hidden flex flex-col"
        @click.stop
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-base-300/60 bg-base-100/80 backdrop-blur flex-shrink-0">
          <h2 class="text-sm font-medium tracking-wide text-base-content/80">{{ $t('imageModal.title') }}</h2>
          <div class="flex items-center gap-2">
            <button
              class="btn btn-sm btn-ghost border border-base-300/60"
              @click="handleClose"
              aria-label="Close modal"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
              {{ $t('common.close') }}
            </button>
          </div>
        </div>

        <div class="flex-1 flex items-center justify-center p-0 overflow-hidden bg-base-200">
          <KiThumbsEditor :key="modalStore.imageId" :imageId="modalStore.imageId" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const modalStore = useModalStore();
const router = useRouter();

const handleClose = () => {
  const backRoute = modalStore.backgroundRoute || '/';
  modalStore.closeModal();
  router.push(backRoute);
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && modalStore.isOpen) {
    handleClose();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>