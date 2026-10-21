<template>
    <article class="max-w-3xl mx-auto px-4 py-10 text-base-content">
        <h1 class="text-3xl font-semibold mb-2">{{ $t('legal.termsTitle') }}</h1>
        <p class="text-sm text-base-content/60 mb-8">{{ $t('legal.lastUpdated') }}</p>

        <p>{{ $t('legal.termsIntro') }}</p>
        <p class="mt-4">
            {{ $t('legal.canonicalNotice') }}
            <a :href="canonicalUrl" class="link link-primary" target="_blank" rel="noopener">{{ canonicalUrl }}</a>
        </p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.termsService') }}</h2>
        <p>{{ $t('legal.termsServiceBody') }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.termsAccount') }}</h2>
        <p>{{ $t('legal.termsAccountBody') }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.termsContent') }}</h2>
        <p>{{ $t('legal.termsContentBody') }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.termsBilling') }}</h2>
        <p>{{ $t('legal.termsBillingBody') }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.termsContact') }}</h2>
        <p>
            <a :href="`mailto:${supportEmail}`" class="link">{{ supportEmail }}</a>
        </p>

        <p class="mt-8">
            <NuxtLink to="/privacy" class="link">{{ $t('legal.privacy') }}</NuxtLink>
            ·
            <NuxtLink to="/cookies" class="link">{{ $t('legal.cookies') }}</NuxtLink>
        </p>
    </article>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import { CANONICAL_TERMS_URL, SUPPORT_EMAIL } from '~~/shared/site';

definePageMeta({
    layout: 'public',
});

useHead({
    title: clicklabPageTitle('Terms of Service'),
});

const supportEmail = SUPPORT_EMAIL;
const canonicalUrl = CANONICAL_TERMS_URL;
</script>
