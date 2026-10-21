<template>
  <header class="fixed top-0 z-50 w-full border-b border-white/5 bg-[var(--cl-bg-deep)]/80 backdrop-blur-xl">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
      <ClickLabSharedLogo />
      <nav class="hidden items-center gap-8 md:flex" aria-label="Primary">
        <a v-for="link in links" :key="link.href" :href="link.href" class="clicklab-nav-link rounded-md text-sm font-medium text-[var(--cl-text-muted)] transition-colors hover:text-[var(--cl-neon)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cl-neon)]">
          {{ link.label }}
        </a>
      </nav>
      <div class="flex items-center gap-2">
        <button type="button" class="btn btn-ghost btn-sm md:hidden" aria-label="Open menu" @click="mobileOpen = !mobileOpen">
          <Icon :name="mobileOpen ? 'lucide:x' : 'lucide:menu'" size="20" />
        </button>
        <NuxtLink to="/login" class="clicklab-btn-ghost hidden !py-2 !text-sm sm:inline-flex">Sign In</NuxtLink>
        <NuxtLink to="/signup" class="clicklab-btn-primary hidden !py-2 !text-sm sm:inline-flex">Get Started</NuxtLink>
      </div>
    </div>
    <div v-if="mobileOpen" class="border-t border-white/5 bg-[var(--cl-bg)] px-4 py-4 md:hidden">
      <nav class="flex flex-col gap-3">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="text-sm font-medium text-[var(--cl-text-muted)]"
          @click="mobileOpen = false"
        >
          {{ link.label }}
        </a>
        <div class="mt-2 flex flex-col gap-2">
          <NuxtLink to="/login" class="clicklab-btn-ghost w-full">Sign In</NuxtLink>
          <NuxtLink to="/signup" class="clicklab-btn-primary w-full">Get Started</NuxtLink>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const mobileOpen = ref(false);

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Trading Niches', href: '#niches' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Pricing', href: '#pricing' },
];
</script>
