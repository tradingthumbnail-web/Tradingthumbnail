<template>
    <form class="flex flex-col sm:flex-row gap-2" @submit.prevent="subscribe">
        <div class="flex-1">
            <label class="sr-only" for="newsletter-email">{{ $t('newsletter.email') }}</label>
            <input
                id="newsletter-email"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                class="input input-bordered input-sm w-full bg-base-100/50"
                :placeholder="$t('newsletter.placeholder')"
            />
        </div>
        <button type="submit" class="btn btn-primary btn-sm" :disabled="pending">
            <span v-if="pending" class="loading loading-spinner loading-xs"></span>
            <span>{{ $t('newsletter.subscribe') }}</span>
        </button>
    </form>
    <p class="text-xs text-base-content/50 mt-2">{{ $t('newsletter.hint') }}</p>
</template>

<script setup lang="ts">
const { t } = useI18n();
const toast = useToast();
const email = ref('');
const pending = ref(false);

async function subscribe() {
    if (pending.value) return;
    pending.value = true;
    try {
        await $fetch('/api/v1/newsletter/subscribe', {
            method: 'POST',
            body: { email: email.value.trim() },
        });
        email.value = '';
        toast.show({
            title: t('newsletter.successTitle'),
            message: t('newsletter.successMessage'),
            status: 'success',
        });
    } catch (error: any) {
        const status = error?.statusCode || error?.status;
        toast.show({
            title: t('newsletter.errorTitle'),
            message: status === 503 ? t('newsletter.notConfigured') : t('newsletter.errorMessage'),
            status: 'error',
        });
    } finally {
        pending.value = false;
    }
}
</script>
