<template>
  <section ref="sectionRoot" class="py-16 sm:py-24">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div data-reveal class="clicklab-glass clicklab-glow-border cl-hover-card relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12">
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--cl-neon)]/10 via-transparent to-[var(--cl-violet)]/15" />
        <h2 class="clicklab-display relative text-3xl font-bold text-white sm:text-4xl">Ready to ship your next markets thumbnail?</h2>
        <p class="relative mx-auto mt-4 max-w-lg text-[var(--cl-text-muted)]">
          Start in demo mode — no API keys required. Sign in when you want live generation, billing, and workspace tools on /home.
        </p>
        <div class="relative mt-8 flex flex-wrap justify-center gap-3">
          <ClickLabLandingCreateThumbnailLink class="clicklab-btn-primary">Create Your Thumbnail</ClickLabLandingCreateThumbnailLink>
          <NuxtLink to="/login" class="clicklab-btn-ghost">Sign In</NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const sectionRoot = ref<HTMLElement | null>(null);
useClickLabSectionReveal(sectionRoot);
</script>
