<template>
  <section id="gallery" ref="sectionRoot" class="border-t border-white/5 bg-[var(--cl-bg)]/40 py-20 sm:py-28">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end" data-reveal>
        <div>
          <h2 class="clicklab-display text-3xl font-bold text-white sm:text-4xl">Sample trading concepts</h2>
          <p class="mt-2 max-w-xl text-[var(--cl-text-muted)]">CSS-crafted preview cards — no remote image dependencies at runtime.</p>
        </div>
        <NuxtLink to="/studio" class="clicklab-btn-ghost !text-sm">Open studio</NuxtLink>
      </div>
      <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
        <ClickLabSharedSampleThumbnailCard
          v-for="item in LANDING_GALLERY_ITEMS"
          :key="item.id"
          :variant="item"
          class="shadow-xl"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { LANDING_GALLERY_ITEMS } from '~~/shared/clicklab/demo-data';

const sectionRoot = ref<HTMLElement | null>(null);
useClickLabSectionReveal(sectionRoot);
</script>
