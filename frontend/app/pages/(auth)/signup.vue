<template>
    <div class="min-h-screen w-screen">
        <div class="grid min-h-screen lg:grid-cols-2">
            <ClickLabAuthMarketingAside
                :title="$t('auth.signup.highlightTitle')"
                :description="$t('auth.signup.highlightCopy')"
                :badge="$t('auth.signup.badge')"
                :bullets="[ $t('auth.signup.bulletOne'), $t('auth.signup.bulletTwo'), $t('auth.signup.bulletThree') ]"
            />

            <div class="flex items-center justify-center px-4 py-10 sm:px-8">
                <div class="w-full max-w-md">
                    <div class="mb-6 flex flex-col items-center gap-3 lg:items-start">
                        <ClickLabSharedLogo class="lg:hidden" />
                        <NuxtLink to="/" class="hidden text-xs text-[var(--cl-text-muted)] hover:text-[var(--cl-neon)] lg:inline-flex">
                            ← Back to landing
                        </NuxtLink>
                    </div>

                    <div class="clicklab-glass rounded-2xl p-6 sm:p-8">
                        <div class="space-y-2">
                            <h1 class="clicklab-display text-2xl font-bold text-white">
                                {{ $t('auth.signup.title') }}
                            </h1>
                            <p class="text-sm leading-relaxed text-[var(--cl-text-muted)]">
                                {{ $t('auth.signup.description') }}
                            </p>
                        </div>

                        <form @submit.prevent="onSubmit" class="mt-6 space-y-5" novalidate>
                            <div class="form-control">
                                <label class="label py-0">
                                    <span class="label-text text-sm font-medium text-white">{{ $t('auth.signup.name') }}</span>
                                </label>
                                <input v-model="form.name" type="text" class="input input-bordered mt-2 w-full border-white/10 bg-black/30"
                                    :placeholder="$t('auth.signup.namePlaceholder')" autocomplete="name" required />
                            </div>

                            <div class="form-control">
                                <label class="label py-0">
                                    <span class="label-text text-sm font-medium text-white">{{ $t('auth.signup.email') }}</span>
                                </label>
                                <input v-model="form.email" type="email" class="input input-bordered mt-2 w-full border-white/10 bg-black/30"
                                    placeholder="you@example.com" autocomplete="email" required />
                            </div>

                            <div class="form-control">
                                <label class="label py-0">
                                    <span class="label-text text-sm font-medium text-white">{{ $t('auth.signup.password') }}</span>
                                </label>
                                <input v-model="form.password" type="password" class="input input-bordered mt-2 w-full border-white/10 bg-black/30"
                                    :placeholder="$t('auth.signup.passwordPlaceholder')" autocomplete="new-password" required />
                            </div>

                            <div class="form-control">
                                <label class="label py-0">
                                    <span class="label-text text-sm font-medium text-white">{{ $t('auth.signup.confirmPassword') }}</span>
                                </label>
                                <input v-model="form.confirmPassword" type="password" class="input input-bordered mt-2 w-full border-white/10 bg-black/30"
                                    :placeholder="$t('auth.signup.confirmPasswordPlaceholder')" autocomplete="new-password" required />
                                <div v-if="form.confirmPassword && !passwordsMatch" class="label mt-1">
                                    <span class="label-text-alt flex items-center gap-1 text-xs text-error">
                                        <Icon name="lucide:alert-circle" class="h-3 w-3" />
                                        {{ $t('auth.signup.passwordMismatch') }}
                                    </span>
                                </div>
                            </div>

                            <label class="flex cursor-pointer items-start gap-2 text-sm text-[var(--cl-text-muted)]">
                                <input v-model="form.agree" type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-0.5" />
                                <span>
                                    {{ $t('auth.signup.agreeTerms') }}
                                    <NuxtLink to="/terms" class="text-primary hover:underline">{{ $t('legal.terms') }}</NuxtLink>
                                    {{ $t('auth.signup.and') }}
                                    <NuxtLink to="/privacy" class="text-primary hover:underline">{{ $t('legal.privacy') }}</NuxtLink>
                                </span>
                            </label>

                            <button type="submit" class="clicklab-btn-primary w-full" :disabled="isSubmitting">
                                <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
                                <span>{{ $t('auth.signup.createAccount') }}</span>
                            </button>
                        </form>

                        <p class="mt-6 text-center text-sm text-[var(--cl-text-muted)]">
                            {{ $t('auth.signup.haveAccount') }}
                            <NuxtLink to="/login" class="font-medium text-primary hover:underline">
                                {{ $t('auth.signup.signIn') }}
                            </NuxtLink>
                        </p>
                    </div>

                    <ClickLabAuthLegalFooter />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CLICKLAB_PRODUCT_NAME } from '~~/shared/clicklab/brand';

const { locale, t } = useI18n()

const toast = useToast()
const isSubmitting = ref(false)
const form = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agree: false,
    userLocale: locale.value,
})

const passwordsMatch = computed(() => {
    return form.confirmPassword === '' || form.password === form.confirmPassword
})

useHead({
    title: `Sign Up | ${CLICKLAB_PRODUCT_NAME}`,
})

definePageMeta({
    layout: 'empty',
})

function validate() {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
        toast.show({
            title: 'Incomplete',
            message: 'Please fill in all required fields.',
            status: 'warning',
        })
        return false
    }

    if (form.password !== form.confirmPassword) {
        toast.show({
            title: 'Password mismatch',
            message: 'Passwords do not match. Please try again.',
            status: 'error',
        })
        return false
    }

    if (!form.agree) {
        toast.show({
            title: 'Terms',
            message: 'Please accept the terms to continue.',
            status: 'info',
        })
        return false
    }

    return true
}

async function onSubmit() {
    if (!validate()) return

    isSubmitting.value = true
    try {
        await $fetch('/api/v1/auth/signup', {
            method: 'POST',
            body: form,
        })
        toast.show({
            title: t('auth.signup.success.title'),
            message: t('auth.signup.success.message'),
            status: 'success',
        });
        await navigateTo('/login');
    } catch (error) {
        toast.show({
            title: t('auth.signup.error.title'),
            message: t('auth.signup.error.message'),
            status: 'error',
        });
    } finally {
        isSubmitting.value = false
    }
}

</script>
