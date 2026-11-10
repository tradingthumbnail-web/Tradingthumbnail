<template>
  <div class="flex flex-col gap-8">
    <HomeHeader />
    <HomeQuickActions />
    <HomeGallery />
    <HomeActivity />
  </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';

useHead({
  title: clicklabPageTitle('Home'),
});
</script>
