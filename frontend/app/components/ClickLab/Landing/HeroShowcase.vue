<template>
  <div ref="showcaseRoot" class="clicklab-hero-showcase relative">
    <div
      v-for="(chip, i) in floatingChips"
      :key="chip.label"
      class="clicklab-hero-chip pointer-events-none absolute z-30 hidden sm:flex"
      aria-hidden="true"
      title="Decorative demo indicator"
      :class="chip.class"
      :style="{ '--chip-i': i }"
    >
      <span class="clicklab-hero-chip__dot" :class="chip.dotClass" aria-hidden="true" />
      <span>{{ chip.label }}</span>
      <span v-if="chip.suffix" class="text-[var(--cl-neon)]">{{ chip.suffix }}</span>
    </div>

    <div class="clicklab-hero-preview-frame clicklab-glow-border relative rounded-2xl p-[1px]">
      <div class="clicklab-hero-preview-inner rounded-[calc(1rem-1px)] p-4 sm:p-5">
        <div class="mb-3 flex items-center justify-between gap-2">
          <span class="text-xs font-medium uppercase tracking-wider text-[var(--cl-text-muted)]">ClickLab concepts</span>
          <span class="rounded border border-white/10 bg-[var(--cl-bg-elevated)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--cl-text-muted)]">
            Demo artwork
          </span>
        </div>
        <div class="grid grid-cols-2 gap-2.5 sm:gap-3">
          <ClickLabLandingHeroShowcaseCard
            v-for="(item, index) in HERO_SHOWCASE_CONCEPTS"
            :key="item.id"
            :concept="item"
            :index="index"
          />
        </div>
        <p class="mt-3 text-[11px] leading-relaxed text-[var(--cl-text-muted)]">
          Original CSS/SVG compositions for marketing preview — not AI output or saved projects.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HERO_SHOWCASE_CONCEPTS } from '~~/shared/clicklab/hero-showcase';

const showcaseRoot = ref<HTMLElement | null>(null);
useClickLabReveal(showcaseRoot, { once: false });

const floatingChips = [
  { label: 'CTR', suffix: '+12%', class: '-left-2 top-8 lg:-left-10', dotClass: 'bg-[var(--cl-neon)]' },
  { label: 'Market momentum', suffix: '', class: '-right-1 top-2 lg:-right-8', dotClass: 'bg-[var(--cl-violet)]' },
  { label: 'AI layout', suffix: '', class: '-left-1 bottom-16 lg:-left-6', dotClass: 'bg-[var(--cl-cyan)]' },
  { label: '16:9 preview', suffix: '', class: 'right-0 bottom-6 lg:-right-4', dotClass: 'bg-white/50' },
];
</script>
