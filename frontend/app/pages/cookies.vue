<template>
    <article class="max-w-3xl mx-auto px-4 py-10 text-base-content">
        <h1 class="text-3xl font-semibold mb-2">{{ $t('legal.cookiesTitle') }}</h1>
        <p class="text-sm text-base-content/60 mb-8">{{ $t('legal.lastUpdated') }}</p>

        <p>{{ $t('legal.cookiesIntro') }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.cookiesNecessary') }}</h2>
        <p>{{ $t('legal.cookiesNecessaryBody') }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.cookiesPreferences') }}</h2>
        <p>{{ $t('legal.cookiesPreferencesBody') }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.cookiesAnalytics') }}</h2>
        <p>{{ $t('legal.cookiesAnalyticsBody') }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.cookiesThirdParty') }}</h2>
        <p>{{ $t('legal.cookiesThirdPartyBody') }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.cookiesManage') }}</h2>
        <p>{{ $t('legal.cookiesManageBody') }}</p>

        <p class="mt-8">
            <NuxtLink to="/privacy" class="link">{{ $t('legal.privacy') }}</NuxtLink>
            ·
            <a :href="`mailto:${supportEmail}`" class="link">{{ supportEmail }}</a>
        </p>
    </article>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import { SUPPORT_EMAIL } from '~~/shared/site';

definePageMeta({
    layout: 'public',
});

useHead({
    title: clicklabPageTitle('Cookie Policy'),
});

const supportEmail = SUPPORT_EMAIL;
</script>
