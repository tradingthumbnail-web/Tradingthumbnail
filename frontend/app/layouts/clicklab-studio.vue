<template>
  <div class="clicklab-root flex h-screen w-screen overflow-hidden bg-[var(--cl-bg-deep)]">
    <BaseToast />
    <ClickLabStudioStudioSidebar />
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/5 bg-[var(--cl-bg)]/90 px-4 py-2 backdrop-blur-md lg:px-6">
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <ClickLabSharedLogo to="/" class="lg:hidden" />
          <ClickLabSharedDemoBadge />
          <span class="hidden text-sm text-[var(--cl-text-muted)] md:inline">Browser-only demo — simulated generation &amp; avatars</span>
          <nav class="flex gap-1 lg:hidden" aria-label="Studio mobile">
            <NuxtLink to="/studio" class="rounded-lg px-2 py-1 text-xs font-medium text-[var(--cl-text-muted)] hover:text-[var(--cl-neon)]">Studio</NuxtLink>
            <NuxtLink to="/studio/avatars" class="rounded-lg px-2 py-1 text-xs font-medium text-[var(--cl-text-muted)] hover:text-[var(--cl-neon)]">Avatars</NuxtLink>
          </nav>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink to="/login" class="clicklab-btn-ghost !py-2 !text-sm">Sign In</NuxtLink>
          <NuxtLink to="/signup" class="clicklab-btn-primary !py-2 !text-sm">Get Started</NuxtLink>
        </div>
      </header>
      <main class="min-h-0 flex-1 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
