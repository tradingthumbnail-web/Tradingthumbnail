<template>
    <article class="max-w-3xl mx-auto px-4 py-10 prose prose-invert max-w-none text-base-content">
        <h1 class="text-3xl font-semibold mb-2">{{ $t('legal.privacyTitle') }}</h1>
        <p class="text-sm text-base-content/60 mb-8">{{ $t('legal.lastUpdated') }}</p>

        <p>{{ $t('legal.privacyIntro') }}</p>
        <p>
            {{ $t('legal.canonicalNotice') }}
            <a :href="canonicalUrl" class="link link-primary" target="_blank" rel="noopener">{{ canonicalUrl }}</a>
        </p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.privacyController') }}</h2>
        <p>{{ $t('legal.privacyControllerBody') }}</p>
        <p>
            <a :href="`mailto:${supportEmail}`" class="link">{{ supportEmail }}</a>
        </p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.privacyData') }}</h2>
        <p>{{ $t('legal.privacyDataBody') }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.privacyUse') }}</h2>
        <p>{{ $t('legal.privacyUseBody') }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.privacyShare') }}</h2>
        <p>{{ $t('legal.privacyShareBody') }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.privacyRights') }}</h2>
        <p>{{ $t('legal.privacyRightsBody') }}</p>

        <h2 class="text-xl font-semibold mt-8 mb-3">{{ $t('legal.privacySecurity') }}</h2>
        <p>{{ $t('legal.privacySecurityBody') }}</p>

        <p class="mt-8">
            <NuxtLink to="/cookies" class="link">{{ $t('legal.cookies') }}</NuxtLink>
            ·
            <NuxtLink to="/terms" class="link">{{ $t('legal.terms') }}</NuxtLink>
        </p>
    </article>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import { CANONICAL_PRIVACY_URL, SUPPORT_EMAIL } from '~~/shared/site';

definePageMeta({
    layout: 'public',
});

useHead({
    title: clicklabPageTitle('Privacy Policy'),
});

const supportEmail = SUPPORT_EMAIL;
const canonicalUrl = CANONICAL_PRIVACY_URL;
</script>
