<template>
    <div class="flex min-h-screen items-center justify-center px-4 py-10">
        <div class="w-full max-w-md">
            <div class="mb-6 flex justify-center">
                <ClickLabSharedLogo />
            </div>
        <div class="clicklab-glass rounded-2xl shadow-lg ring-1 ring-white/5">
            <!-- Success State -->
            <div v-if="validated" class="card-body text-center space-y-6">
                <!-- Success Icon -->
                <div class="w-16 h-16 mx-auto flex items-center justify-center border-2 border-success rounded-full">
                    <Icon
                        name="lucide:check-circle-2"
                        class="text-success"
                        aria-hidden="true"
                        size="48"
                    />
                </div>

                <!-- Success Message -->
                <div class="space-y-2">
                    <h2 class="text-2xl font-semibold tracking-tight">
                        {{ $t('auth.validateEmail.success.title') }}
                    </h2>
                    <p class="text-sm text-base-content/70 leading-relaxed">
                        {{ $t('auth.validateEmail.success.message') }}
                    </p>
                </div>

                <!-- Success Message Box -->
                <div class="alert alert-success">
                    <Icon name="lucide:check-circle" class="w-4 h-4" />
                    {{ $t('auth.validateEmail.success.completed') }}
                </div>

                <!-- Login Button -->
                <NuxtLink
                    to="/login"
                    class="btn btn-primary w-full"
                >
                    {{ $t('auth.validateEmail.success.login') }}
                </NuxtLink>
            </div>

            <!-- Error State -->
            <div v-else class="card-body text-center space-y-6">
                <!-- Error Icon -->
                <div class="w-16 h-16 mx-auto flex items-center justify-center border-2 border-error rounded-full">
                    <Icon
                        name="lucide:alert-octagon"
                        class="text-error"
                        aria-hidden="true"
                        size="48"
                    />
                </div>

                <!-- Error Message -->
                <div class="space-y-2">
                    <h2 class="text-2xl font-semibold tracking-tight">
                        {{ $t('auth.validateEmail.error.title') }}
                    </h2>
                    <p class="text-sm text-base-content/70 leading-relaxed">
                        {{ error?.message || $t('auth.validateEmail.error.message') }}
                    </p>
                </div>

                <!-- Error Message Box -->
                <div class="alert alert-error">
                    <Icon name="lucide:alert-triangle" class="w-4 h-4" />
                    {{ error?.statusMessage || $t('auth.validateEmail.error.statusMessage') }}
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col w-full gap-3">
                    <button
                        @click="retryValidation"
                        class="btn btn-primary"
                        :disabled="isRetrying"
                    >
                        <span v-if="isRetrying" class="flex items-center gap-2">
                            <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                            {{ $t('auth.validateEmail.error.retrying') }}
                        </span>
                        <span v-else>{{ $t('auth.validateEmail.error.retry') }}</span>
                    </button>

                    <NuxtLink
                        to="/login"
                        class="btn btn-outline"
                    >
                        {{ $t('auth.validateEmail.error.backToLogin') }}
                    </NuxtLink>
                </div>
            </div>
        </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CLICKLAB_PRODUCT_NAME } from '~~/shared/clicklab/brand';

const { t } = useI18n();
const route = useRoute();
const token = route.query.token;
const isRetrying = ref(false);

const { data: validated, error, status, execute } = await useFetch('/api/v1/auth/validate-email', {
    method: 'POST',
    body: { token }
});

const retryValidation = async () => {
    isRetrying.value = true;
    try {
        await execute();
    } catch (e) {
        console.error('Retry validation failed:', e);
    } finally {
        isRetrying.value = false;
    }
};

definePageMeta({
    layout: 'empty'
});

useHead({
    title: `${t('auth.validateEmail.title')} | ${CLICKLAB_PRODUCT_NAME}`,
});
</script>

<style scoped>

</style>