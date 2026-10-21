<template>
  <section
    ref="heroSection"
    class="clicklab-hero-section relative overflow-x-hidden pt-24 pb-20 sm:pt-28 sm:pb-28 lg:pb-32"
  >
    <ClickLabLandingTradingBackground :glow-live="glowActive" />
    <div class="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14 lg:px-8">
      <div class="max-w-[36rem]">
        <p
          class="clicklab-hero-eyebrow mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[var(--cl-bg-elevated)]/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--cl-neon)]"
          style="--line-i: 0"
        >
          <Icon name="lucide:line-chart" size="14" />
          Trading thumbnail studio
        </p>

        <h1 class="clicklab-hero-title text-white">
          <span class="clicklab-hero-line" style="--line-i: 1">Make Your Next</span>
          <span class="clicklab-hero-line" style="--line-i: 2">Trading Video</span>
          <span class="clicklab-hero-line clicklab-hero-line--accent" style="--line-i: 3">
            <span class="clicklab-hero-accent">Impossible to Ignore.</span>
            <span class="clicklab-hero-accent-underline" aria-hidden="true" />
          </span>
        </h1>

        <p class="clicklab-hero-lead clicklab-hero-line mt-6" style="--line-i: 4">
          Niche-aware layouts for forex, crypto, prop firms, and options creators — built for click-through, not generic YouTube templates.
        </p>

        <div class="clicklab-hero-line mt-9 flex flex-wrap items-center gap-3" style="--line-i: 5">
          <ClickLabLandingCreateThumbnailLink class="clicklab-btn-primary clicklab-btn-primary--premium">
            Create Your Thumbnail
            <Icon name="lucide:arrow-right" size="18" />
          </ClickLabLandingCreateThumbnailLink>
          <NuxtLink to="/studio" class="clicklab-btn-secondary clicklab-btn-secondary--premium">
            Explore the Studio
          </NuxtLink>
        </div>
      </div>

      <div class="relative w-full lg:max-w-xl lg:justify-self-end">
        <ClickLabLandingHeroShowcase />
      </div>
    </div>

    <a
      href="#niches"
      class="clicklab-hero-scroll absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[var(--cl-text-muted)] transition-colors hover:text-[var(--cl-neon)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cl-neon)]"
    >
      <span class="text-[10px] font-semibold uppercase tracking-[0.2em]">Scroll</span>
      <span class="clicklab-hero-scroll-icon flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
        <Icon name="lucide:chevron-down" size="18" />
      </span>
    </a>

    <div class="clicklab-hero-divider pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--cl-neon)]/25 to-transparent" aria-hidden="true" />
  </section>
</template>

<script setup lang="ts">
const heroSection = ref<HTMLElement | null>(null);
const { active: glowActive } = useClickLabHeroGlow(heroSection);
useClickLabSectionReveal(heroSection, { threshold: 0.22, rootMargin: '0px 0px -6% 0px' });
</script>
