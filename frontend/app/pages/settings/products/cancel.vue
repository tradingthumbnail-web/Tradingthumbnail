<template>
    <div class="min-h-screen flex items-center justify-center px-4 py-12">
        <div class="max-w-md w-full">
            <div class="card bg-base-100 shadow-lg rounded-box">
                <div class="card-body p-8 text-center">
                    <div class="flex justify-center mb-6">
                        <div class="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center">
                            <Icon name="lucide:circle-x" size="32" class="text-warning" mode="svg" />
                        </div>
                    </div>

                    <h1 class="card-title text-2xl justify-center mb-2">
                        {{ $t('products.cancelPage.title') }}
                    </h1>

                    <p class="text-base-content/70 text-sm mb-8">
                        {{ $t('products.cancelPage.message') }}
                    </p>

                    <div class="bg-info/10 border border-info/30 rounded-lg p-4 mb-8">
                        <p class="text-xs text-base-content/70">
                            {{ $t('common.need') }} <span class="font-medium">{{ $t('common.help') }}</span>? 
                            {{ $t('common.checkSupport') }}
                        </p>
                    </div>

                    <div class="space-y-3">
                        <NuxtLink 
                            to="/settings/products" 
                            class="btn btn-primary w-full"
                        >
                            {{ $t('products.cancelPage.goBack') }}
                        </NuxtLink>
                        <NuxtLink 
                            to="/" 
                            class="btn btn-ghost w-full"
                        >
                            {{ $t('common.goHome') }}
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <div class="text-center mt-6">
                <p class="text-xs text-base-content/50">
                    {{ $t('common.sessionCancelled') }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
definePageMeta({
    layout: 'empty'
});

const { t } = useI18n();

useHead({ title: clicklabPageTitle(t('stripe.cancelPage.title')) });
</script>

<style scoped>

</style>