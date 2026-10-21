<template>
    <div class="min-h-[60vh]">
        <div class="max-w-7xl mx-auto space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl sm:text-3xl font-semibold text-base-content">{{ $t('products.title') }}</h1>
                    <p class="text-sm text-base-content/70 mt-1">{{ $t('products.description') }}</p>
                </div>
                <div class="flex gap-2">
                    <NuxtLink to="/settings" class="btn btn-ghost btn-sm">{{ $t('common.back') }}</NuxtLink>
                    <NuxtLink to="/settings/plans" class="btn btn-primary btn-sm">{{ $t('settings.seePlans') }}</NuxtLink>
                </div>
            </div>

            <div class="card shadow-md rounded-box">
                <div class="card-body">
                    <SettingsProductsCard :products="products" :pending="pending" :error="error" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import type { Product } from '~~/server/database/schemas/product.schema';

const { t } = useI18n();

const { data: products, pending, error } = await useFetch<Product[]>('/api/v1/product');

useHead({ title: clicklabPageTitle(t('products.title')) });
</script>

<style scoped>

</style>