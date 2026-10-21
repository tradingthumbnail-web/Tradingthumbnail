<template>
  <NuxtLink :to="to" class="group inline-flex items-center gap-2.5" :aria-label="`${CLICKLAB_PRODUCT_NAME} home`">
    <img
      src="~/assets/img/clicklab-mark.svg"
      :alt="`${CLICKLAB_PRODUCT_NAME} logo`"
      class="h-9 w-9 transition-transform duration-300 group-hover:scale-105"
      :draggable="false"
    />
    <span class="clicklab-display text-xl font-bold tracking-tight">
      <span class="text-[var(--cl-neon)]">Click</span><span class="text-white">Lab</span>
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { CLICKLAB_PRODUCT_NAME } from '~~/shared/clicklab/brand';

withDefaults(
  defineProps<{ to?: string }>(),
  { to: '/' },
);
</script>
