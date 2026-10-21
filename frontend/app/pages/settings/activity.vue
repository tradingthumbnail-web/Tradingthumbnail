<template>
    <div class="p-4 space-y-4">
        <h2 class="text-2xl font-semibold text-base-content">{{ $t('activity.title') }}</h2>

        <button class="btn btn-ghost" @click="goBack">
            <Icon name="lucide:arrow-left" size="16" mode="svg" />
            {{ $t('common.back') }}
        </button>

        <div class="max-w-7xl mx-auto">
            <SettingsActivityCard :activities="data" :pending="pending" :error="error" />
        </div>
    </div>
    
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
const { t } = useI18n();
const router = useRouter();

const { data, pending, error } = await useFetch('/api/v1/activity');

const goBack = () => {
    router.back();
};

useHead({
    title: clicklabPageTitle(t('activity.title')),
});
</script>

<style scoped>

</style>