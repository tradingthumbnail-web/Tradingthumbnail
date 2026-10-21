<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-250 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" :class="[
        'fixed inset-0 z-50',
        props.size === 'full' ? 'flex items-stretch' : 'flex items-center justify-center p-4 sm:p-6'
      ]">
        <div class="absolute inset-0 bg-base-300/80 backdrop-blur-md" @click="onBackdropClick" id="modal-backdrop" />

        <Transition
          :enter-active-class="props.size === 'full' ? 'transition-all duration-300 ease-out' : 'transition-all duration-250 ease-out'"
          :enter-from-class="props.size === 'full' ? 'opacity-0 translate-y-8' : 'opacity-0 scale-95 translate-y-4'"
          :enter-to-class="props.size === 'full' ? 'opacity-100 translate-y-0' : 'opacity-100 scale-100 translate-y-0'"
          :leave-active-class="props.size === 'full' ? 'transition-all duration-200 ease-in' : 'transition-all duration-150 ease-in'"
          :leave-from-class="props.size === 'full' ? 'opacity-100 translate-y-0' : 'opacity-100 scale-100 translate-y-0'"
          :leave-to-class="props.size === 'full' ? 'opacity-0 translate-y-8' : 'opacity-0 scale-95 translate-y-4'"
        >
          <div v-if="modelValue" :class="containerClasses" role="dialog" aria-modal="true">
            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
  containerClass?: string;
}>(), {
  size: 'md',
  closeOnBackdrop: true,
  containerClass: ''
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'close': [];
}>();

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'max-w-md';
    case 'md': return 'max-w-2xl';
    case 'lg': return 'max-w-4xl';
    case 'xl': return 'max-w-6xl';
    case 'full': return 'w-full h-full lg:w-[92vw] lg:h-[92vh]';
    default: return 'max-w-2xl';
  }
});

const containerClasses = computed(() => [
  'relative w-full',
  props.size === 'full' ? 'h-full lg:h-[92vh] lg:rounded-2xl' : '',
  sizeClass.value,
  props.size === 'full' 
    ? 'bg-base-100/98 backdrop-blur-xl border-0 lg:border border-base-100/20 shadow-2xl overflow-hidden'
    : 'rounded-2xl bg-base-100/98 backdrop-blur-xl border border-base-100/20 shadow-2xl overflow-hidden'
].filter(Boolean).join(' '));

function onBackdropClick() {
  if (!props.closeOnBackdrop) return;
  emit('update:modelValue', false);
  emit('close');
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    emit('update:modelValue', false);
    emit('close');
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
</style>


