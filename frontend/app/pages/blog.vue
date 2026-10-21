<template>
    <div class="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 class="text-2xl font-semibold mb-3">{{ $t('legal.blog') }}</h1>
        <p class="text-base-content/70 mb-6">{{ $t('legal.blogRedirect') }}</p>
        <a :href="blogUrl" class="btn btn-primary">{{ $t('legal.blogContinue') }}</a>
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import { MARKETING_BLOG_URL } from '~~/shared/site';

definePageMeta({
    layout: 'public',
});

useHead({
    title: clicklabPageTitle('Blog'),
});

const blogUrl = MARKETING_BLOG_URL;

onMounted(() => {
    window.location.replace(MARKETING_BLOG_URL);
});
</script>
