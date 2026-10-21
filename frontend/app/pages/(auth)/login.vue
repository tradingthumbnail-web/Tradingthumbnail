<template>
    <div class="min-h-screen w-screen overflow-x-hidden">
        <div class="grid min-h-screen lg:grid-cols-2">
            <ClickLabAuthMarketingAside
                :title="$t('auth.login.title')"
                :description="$t('auth.login.description')"
                badge="ClickLab"
                :bullets="marketingBullets"
            />

            <div class="flex items-center justify-center px-6 py-12 lg:px-16">
                <div class="w-full max-w-sm">
                    <div class="mb-6 flex flex-col items-center gap-3 lg:items-start">
                        <ClickLabSharedLogo class="lg:hidden" />
                        <NuxtLink to="/" class="hidden text-xs text-[var(--cl-text-muted)] hover:text-[var(--cl-neon)] lg:inline-flex">
                            ← Back to landing
                        </NuxtLink>
                    </div>

                    <div class="mb-6 text-center lg:text-left">
                        <h1 class="clicklab-display text-2xl font-bold text-white">{{ $t('auth.login.title') }}</h1>
                        <p class="mt-1 text-sm text-[var(--cl-text-muted)]">{{ $t('auth.login.description') }}</p>
                    </div>

                    <ClickLabSharedSimulatedNotice
                        compact
                        label="Studio demo"
                        message="Try /studio without signing in. Sign in here for real account features when your backend is configured."
                        class="mb-5"
                    />

                    <form @submit.prevent="onSubmit" class="space-y-5" novalidate>
                        <div class="form-control">
                            <label class="mb-2 text-sm font-semibold text-white">{{ $t('auth.login.email') }}</label>
                            <input
                                v-model="form.email"
                                type="email"
                                placeholder="you@example.com"
                                class="input input-bordered w-full border-white/10 bg-black/30"
                                required
                                aria-label="Email address"
                                autocomplete="email"
                            />
                        </div>

                        <div class="form-control">
                            <label class="mb-2 text-sm font-semibold text-white">{{ $t('auth.login.password') }}</label>
                            <input
                                v-model="form.password"
                                type="password"
                                placeholder="••••••••"
                                class="input input-bordered w-full border-white/10 bg-black/30"
                                required
                                aria-label="Password"
                                autocomplete="current-password"
                            />
                            <div class="mt-2 flex justify-end">
                                <button type="button" class="text-sm text-primary hover:text-primary/80" @click="isResetPasswordModalOpen = true">{{ $t('auth.login.forgotPassword') }}</button>
                            </div>
                        </div>

                        <div class="flex items-center justify-between py-1">
                            <label class="flex cursor-pointer items-center gap-2.5">
                                <input type="checkbox" v-model="form.remember" class="checkbox checkbox-sm checkbox-primary" aria-label="Remember me" />
                                <span class="text-sm text-[var(--cl-text-muted)]">{{ $t('auth.login.remember') }}</span>
                            </label>
                            <NuxtLink v-if="isSignInEnabled" to="/signup" class="text-sm font-medium text-primary hover:text-primary/80">{{ $t('auth.login.createAccount') }}</NuxtLink>
                        </div>

                        <button type="submit" class="clicklab-btn-primary h-12 w-full text-base" aria-label="Sign in">
                            <Icon name="lucide:log-in" size="18" />
                            {{ $t('auth.login.signIn') }}
                        </button>

                        <button
                            type="button"
                            class="clicklab-btn-ghost h-12 w-full text-base"
                            aria-label="Demo sign in for UI preview"
                            @click="onDemoSignIn"
                        >
                            <Icon name="lucide:monitor-smartphone" size="18" />
                            Demo sign in (UI only)
                        </button>
                    </form>

                    <div class="divider my-8 text-xs text-[var(--cl-text-muted)]">OR</div>

                    <div v-if="isSignInEnabled" class="flex justify-center">
                        <GoogleSignInButton style="color-scheme: auto;" @success="googleLoginHandleSuccess" @error="googleLoginHandleError" />
                    </div>

                    <ClickLabAuthLegalFooter />
                </div>
            </div>
        </div>

        <dialog :open="isResetPasswordModalOpen" @close="isResetPasswordModalOpen = false" class="modal">
            <div class="modal-box clicklab-glass border border-white/10 bg-[var(--cl-bg-elevated)]">
                <h3 class="clicklab-display text-lg font-bold text-white">{{ $t('auth.resetPassword.title') }}</h3>
                <p class="py-3 text-sm text-[var(--cl-text-muted)]">{{ $t('auth.resetPassword.description') }}</p>
                <form @submit.prevent="resetPassword">
                    <div class="form-control mb-5">
                        <label class="mb-2 text-sm font-semibold text-white">{{ $t('auth.resetPassword.email') }}</label>
                        <input type="email" v-model="form.email" class="input input-bordered w-full border-white/10 bg-black/30" required />
                    </div>
                    <div class="flex items-center justify-end gap-3">
                        <button type="button" class="btn btn-ghost" @click="isResetPasswordModalOpen = false">{{ $t('common.cancel') }}</button>
                        <button type="submit" class="clicklab-btn-primary !py-2">{{ $t('auth.resetPassword.reset') }}</button>
                    </div>
                </form>
            </div>
            <form method="dialog" class="modal-backdrop bg-black/70">
                <button @click="isResetPasswordModalOpen = false">close</button>
            </form>
        </dialog>
    </div>
</template>

<script setup lang="ts">
import {
    GoogleSignInButton,
    type CredentialResponse,
} from "vue3-google-signin";
import { CLICKLAB_PRODUCT_NAME } from '~~/shared/clicklab/brand';
import { sanitizeInternalRedirect } from '~~/shared/clicklab/safe-redirect';

useHead({
    title: `Login | ${CLICKLAB_PRODUCT_NAME}`,
});

definePageMeta({
    layout: 'empty',
});

const { t, locale } = useI18n();
const toast = useToast();
const config = useRuntimeConfig();
const form = reactive({
    email: '',
    password: '',
    remember: false,
});

const route = useRoute();
const { signInDemoUi } = useDemoAuth();

const postLoginTarget = computed(() =>
    sanitizeInternalRedirect(
        typeof route.query.redirect === 'string' ? route.query.redirect : undefined,
        '/home',
    ),
);

const isResetPasswordModalOpen = ref(false);

async function onDemoSignIn() {
    // Demo UI is for exploring the dashboard — ignore ?redirect=/studio from marketing CTAs.
    await signInDemoUi('/home');
}
const isSignInEnabled = computed(() => {
    const value = config.public.enableSignIn;
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        return value.toLowerCase() !== 'false';
    }
    return true;
});

const marketingBullets = computed(() => {
    const lang = (locale.value || '').toLowerCase();
    switch (lang) {
        case 'es':
            return [
                'Miniaturas orientadas al trading con presets por nicho.',
                'Estudio demo en /studio sin iniciar sesión.',
                'Tras iniciar sesión, accede al workspace completo en /home.',
            ];
        case 'ca':
            return [
                'Miniatures orientades al trading amb presets per nínxol.',
                'Estudi demo a /studio sense iniciar sessió.',
                'Després d’iniciar sessió, accedeix al workspace complet a /home.',
            ];
        default:
            return [
                'Trading-focused thumbnails with niche-aware presets.',
                'Try the browser-only demo studio at /studio anytime.',
                'After sign-in, open your full workspace at /home.',
            ];
    }
});

interface RememberMe {
    remember: boolean;
    email: string;
};

watch(() => form.remember, (remember) => {
    if (remember) {
        localStorage.setItem('rememberMe', JSON.stringify({ remember: true, email: form.email }));
    } else {
        localStorage.removeItem('rememberMe');
    }
});

watch(() => form.email, (email) => {
    if (form.remember) {
        localStorage.setItem('rememberMe', JSON.stringify({ remember: true, email }));
    }
});

async function onSubmit() {
    if (!form.email || !form.password) {
        toast.show({
            title: t('auth.login.error.title'),
            message: t('auth.login.error.messageRequired'),
            status: 'error',
        })
        return
    };

    try {
        await $fetch('/api/v1/auth/login', {
            method: 'POST',
            body: form,
        });
        toast.show({
            title: t('auth.login.success.title'),
            message: t('auth.login.success.message'),
            status: 'success',
        })
        await navigateTo(postLoginTarget.value);
    } catch (error) {
        toast.show({
            title: t('auth.login.error.title'),
            message: t('auth.login.error.message'),
            status: 'error',
        })
    }
}

const googleLoginHandleSuccess = async (response: CredentialResponse) => {
    const { credential } = response;
    try {
        await $fetch('/api/v1/auth/google/validate-token', {
            method: 'POST',
            body: {
                token: credential
            }
        });
        await navigateTo(postLoginTarget.value);
    } catch (error) {
        console.error(error);
        toast.show({
            title: t('auth.login.googleError.title'),
            message: t('auth.login.googleError.message'),
            status: 'error',
        })
    }
};

const googleLoginHandleError = (error: unknown) => {
    console.error(error);
    toast.show({
        title: t('auth.login.googleError.title'),
        message: t('auth.login.googleError.message'),
        status: 'error',
    })
};

const resetPassword = async () => {
    if (!form.email) {
        toast.show({
            title: t('auth.login.error.title'),
            message: t('auth.login.error.messageRequired'),
            status: 'error',
        })
        return
    }

    try {
        await $fetch('/api/v1/auth/generate-reset-password-token', {
            method: 'POST',
            body: {
                email: form.email,
            }
        });
        isResetPasswordModalOpen.value = false;
        toast.show({
            title: t('auth.resetPassword.sentEmail'),
            message: t('auth.resetPassword.sentEmailMessage'),
            status: 'success',
        });
    } catch (error) {
        console.error(error);
        isResetPasswordModalOpen.value = false;
        toast.show({
            title: t('auth.resetPassword.error.title'),
            message: t('auth.resetPassword.error.messageResetPassword'),
            status: 'error',
        })
    }
};

onMounted(() => {
    const stored = JSON.parse(localStorage.getItem('rememberMe') || 'null') as RememberMe | null;
    if (stored?.remember) {
        form.remember = true;
        form.email = stored.email || '';
    }
});
</script>
