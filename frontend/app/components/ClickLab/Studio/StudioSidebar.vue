<template>
  <aside class="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-[var(--cl-bg)] lg:flex">
    <div class="border-b border-white/5 p-4">
      <ClickLabSharedLogo to="/" />
    </div>
    <nav class="flex-1 space-y-1 p-3" aria-label="Studio">
      <NuxtLink
        v-for="item in items"
        :key="item.to + (item.hash ?? '')"
        :to="item.hash ? { path: item.to, hash: item.hash } : item.to"
        class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
        :class="isActive(item) ? 'bg-[var(--cl-neon)]/15 text-[var(--cl-neon)]' : 'text-[var(--cl-text-muted)] hover:bg-white/5 hover:text-white'"
      >
        <Icon :name="item.icon" size="18" />
        {{ item.label }}
      </NuxtLink>
    </nav>
    <div class="border-t border-white/5 p-4">
      <NuxtLink to="/home" class="text-xs text-[var(--cl-text-muted)] hover:text-[var(--cl-cyan)]">
        Signed in? Open full workspace →
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
const route = useRoute();

const items = [
  { label: 'Create thumbnail', to: '/studio', icon: 'lucide:image-plus' },
  { label: 'Avatars', to: '/studio/avatars', icon: 'lucide:scan-face' },
  { label: 'Recent (demo)', to: '/studio', hash: '#recent', icon: 'lucide:history' },
];

function isActive(item: { to: string; hash?: string }) {
  if (item.hash) return route.path === '/studio';
  return route.path === item.to;
}
</script>
