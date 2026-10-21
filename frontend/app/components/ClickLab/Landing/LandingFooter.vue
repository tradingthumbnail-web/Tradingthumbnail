<template>
  <footer class="border-t border-white/5 bg-[var(--cl-bg)] py-12">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
      <div class="lg:col-span-2">
        <ClickLabSharedLogo />
        <p class="mt-4 max-w-sm text-sm text-[var(--cl-text-muted)]">{{ CLICKLAB_TAGLINE }}</p>
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-white/50">Product</p>
        <ul class="mt-3 space-y-2 text-sm">
          <li><NuxtLink to="/studio" class="clicklab-footer-link text-[var(--cl-text-muted)] hover:text-[var(--cl-neon)]">Studio</NuxtLink></li>
          <li><NuxtLink to="/studio/avatars" class="clicklab-footer-link text-[var(--cl-text-muted)] hover:text-[var(--cl-neon)]">Avatars</NuxtLink></li>
          <li><a href="#pricing" class="clicklab-footer-link text-[var(--cl-text-muted)] hover:text-[var(--cl-neon)]">Pricing</a></li>
        </ul>
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-white/50">Legal</p>
        <ul class="mt-3 space-y-2 text-sm">
          <li><NuxtLink to="/privacy" class="clicklab-footer-link text-[var(--cl-text-muted)] hover:text-[var(--cl-neon)]">Privacy</NuxtLink></li>
          <li><NuxtLink to="/terms" class="clicklab-footer-link text-[var(--cl-text-muted)] hover:text-[var(--cl-neon)]">Terms</NuxtLink></li>
          <li><NuxtLink to="/cookies" class="clicklab-footer-link text-[var(--cl-text-muted)] hover:text-[var(--cl-neon)]">Cookies</NuxtLink></li>
        </ul>
      </div>
    </div>
    <div class="mx-auto mt-10 max-w-7xl border-t border-white/5 px-4 pt-8 text-center text-xs text-[var(--cl-text-muted)] sm:px-6 lg:px-8">
      © {{ new Date().getFullYear() }} {{ CLICKLAB_PRODUCT_NAME }}. Demo frontend — billing & generation APIs not wired in this phase.
      <a :href="`mailto:${CLICKLAB_SUPPORT_EMAIL}`" class="ml-1 text-[var(--cl-cyan)] hover:underline">{{ CLICKLAB_SUPPORT_EMAIL }}</a>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { CLICKLAB_PRODUCT_NAME, CLICKLAB_SUPPORT_EMAIL, CLICKLAB_TAGLINE } from '~~/shared/clicklab/brand';
</script>
