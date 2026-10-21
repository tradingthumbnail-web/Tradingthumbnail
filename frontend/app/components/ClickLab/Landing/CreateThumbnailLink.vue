<template>
  <NuxtLink :to="href">
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** In-app path after sign-in (must pass safe-redirect validation). */
    destination?: string;
  }>(),
  {
    destination: undefined,
  },
);

const { resolveCreateThumbnailTarget, studioEntryPath } = useClickLabStudioEntry();

const href = computed(() =>
  resolveCreateThumbnailTarget(props.destination ?? studioEntryPath),
);
</script>
