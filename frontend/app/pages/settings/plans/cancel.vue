<template>
    <div class="min-h-screen flex items-center justify-center bg-base-200 p-6">
        <div class="card w-full max-w-md bg-base-100 shadow-md rounded-box">
            <div class="card-body text-center p-8">
                <h1 class="text-2xl font-semibold text-base-content mb-2">{{ $t('plans.cancelPage.title') }}</h1>
                <p class="text-sm text-base-content/70 mb-6">{{ $t('plans.cancelPage.message') }}</p>
                <div class="flex justify-center">
                    <button @click="goBack" class="btn btn-primary">{{ $t('plans.cancelPage.goBack') }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
const { t } = useI18n();
const router = useRouter();

function goBack() {
    router.back();
}

useHead({
    title: clicklabPageTitle(t('plans.cancelPage.title')),
});

definePageMeta({
    layout: 'empty',
});
</script>

<style scoped>
</style>