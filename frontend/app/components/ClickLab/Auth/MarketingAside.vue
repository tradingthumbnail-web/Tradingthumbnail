<template>
  <aside class="relative hidden overflow-hidden border-r border-white/5 bg-[var(--cl-bg)] lg:flex lg:flex-col lg:justify-center">
    <ClickLabLandingTradingBackground />
    <div class="relative max-w-md px-10 py-16">
      <NuxtLink to="/" class="mb-8 inline-block">
        <ClickLabSharedLogo />
      </NuxtLink>
      <p v-if="badge" class="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--cl-neon)]/25 bg-[var(--cl-neon)]/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--cl-neon)]">
        <Icon name="lucide:line-chart" size="14" />
        {{ badge }}
      </p>
      <h2 class="clicklab-display text-3xl font-bold leading-tight text-white xl:text-4xl">
        {{ title }}
      </h2>
      <p class="mt-4 text-base leading-relaxed text-[var(--cl-text-muted)]">{{ description }}</p>
      <ul v-if="bullets?.length" class="mt-8 space-y-3">
        <li v-for="(item, idx) in bullets" :key="idx" class="flex items-start gap-3 text-sm text-[var(--cl-text-muted)]">
          <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--cl-neon)]/15 text-[var(--cl-neon)]">
            <Icon name="lucide:check" size="14" />
          </span>
          <span>{{ item }}</span>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  bullets?: string[];
  badge?: string;
}>();
</script>
