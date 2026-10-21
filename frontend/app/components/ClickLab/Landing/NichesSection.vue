<template>
  <section id="niches" ref="sectionRoot" class="relative py-20 sm:py-28">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center" data-reveal>
        <h2 class="clicklab-display text-3xl font-bold text-white sm:text-4xl">Trading niches, one studio</h2>
        <p class="mt-4 text-[var(--cl-text-muted)]">
          Each preset loads terminology, style directions, and sample topics tuned for your market — not generic YouTube templates.
        </p>
      </div>
      <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
        <article
          v-for="niche in TRADING_NICHES"
          :key="niche.id"
          class="clicklab-glass clicklab-glow-border cl-hover-card group flex flex-col rounded-2xl p-5"
        >
          <div
            class="cl-reveal-bar mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r from-[var(--cl-neon)] to-[var(--cl-violet)] opacity-80 transition-all group-hover:w-24"
          />
          <h3 class="clicklab-display text-lg font-bold text-white">{{ niche.shortTitle }}</h3>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-[var(--cl-text-muted)]">{{ niche.description }}</p>
          <div class="mt-4 flex flex-wrap gap-1.5">
            <span
              v-for="term in niche.terminology.slice(0, 4)"
              :key="term"
              class="cl-hover-chip rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--cl-cyan)]"
            >
              {{ term }}
            </span>
          </div>
          <ClickLabLandingCreateThumbnailLink
            :destination="`/studio?niche=${niche.id}`"
            class="clicklab-btn-ghost mt-5 w-full !text-sm"
          >
            Explore {{ niche.shortTitle }}
          </ClickLabLandingCreateThumbnailLink>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { TRADING_NICHES } from '~~/shared/clicklab/niches';

const sectionRoot = ref<HTMLElement | null>(null);
useClickLabSectionReveal(sectionRoot);
</script>
