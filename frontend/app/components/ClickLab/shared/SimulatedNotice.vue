<template>
  <div
    role="note"
    class="flex gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed"
    :class="compact ? 'border-white/10 bg-white/5 text-[var(--cl-text-muted)]' : 'border-amber-400/25 bg-amber-400/5 text-amber-100/90'"
  >
    <Icon name="lucide:info" class="mt-0.5 shrink-0 opacity-80" size="14" aria-hidden="true" />
    <p>
      <span class="font-semibold">{{ label }}:</span>
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    message: string;
    compact?: boolean;
  }>(),
  {
    label: 'Simulated',
    compact: false,
  },
);
</script>
