<template>
  <section id="how-it-works" ref="sectionRoot" class="py-20 sm:py-28">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center" data-reveal>
        <h2 class="clicklab-display text-3xl font-bold text-white sm:text-4xl">How ClickLab works</h2>
        <p class="mt-4 text-[var(--cl-text-muted)]">A clear workflow from niche selection to export — mirrored in the demo studio.</p>
      </div>
      <ol class="relative mt-14 grid gap-6 lg:grid-cols-3" data-reveal-stagger>
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          class="clicklab-glass cl-hover-card relative rounded-2xl p-6"
        >
          <span class="clicklab-display cl-hover-step text-4xl font-bold text-[var(--cl-neon)]/25">{{ String(index + 1).padStart(2, '0') }}</span>
          <h3 class="clicklab-display mt-2 text-lg font-bold text-white">{{ step.title }}</h3>
          <p class="mt-2 text-sm text-[var(--cl-text-muted)]">{{ step.description }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
const sectionRoot = ref<HTMLElement | null>(null);
useClickLabSectionReveal(sectionRoot);

const steps = [
  { title: 'Choose a trading niche', description: 'Load ICT, crypto, prop firm, or options presets with the right vocabulary.' },
  { title: 'Enter topic, title & description', description: 'Describe the video story — not just the final headline.' },
  { title: 'Pick platform & visual style', description: 'Match YouTube, Shorts, or Reels with niche style presets.' },
  { title: 'Select a trained avatar', description: 'Use your face model when ready, or demo placeholders today.' },
  { title: 'Generate & compare concepts', description: 'Review multiple variations before picking a winner.' },
  { title: 'Edit & export', description: 'Fine-tune text and export in the demo (simulated) or use signed-in editor tools for real files.' },
];
</script>
