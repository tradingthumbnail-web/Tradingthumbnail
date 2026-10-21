<template>
  <div class="clicklab-root min-h-screen bg-[var(--cl-bg-deep)] text-[var(--cl-text)]">
    <div class="clicklab-scroll-progress" aria-hidden="true">
      <span class="clicklab-scroll-progress__bar" :style="{ transform: `scaleX(${scrollProgress})` }" />
    </div>
    <BaseToast />
    <slot />
  </div>
</template>

<script setup lang="ts">
useHead({
  htmlAttrs: { class: 'clicklab-root' },
});

const scrollProgress = ref(0);
let onScroll: (() => void) | undefined;

onMounted(() => {
  onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    scrollProgress.value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});

onUnmounted(() => {
  if (onScroll) window.removeEventListener('scroll', onScroll);
});
</script>
