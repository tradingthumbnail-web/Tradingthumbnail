<template>
    <div v-if="props.pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 shadow-md rounded-box">
        <div v-for="i in 3" :key="i" class="animate-pulse"></div>
    </div>

    <div v-else-if="props.error" class="alert alert-error">
        <span>{{ $t('common.errors.title') }}</span>
    </div>

    <div v-else>
        <div v-if="!props.products || props.products.length === 0" class="text-center text-base-content/70 py-10">
            <p class="mb-3">{{ $t('products.empty') }}</p>
            <NuxtLink to="/settings/plans" class="btn btn-primary btn-sm">
                {{ $t('settings.seePlans') }}
            </NuxtLink>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="product in props.products" :key="product.id" class="card bg-base-100 shadow-md rounded-box">
                <div class="card-body">
                    <div class="flex items-start justify-between gap-3">
                        <h3 class="card-title text-base-content">{{ product.name }}</h3>
                    </div>

                    <div class="mt-2">
                        <ul v-if="Array.isArray(getFeatures(product))" class="space-y-2">
                            <li v-for="(item, idx) in getFeatures(product)" :key="idx" class="flex items-start gap-2 text-sm text-base-content/80">
                                <Icon name="mdi:check-circle-outline" class="text-success" size="18" />
                                <span>{{ item }}</span>
                            </li>
                        </ul>

                        <p v-else class="text-sm text-base-content/60">
                            {{ $t('products.noFeatures') }}
                        </p>
                    </div>

                    <div class="card-actions justify-end mt-4">
                        <button class="btn btn-primary btn-sm" @click="startCheckout(product.id)">{{ $t('products.buy') }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Product } from '~~/server/database/schemas/product.schema';
import type { Locale } from '~~/server/database/schemas/user.schema';

const { t, locale } = useI18n();
const toast = useToast();
const props = defineProps<{
    products?: Product[];
    pending?: boolean;
    error?: any;
}>();

function getFeatures(product: Product): string[] | null {
    if (!product.features) {
        return null;
    }
    
    const currentLocale = (locale.value as Locale) || 'en';
    const features = product.features[currentLocale];
    
    if (Array.isArray(features) && features.length > 0) {
        return features;
    }
    
    const fallbackFeatures = product.features['en'];
    if (Array.isArray(fallbackFeatures) && fallbackFeatures.length > 0) {
        return fallbackFeatures;
    }
    
    return null;
};

const startCheckout = async (productId: string) => {
    try {
        const { checkoutUrl } = await $fetch('/api/v1/polar/product-checkout-session', {
            method: 'POST',
            body: {
                productId,
            },
        });
        if (!checkoutUrl) {
            console.error('Failed to create checkout session');
            throw new Error('Failed to create checkout session');
        }   
        window.location.href = checkoutUrl;
    } catch (error: any) {
        console.error(error);
        toast.show({
            title: t('common.errors.title'),
            message: error.message,
            status: 'error',
        });
    }
};
</script>

<style scoped>

</style>