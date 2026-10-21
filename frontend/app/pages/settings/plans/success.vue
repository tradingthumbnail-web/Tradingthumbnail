<template>
    <div class="min-h-screen flex items-center justify-center bg-base-200 p-6">
        <div class="card w-full max-w-md bg-base-100 shadow-md rounded-box">
            <div class="card-body text-center p-8">
                <h1 class="text-2xl font-semibold text-base-content mb-2">{{ $t('plans.successPage.title') }}</h1>
                <p class="text-sm text-base-content/70 mb-4">{{ $t('plans.successPage.message', { tierName: selected?.tier?.name }) }}</p>
                <p v-if="selected" class="text-sm text-base-content/80 mb-6">{{ $t('plans.successPage.plan') }}: {{ selected.tier?.name }}</p>
                <div class="flex justify-center gap-3">
                    <button @click="goHome" class="btn btn-primary">{{ $t('plans.successPage.goToDashboard') }}</button>
                    <button @click="viewBilling" class="btn btn-ghost">{{ $t('plans.successPage.viewBilling') }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const tierId = route.query.tierId;

const { data: tiers } = await useFetch(`/api/v1/tier`);
const selected = computed(() => {
    if (!tiers?.value) return null;
    return tiers.value.find((entry: any) => String(entry.tier?.id) === String(tierId));
});

function goHome() {
    router.push('/');
}

function viewBilling() {
    router.push('/settings');
}

useHead({
    title: clicklabPageTitle(t('plans.successPage.title')),
});

definePageMeta({
    layout: 'empty',
});
</script>

<style scoped>
</style>