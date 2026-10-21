<template>
  <article
    class="clicklab-glow-border cl-hover-card relative overflow-hidden rounded-xl"
    :class="[aspectClass, selectable && selected ? 'ring-2 ring-[var(--cl-neon)]' : '']"
    :style="{ background: variant.palette[0] }"
    @click="selectable && $emit('select')"
  >
    <div
      class="absolute inset-0 opacity-80"
      :style="{
        background: `linear-gradient(135deg, ${variant.palette[1]}33 0%, transparent 45%, ${variant.palette[2]}44 100%)`,
      }"
    />
    <div class="clicklab-grid-bg absolute inset-0 opacity-40" />
    <svg v-if="variant.layout !== 'hero-face'" class="absolute bottom-0 left-0 right-0 h-1/2 w-full opacity-70" viewBox="0 0 320 120" preserveAspectRatio="none">
      <polyline
        fill="none"
        :stroke="variant.palette[1]"
        stroke-width="2"
        points="0,90 40,70 80,75 120,40 160,55 200,20 240,35 280,15 320,30"
        pathLength="200"
        class="cl-chart-line"
        style="stroke-dasharray: 200"
      />
    </svg>
    <div v-if="variant.layout === 'hero-face'" class="absolute bottom-0 right-0 h-3/5 w-2/5 rounded-tl-[2rem] bg-gradient-to-tl from-black/60 to-transparent">
      <div
        class="absolute bottom-2 right-2 h-16 w-16 rounded-full border-2 border-[var(--cl-neon)]/50 bg-gradient-to-br from-zinc-700 to-zinc-900 shadow-[0_0_20px_rgba(57,255,136,0.25)]"
      />
    </div>
    <div class="relative flex h-full flex-col justify-end p-3 sm:p-4">
      <p class="clicklab-display text-[10px] font-semibold uppercase tracking-widest text-white/50">{{ variant.subtitle }}</p>
      <h3
        class="clicklab-display mt-1 line-clamp-2 text-sm font-bold leading-tight sm:text-base"
        :style="{ color: variant.palette[1] }"
      >
        {{ variant.title }}
      </h3>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { DemoThumbnailVariant } from '~~/shared/clicklab/demo-data';

const props = withDefaults(
  defineProps<{
    variant: DemoThumbnailVariant;
    aspect?: 'video' | 'square' | 'portrait';
    selectable?: boolean;
    selected?: boolean;
  }>(),
  { aspect: 'video', selectable: false, selected: false },
);

defineEmits<{ select: [] }>();

const aspectClass = computed(() => {
  if (props.aspect === 'square') return 'aspect-square';
  if (props.aspect === 'portrait') return 'aspect-[9/16]';
  return 'aspect-video';
});
</script>
