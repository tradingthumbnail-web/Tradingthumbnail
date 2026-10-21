<template>
  <div class="mt-8 space-y-3">
    <nav class="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-[var(--cl-text-muted)]">
      <NuxtLink to="/" class="hover:text-[var(--cl-neon)]">ClickLab home</NuxtLink>
      <NuxtLink to="/studio" class="hover:text-[var(--cl-neon)]">Demo studio</NuxtLink>
      <NuxtLink to="/privacy" class="hover:text-[var(--cl-neon)]">{{ $t('legal.privacy') }}</NuxtLink>
      <NuxtLink to="/terms" class="hover:text-[var(--cl-neon)]">{{ $t('legal.terms') }}</NuxtLink>
      <NuxtLink to="/cookies" class="hover:text-[var(--cl-neon)]">{{ $t('legal.cookies') }}</NuxtLink>
    </nav>
  </div>
</template>
