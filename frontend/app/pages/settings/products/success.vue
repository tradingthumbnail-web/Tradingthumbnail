<template>
    <div class="min-h-screen flex items-center justify-center px-4 py-12">
        <div class="max-w-md w-full">
            <div class="card bg-base-100 shadow-lg rounded-box">
                <div class="card-body p-8 text-center">
                    <div class="flex justify-center mb-6">
                        <div class="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
                            <Icon name="lucide:check-circle-2" size="32" class="text-success" mode="svg" />
                        </div>
                    </div>

                    <h1 class="card-title text-2xl justify-center mb-2">
                        {{ $t('products.successPage.title') }}
                    </h1>

                    <p class="text-base-content/70 text-sm mb-6">
                        {{ $t('products.successPage.message', { productName: product?.name || 'your purchase' }) }}
                    </p>

                    <div v-if="product" class="bg-base-200/50 rounded-lg p-4 mb-6 text-left">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-base-content/60">{{ $t('products.successPage.product') }}</span>
                            <span class="font-semibold text-base-content">{{ product.name }}</span>
                        </div>
                        <div v-if="Array.isArray(product.features) && product.features.length > 0" class="mt-4 pt-4 border-t border-base-content/10">
                            <ul class="space-y-2">
                                <li v-for="(feature, idx) in product.features.slice(0, 3)" :key="idx" class="flex items-start gap-2 text-xs text-base-content/70">
                                    <Icon name="mdi:check-circle-outline" class="text-success flex-shrink-0 mt-0.5" size="14" />
                                    <span>{{ feature }}</span>
                                </li>
                                <li v-if="product.features.length > 3" class="text-xs text-base-content/60 italic">
                                    {{ product.features.length - 3 }} {{ $t('common.other') }}
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="space-y-3 pt-4">
                        <button 
                            @click="goToDashboard" 
                            class="btn btn-primary w-full"
                        >
                            {{ $t('products.successPage.goToDashboard') }}
                        </button>
                        <NuxtLink 
                            to="/settings" 
                            class="btn btn-ghost w-full"
                        >
                            {{ $t('settings.title') }}
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import type { Product } from '~~/server/database/schemas/product.schema';

definePageMeta({
    layout: 'empty'
});

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const productId = computed(() => route.query['productId'] as string || '');

const { data: product } = await useFetch<Product>(`/api/v1/product/${productId.value}`);

const goToDashboard = () => {
    router.push('/');
};

useHead({ title: clicklabPageTitle(t('products.successPage.title')) });
</script>

<style scoped>

</style>