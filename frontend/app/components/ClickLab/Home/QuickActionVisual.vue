<template>
  <div class="absolute inset-0 overflow-hidden bg-[#080b0e]" aria-hidden="true">
    <div class="clicklab-grid-bg absolute inset-0 opacity-30" />
    <div
      class="absolute inset-0"
      :style="{ background: `linear-gradient(160deg, ${palette[0]}22 0%, transparent 55%, ${palette[1]}15 100%)` }"
    />

    <!-- Thumbnail / chart -->
    <svg v-if="variant === 'thumbnail'" class="absolute bottom-0 left-0 right-0 h-2/3 w-full" viewBox="0 0 200 100" preserveAspectRatio="none">
      <polyline fill="none" stroke="#39ff88" stroke-width="2" points="0,75 35,60 60,65 90,40 120,50 150,25 200,35" />
      <rect x="12" y="12" width="56" height="8" rx="2" fill="#39ff88" fill-opacity="0.35" />
    </svg>

    <!-- Sketch -->
    <svg v-else-if="variant === 'sketch'" class="absolute inset-4" viewBox="0 0 120 80">
      <rect x="8" y="8" width="104" height="64" rx="4" fill="none" stroke="white" stroke-opacity="0.15" />
      <path d="M20 55 Q40 30 60 45 T100 35" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-dasharray="4 3" />
      <circle cx="95" cy="22" r="6" fill="#39ff88" fill-opacity="0.4" />
    </svg>

    <!-- Image to image -->
    <div v-else-if="variant === 'img2img'" class="absolute inset-3 flex gap-1.5">
      <div class="flex-1 rounded-md border border-white/10 bg-white/5" />
      <div class="flex w-6 items-center justify-center text-[var(--cl-neon)]">
        <Icon name="lucide:arrow-right" size="14" />
      </div>
      <div class="flex-1 rounded-md border border-[var(--cl-neon)]/30 bg-[var(--cl-neon)]/10" />
    </div>

    <!-- Photoshoot -->
    <svg v-else class="absolute bottom-4 left-1/2 -translate-x-1/2" width="72" height="48" viewBox="0 0 72 48">
      <rect x="8" y="12" width="56" height="28" rx="4" fill="none" stroke="white" stroke-opacity="0.2" />
      <circle cx="36" cy="26" r="10" fill="none" stroke="#22d3ee" stroke-opacity="0.55" />
      <circle cx="52" cy="16" r="4" fill="#8b5cf6" fill-opacity="0.5" />
    </svg>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  variant: 'thumbnail' | 'sketch' | 'img2img' | 'photoshoot';
}>();

const palette = computed(() => {
  switch (props.variant) {
    case 'sketch':
      return ['#8b5cf6', '#39ff88'];
    case 'img2img':
      return ['#22d3ee', '#39ff88'];
    case 'photoshoot':
      return ['#22d3ee', '#8b5cf6'];
    default:
      return ['#39ff88', '#8b5cf6'];
  }
});
</script>
