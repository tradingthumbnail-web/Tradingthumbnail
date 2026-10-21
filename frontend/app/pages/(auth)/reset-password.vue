<template>
    <div class="flex min-h-screen items-center justify-center px-4 py-10">
        <div class="w-full max-w-md">
            <div class="mb-6 flex flex-col items-center gap-3">
                <ClickLabSharedLogo />
                <NuxtLink to="/login" class="text-xs text-[var(--cl-text-muted)] hover:text-[var(--cl-neon)]">
                    ← Back to sign in
                </NuxtLink>
            </div>

            <div class="clicklab-glass rounded-2xl p-6 sm:p-8">
                <div class="mb-6 text-center">
                    <h1 class="clicklab-display text-2xl font-bold text-white">
                        {{ $t('auth.resetPassword.title') }}
                    </h1>
                    <p class="mt-2 text-sm text-[var(--cl-text-muted)]">
                        {{ $t('auth.resetPassword.description') }}
                    </p>
                </div>

                <form @submit.prevent="onSubmit" class="space-y-4" novalidate>
                    <div class="form-control">
                        <label class="label py-0">
                            <span class="label-text text-white">{{ $t('auth.resetPassword.newPassword') }}</span>
                        </label>
                        <input v-model="form.password" type="password" :placeholder="$t('auth.resetPassword.newPassword')"
                            class="input input-bordered mt-2 w-full border-white/10 bg-black/30" required aria-label="New password"
                            autocomplete="new-password" />
                    </div>

                    <div class="form-control">
                        <label class="label py-0">
                            <span class="label-text text-white">{{ $t('auth.resetPassword.confirmPassword') }}</span>
                        </label>
                        <input v-model="form.confirmPassword" type="password" :placeholder="$t('auth.resetPassword.confirmPassword')"
                            class="input input-bordered mt-2 w-full border-white/10 bg-black/30" required aria-label="Confirm new password"
                            autocomplete="new-password" />
                    </div>

                    <button type="submit" class="clicklab-btn-primary w-full">
                        {{ $t('auth.resetPassword.reset') }}
                    </button>
                </form>
            </div>

            <ClickLabAuthLegalFooter />
        </div>
    </div>
</template>

<script setup lang="ts">
import { CLICKLAB_PRODUCT_NAME } from '~~/shared/clicklab/brand';

const { t } = useI18n();

useHead({
    title: `${t('auth.resetPassword.title')} | ${CLICKLAB_PRODUCT_NAME}`,
});

definePageMeta({
    layout: 'empty',
});

const toast = useToast();
const form = reactive({
    password: '',
    confirmPassword: '',
});

async function onSubmit() {
    if (!form.password || !form.confirmPassword) {
        toast.show({
            title: t('auth.resetPassword.error.title'),
            message: t('auth.resetPassword.error.messageRequired'),
            status: 'error',
        });
        return;
    }

    if (form.password !== form.confirmPassword) {
        toast.show({
            title: t('auth.resetPassword.error.title'),
            message: t('auth.resetPassword.error.messageMismatch'),
            status: 'error',
        });
        return;
    }

    if (form.password.length < 8) {
        toast.show({
            title: t('auth.resetPassword.error.title'),
            message: t('auth.resetPassword.error.messageLength'),
            status: 'error',
        });
        return;
    }

    try {
        const route = useRoute();
        const token = route.query.token as string;

        if (!token) {
            toast.show({
                title: t('auth.resetPassword.error.title'),
                message: t('auth.resetPassword.error.messageInvalidLink'),
                status: 'error',
            });
            return;
        }

        await $fetch('/api/v1/auth/change-password', {
            method: 'POST',
            body: {
                token,
                password: form.password,
            },
        });
        toast.show({
            title: t('auth.resetPassword.success.title'),
            message: t('auth.resetPassword.success.message'),
            status: 'success',
        });
        await navigateTo('/login');
    } catch (error) {
        console.error(error);
        toast.show({
            title: t('auth.resetPassword.error.title'),
            message: t('auth.resetPassword.error.message'),
            status: 'error',
        });
    }
}
</script>
