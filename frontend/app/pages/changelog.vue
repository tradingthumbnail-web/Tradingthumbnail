<template>
    <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
            <h1 class="text-2xl font-semibold">{{ $t('common.changelog.pageTitle') }}</h1>
            <p class="text-sm text-base-content/60">{{ $t('common.changelog.pageDescription') }}</p>
        </div>

        <div class="max-w-4xl mx-auto">
            <div v-for="(entry, index) in changelogs" :key="entry.version" class="relative pb-8 last:pb-0">
                <div v-if="index < changelogs.length - 1" class="absolute left-6 top-12 bottom-0 w-0.5 bg-base-300"></div>
                <div class="flex gap-4">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon name="lucide:check-circle" size="20" mode="svg" class="text-primary" />
                        </div>
                    </div>
                    <div class="flex-1 pb-6">
                        <div class="bg-base-100 border border-base-300 rounded-lg p-6 shadow-sm">
                            <div class="flex items-center justify-between gap-4 mb-3 flex-wrap">
                                <h3 class="text-lg font-semibold">{{ entry.title }}</h3>
                                <span class="badge badge-primary badge-sm">{{ $t('common.version') }} {{ entry.version }}</span>
                            </div>
                            <time class="text-xs text-base-content/60 font-medium block mb-4">{{ formatDate(entry.date) }}</time>
                            <ul class="space-y-2">
                                <li v-for="(feature, featureIndex) in entry.features" :key="featureIndex" class="flex items-start gap-2 text-sm text-base-content/80">
                                    <Icon name="lucide:check-circle" class="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                                    <span>{{ feature }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';

const { getAllChangelogs } = useChangelog();
const { t, locale } = useI18n();

const changelogs = computed(() => getAllChangelogs());

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const localeMap: Record<string, string> = {
        'en': 'en-US',
        'es': 'es-ES',
        'ca': 'ca-ES',
    };
    const currentLocale = locale.value as string;
    const dateLocale = localeMap[currentLocale] || 'en-US';
    return new Intl.DateTimeFormat(dateLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

useHead({
    title: clicklabPageTitle(t('common.changelog.pageTitle')),
});
</script>

<style scoped>
</style>