<template>
  <div ref="rootRef" class="relative z-20" v-bind="$attrs">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded-lg border border-white/15 bg-[#0a0f12] px-3 py-2.5 text-left text-sm text-white shadow-inner transition-colors hover:border-[var(--cl-neon)]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cl-neon)]"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="open = !open"
    >
      <span class="truncate">{{ selectedLabel }}</span>
      <Icon
        name="lucide:chevron-down"
        size="18"
        class="shrink-0 text-[var(--cl-text-muted)] transition-transform"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <ul
        v-if="open"
        role="listbox"
        class="absolute left-0 right-0 z-[200] mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/20 bg-[#0a0f12] py-1 shadow-[0_16px_40px_rgba(0,0,0,0.65)] ring-1 ring-[var(--cl-neon)]/10"
      >
        <li
          v-for="opt in options"
          :key="String(opt.value)"
          role="option"
          :aria-selected="isSelected(opt.value)"
          class="cursor-pointer px-3 py-2.5 text-sm transition-colors"
          :class="isSelected(opt.value)
            ? 'bg-[var(--cl-neon)]/15 text-[var(--cl-neon)]'
            : 'text-[var(--cl-text)] hover:bg-white/10'"
          @click="choose(opt.value)"
        >
          <span class="flex items-center gap-2">
            <Icon v-if="isSelected(opt.value)" name="lucide:check" size="16" class="shrink-0" />
            <span :class="isSelected(opt.value) ? '' : 'pl-6'">{{ opt.label }}</span>
          </span>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

export interface StudioSelectOption {
  value: string | number | null;
  label: string;
}

const props = defineProps<{
  modelValue: string | number | null;
  options: StudioSelectOption[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null];
}>();

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);

const selectedLabel = computed(() => {
  const match = props.options.find((o) => o.value === props.modelValue);
  return match?.label ?? props.placeholder ?? 'Select…';
});

function isSelected(value: string | number | null) {
  return props.modelValue === value;
}

function choose(value: string | number | null) {
  emit('update:modelValue', value);
  open.value = false;
}

function onDocumentClick(e: MouseEvent) {
  if (!open.value || !rootRef.value) return;
  if (!rootRef.value.contains(e.target as Node)) {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
});
</script>
