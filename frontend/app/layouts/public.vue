<template>
    <div class="clicklab-root min-h-screen flex flex-col bg-[var(--cl-bg-deep)]">
        <BaseToast />
        <header class="border-b border-white/5 bg-[var(--cl-bg)]/90 backdrop-blur-md">
            <div class="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                <ClickLabSharedLogo />
                <nav class="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm">
                    <NuxtLink to="/" class="hover:text-[var(--cl-neon)] text-[var(--cl-text-muted)]">Home</NuxtLink>
                    <NuxtLink to="/privacy" class="hover:text-[var(--cl-neon)] text-[var(--cl-text-muted)]">{{ $t('legal.privacy') }}</NuxtLink>
                    <NuxtLink to="/terms" class="hover:text-[var(--cl-neon)] text-[var(--cl-text-muted)]">{{ $t('legal.terms') }}</NuxtLink>
                    <NuxtLink to="/cookies" class="hover:text-[var(--cl-neon)] text-[var(--cl-text-muted)]">{{ $t('legal.cookies') }}</NuxtLink>
                    <NuxtLink to="/login" class="font-medium text-primary hover:text-primary/80">{{ $t('auth.login.signIn') }}</NuxtLink>
                </nav>
            </div>
        </header>
        <main class="flex-1">
            <slot />
        </main>
        <footer class="border-t border-white/5 bg-[var(--cl-bg)]/80">
            <div class="max-w-3xl mx-auto px-4 py-6 space-y-4">
                <BaseEmailCapture />
                <p class="text-xs text-[var(--cl-text-muted)]">
                    © {{ new Date().getFullYear() }} {{ CLICKLAB_PRODUCT_NAME }}.
                    <a :href="`mailto:${supportEmail}`" class="text-[var(--cl-cyan)] hover:underline">{{ supportEmail }}</a>
                </p>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { CLICKLAB_PRODUCT_NAME, CLICKLAB_SUPPORT_EMAIL } from '~~/shared/clicklab/brand';

const supportEmail = CLICKLAB_SUPPORT_EMAIL;
</script>
