<template>
  <section id="features" ref="sectionRoot" class="border-y border-white/5 bg-[#060809] py-20 sm:py-28">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center" data-reveal>
        <h2 class="clicklab-display text-3xl font-bold text-white sm:text-4xl">Built for trading creators</h2>
        <p class="mt-4 text-[var(--cl-text-muted)]">Product capabilities presented in the UI — connect your backend when you are ready to go live.</p>
      </div>
      <div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-reveal-stagger>
        <article
          v-for="feature in features"
          :key="feature.title"
          class="clicklab-panel cl-hover-card rounded-2xl p-5"
        >
          <div class="cl-hover-icon mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--cl-neon)]/10 text-[var(--cl-neon)]">
            <Icon :name="feature.icon" size="22" />
          </div>
          <h3 class="font-semibold text-white">{{ feature.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-[var(--cl-text-muted)]">{{ feature.description }}</p>
          <p v-if="feature.note" class="mt-3 text-[11px] text-[var(--cl-violet-bright)]/90">{{ feature.note }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const sectionRoot = ref<HTMLElement | null>(null);
useClickLabSectionReveal(sectionRoot);

const features = [
  {
    icon: 'lucide:wand-sparkles',
    title: 'AI thumbnail generation',
    description: 'Generate multiple trading-native concepts from your title, niche, and platform.',
    note: 'Demo uses sample previews locally.',
  },
  {
    icon: 'lucide:scan-face',
    title: 'Personalized AI avatars',
    description: 'Train a consistent on-brand face from 15–20 photos for recurring series thumbnails.',
    note: 'Upload UI only in demo mode.',
  },
  {
    icon: 'lucide:layers',
    title: 'Trading-specific styles',
    description: 'Niche presets for ICT, crypto volatility, prop payouts, options gamma, and more.',
  },
  {
    icon: 'lucide:copy',
    title: 'Multiple variations',
    description: 'Compare layouts side-by-side before you commit to a publish-ready frame.',
  },
  {
    icon: 'lucide:type',
    title: 'Text overlays & editing',
    description: 'Tune headline hierarchy and overlays — full editor available when signed in.',
    note: 'Full canvas editor available on signed-in image routes.',
  },
  {
    icon: 'lucide:text-quote',
    title: 'Title & description assist',
    description: 'Draft click-worthy titles aligned with your thumbnail story and niche vocabulary.',
  },
  {
    icon: 'lucide:monitor-smartphone',
    title: 'Platform-specific layouts',
    description: 'YouTube, Shorts, Reels, Instagram, and more with correct aspect ratios.',
  },
  {
    icon: 'lucide:eye',
    title: 'Critique & consistency',
    description: 'Checklist-driven review for contrast, ticker legibility, and series branding.',
  },
];
</script>
