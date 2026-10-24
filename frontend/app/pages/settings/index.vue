<template>
    <div class="min-h-[60vh] pb-12">
        <div class="max-w-5xl mx-auto space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl sm:text-3xl font-bold text-base-content">{{ $t('settings.title') }}</h1>
                    <p class="text-sm text-base-content/50 mt-1">{{ $t('settings.description') }}</p>
                </div>
            </div>

            <div v-if="paymentsEnabled" class="card bg-base-200 border border-base-100/10 rounded-2xl shadow-lg">
                <div class="p-6">
                    <h2 class="text-lg font-bold text-base-content mb-5">{{ $t('settings.profile') }}</h2>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div class="form-control">
                            <label class="text-sm font-semibold text-base-content mb-2">{{ $t('settings.name') }}</label>
                            <input v-model="form.name" type="text" class="input input-bordered bg-base-100/50 focus:bg-base-100" placeholder="Your name">
                        </div>
                        <div class="form-control">
                            <label class="text-sm font-semibold text-base-content mb-2">{{ $t('settings.username') }}</label>
                            <input v-model="form.username" type="text" class="input input-bordered bg-base-100/50 focus:bg-base-100" placeholder="username">
                        </div>
                        <div class="form-control sm:col-span-2">
                            <label class="text-sm font-semibold text-base-content mb-2">{{ $t('settings.email') }}</label>
                            <input v-model="form.email" type="email" class="input input-bordered bg-base-100/30 cursor-not-allowed opacity-60" disabled>
                        </div>
                        <div class="form-control">
                            <label class="text-sm font-semibold text-base-content mb-2">{{ $t('settings.locale') }}</label>
                            <select v-model="locale" class="select select-bordered bg-base-100/50 focus:bg-base-100" @change="changeUserLocale(locale)">
                                <option v-for="locale in locales" :value="locale.code" :key="locale.code">{{ locale.name }}</option>
                            </select>
                        </div>
                        <div class="form-control flex items-center justify-center">
                            <label class="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" class="toggle toggle-primary" v-model="form.notifications" />
                                <span class="text-sm font-medium">{{ $t('settings.notifications') }}</span>
                            </label>
                        </div>
                    </div>
                    <div class="flex justify-end mt-6 pt-4 border-t border-base-100/10">
                        <button class="btn btn-primary gap-2" @click="saveProfile">
                            <Icon name="lucide:save" size="16" />
                            {{ $t('common.saveChanges') }}
                        </button>
                    </div>
                    <div class="mt-6 border-t border-base-content/10 pt-4">
                        <div class="collapse collapse-arrow bg-base-100 rounded-box">
                            <input type="checkbox" />
                            <div class="collapse-title font-medium text-base-content">
                                {{ $t('settings.updatePassword') }}
                            </div>
                            <div class="collapse-content">
                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">{{ $t('settings.currentPassword') }}</span>
                                        </label>
                                        <input v-model="passwordForm.currentPassword" type="password" class="input input-bordered w-full" :placeholder="t('settings.currentPassword')" />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">{{ $t('settings.newPassword') }}</span>
                                        </label>
                                        <input v-model="passwordForm.newPassword" type="password" class="input input-bordered w-full" :placeholder="t('settings.newPassword')" />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">{{ $t('settings.repeatNewPassword') }}</span>
                                        </label>
                                        <input v-model="passwordForm.repeatNewPassword" type="password" class="input input-bordered w-full" :placeholder="t('settings.repeatNewPassword')" />
                                    </div>
                                </div>
                                <div class="card-actions justify-end mt-4">
                                    <button class="btn btn-primary btn-sm" :disabled="isUpdatingPassword" @click="updatePassword">
                                        <Icon name="svg-spinners:bars-scale-fade" size="16" mode="svg" v-if="isUpdatingPassword" />
                                        {{ isUpdatingPassword ? $t('common.savingChanges') : $t('settings.updatePassword') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 border-t border-base-content/10 pt-4">
                        <div class="collapse collapse-arrow bg-base-100 rounded-box">
                            <input type="checkbox" />
                            <div class="collapse-title font-medium text-base-content">
                                {{ $t('settings.updatePassword') }}
                            </div>
                            <div class="collapse-content">
                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">{{ $t('settings.currentPassword') }}</span>
                                        </label>
                                        <input v-model="passwordForm.currentPassword" type="password" class="input input-bordered w-full" :placeholder="t('settings.currentPassword')" />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">{{ $t('settings.newPassword') }}</span>
                                        </label>
                                        <input v-model="passwordForm.newPassword" type="password" class="input input-bordered w-full" :placeholder="t('settings.newPassword')" />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">{{ $t('settings.repeatNewPassword') }}</span>
                                        </label>
                                        <input v-model="passwordForm.repeatNewPassword" type="password" class="input input-bordered w-full" :placeholder="t('settings.repeatNewPassword')" />
                                    </div>
                                </div>
                                <div class="card-actions justify-end mt-4">
                                    <button class="btn btn-primary btn-sm" :disabled="isUpdatingPassword" @click="updatePassword">
                                        <Icon name="svg-spinners:bars-scale-fade" size="16" mode="svg" v-if="isUpdatingPassword" />
                                        {{ isUpdatingPassword ? $t('common.savingChanges') : $t('settings.updatePassword') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 border-t border-base-content/10 pt-4">
                        <div class="collapse collapse-arrow bg-base-100 rounded-box">
                            <input type="checkbox" />
                            <div class="collapse-title font-medium text-base-content">
                                {{ $t('settings.updatePassword') }}
                            </div>
                            <div class="collapse-content">
                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">{{ $t('settings.currentPassword') }}</span>
                                        </label>
                                        <input v-model="passwordForm.currentPassword" type="password" class="input input-bordered w-full" :placeholder="t('settings.currentPassword')" />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">{{ $t('settings.newPassword') }}</span>
                                        </label>
                                        <input v-model="passwordForm.newPassword" type="password" class="input input-bordered w-full" :placeholder="t('settings.newPassword')" />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">{{ $t('settings.repeatNewPassword') }}</span>
                                        </label>
                                        <input v-model="passwordForm.repeatNewPassword" type="password" class="input input-bordered w-full" :placeholder="t('settings.repeatNewPassword')" />
                                    </div>
                                </div>
                                <div class="card-actions justify-end mt-4">
                                    <button class="btn btn-primary btn-sm" :disabled="isUpdatingPassword" @click="updatePassword">
                                        <Icon name="svg-spinners:bars-scale-fade" size="16" mode="svg" v-if="isUpdatingPassword" />
                                        {{ isUpdatingPassword ? $t('common.savingChanges') : $t('settings.updatePassword') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card bg-base-200 shadow-md rounded-box">
                <div class="card-body p-6">
                    <h2 class="card-title text-base-content">{{ $t('settings.subscription') }}</h2>
                    <div class="mt-2 text-base-content/80">
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <div class="text-sm">{{ $t('settings.currentPlan') }}</div>
                                <div class="text-lg font-medium">
                                    {{ userTierLabel }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card bg-base-200 border border-base-100/10 rounded-2xl shadow-lg">
                <div class="p-6">
                    <h2 class="text-lg font-bold text-base-content mb-4">{{ $t('settings.subscription') }}</h2>
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-base-100/30 rounded-xl">
                        <div>
                            <div class="text-sm text-base-content/50">{{ $t('settings.currentPlan') }}</div>
                            <div class="text-xl font-bold text-base-content mt-1">{{ userTierLabel }}</div>
                            <div v-if="cycleInfo" class="text-sm text-base-content/50 mt-1">{{ cycleInfo }}</div>
                        </div>
                        <div class="flex gap-2 flex-wrap">
                            <button v-if="paymentsEnabled && userStore.isSubscribed" class="btn btn-ghost btn-sm" @click="manageSubscription">{{ $t('settings.manage') }}</button>
                            <button v-if="paymentsEnabled && userStore.isSubscribed" class="btn btn-error btn-sm" @click="openUnsubscribeModal">{{ $t('settings.unsubscribe') }}</button>
                            <button class="btn btn-primary btn-sm gap-1.5" @click="goToPlans">
                                <Icon name="lucide:crown" size="14" />
                                {{ $t('settings.seePlans') }}
                            </button>
                        </div>
                    </div>

                    <SettingsBillingCard :invoices="invoices" :pending="invoicesPending" :error="invoicesError" :max-items="5" />
                </div>
            </div>

            <div v-if="paymentsEnabled" class="card bg-base-200 border border-base-100/10 rounded-2xl">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-bold text-base-content">{{ $t('billing.title') }}</h2>
                        <NuxtLink to="/settings/plans/billing" class="btn btn-ghost btn-sm gap-1.5 text-base-content/60">
                            {{ $t('common.seeAll') }}
                            <Icon name="lucide:arrow-right" size="14" />
                        </NuxtLink>
                    </div>
                    <SettingsBillingCard :invoices="invoices" :pending="invoicesPending" :error="invoicesError" :max-items="5" />
                </div>
            </div>

            <div class="card bg-base-200 border border-base-100/10 rounded-2xl">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-bold text-base-content">{{ $t('products.title') }}</h2>
                        <NuxtLink to="/settings/products" class="btn btn-ghost btn-sm gap-1.5 text-base-content/60">
                            {{ $t('common.seeAll') }}
                            <Icon name="lucide:arrow-right" size="14" />
                        </NuxtLink>
                    </div>
                    <SettingsProductsCard :products="products" :pending="productsPending" :error="productsError" />
                </div>
            </div>

            <div class="card bg-base-200 border border-base-100/10 rounded-2xl">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-bold text-base-content">{{ $t('settings.recentActivity') }}</h2>
                        <NuxtLink to="/settings/activity" class="btn btn-ghost btn-sm gap-1.5 text-base-content/60">
                            {{ $t('common.seeAll') }}
                            <Icon name="lucide:arrow-right" size="14" />
                        </NuxtLink>
                    </div>
                    <SettingsActivityCard :activities="activity" :pending="activityPending" :error="activityError" />
                </div>
            </div>

            <div class="card bg-base-200 border border-base-100/10 rounded-2xl">
                <div class="p-6">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h2 class="text-lg font-bold text-base-content">{{ $t('common.changelog.title') }}</h2>
                            <p class="text-sm text-base-content/50 mt-1">{{ $t('common.changelog.description') }}</p>
                        </div>
                        <button class="btn btn-primary btn-sm gap-1.5 flex-shrink-0" @click="openChangelog">
                            <Icon name="lucide:sparkles" size="14" />
                            {{ $t('common.changelog.button') }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="card bg-base-200 border border-base-100/10 rounded-2xl">
                <div class="p-6 space-y-3">
                    <h2 class="text-lg font-bold text-base-content">{{ $t('legal.legal') }}</h2>
                    <nav class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <NuxtLink to="/privacy" class="link link-hover">{{ $t('legal.privacy') }}</NuxtLink>
                        <NuxtLink to="/terms" class="link link-hover">{{ $t('legal.terms') }}</NuxtLink>
                        <NuxtLink to="/cookies" class="link link-hover">{{ $t('legal.cookies') }}</NuxtLink>
                        <a :href="`mailto:${supportEmail}`" class="link link-hover">{{ supportEmail }}</a>
                    </nav>
                </div>
            </div>

            <div class="card bg-base-200 border border-error/20 rounded-2xl">
                <div class="p-6">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h2 class="text-lg font-bold text-error">{{ $t('settings.deleteAccount') }}</h2>
                            <p class="text-sm text-base-content/50 mt-1">{{ $t('settings.deleteAccountConfirm') }}</p>
                        </div>
                        <button class="btn btn-error btn-sm flex-shrink-0" @click="openDeleteAccountModal">
                            <Icon name="lucide:trash-2" size="14" />
                            {{ $t('common.delete') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Unsubscribe confirmation modal -->
    <dialog ref="unsubscribeModal" id="unsubscribe-modal" class="modal bg-base-200">
        <div class="modal-box">
            <h3 class="font-semibold text-lg text-base-content">{{ $t('settings.unsubscribe') }}</h3>
            <p class="py-2 text-base-content/70">{{ $t('settings.unsubscribeConfirm') }}</p>
            <div class="modal-action">
                <button class="btn btn-ghost" @click="closeUnsubscribeModal">{{ $t('common.cancel') }}</button>
                <button class="btn btn-error" :disabled="isUnsubscribing" @click="confirmUnsubscribe">
                    <Icon name="svg-spinners:bars-scale-fade" size="16" mode="svg" v-if="isUnsubscribing" />
                    {{ isUnsubscribing ? $t('common.savingChanges') : $t('common.confirm') }}
                </button>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button>{{ $t('common.close') }}</button>
        </form>
    </dialog>

    <!-- Delete account modal -->
    <dialog ref="deleteAccountModal" id="delete-account-modal" class="modal bg-base-200">
        <div class="modal-box">
            <h3 class="font-semibold text-lg text-base-content">{{ $t('settings.deleteAccount') }}</h3>
            <p class="py-2 text-sm text-base-content/70">{{ $t('settings.deleteAccountConfirm') }}</p>
            <input type="text" class="input input-bordered w-full border-base-100 bg-base-100" v-model="confirmDeleteAccountSafetyInput" :placeholder="t('settings.deleteAccountSafetyInputPlaceholder', { deleteAccountSafetyInput: t('settings.deleteAccountSafetyInput') })" />
            <div class="modal-action mt-4">
                <form method="dialog" class="flex items-center gap-2">
                    <button class="btn btn-outline btn-sm border border-base-content/40" @click="closeDeleteAccountModal">{{ $t('common.cancel') }}</button>
                    <button class="btn btn-error btn-sm" @click="confirmDeleteAccount" :disabled="confirmDeleteAccountSafetyInput !== t('settings.deleteAccountSafetyInput', { deleteAccountSafetyInput: t('settings.deleteAccountSafetyInput') })" :class="{ 'opacity-50': confirmDeleteAccountSafetyInput !== t('settings.deleteAccountSafetyInput', { deleteAccountSafetyInput: t('settings.deleteAccountSafetyInput') }) }">{{ $t('common.delete') }}</button>
                </form>
            </div>
        </div>
    </dialog>

    <BaseChangelogModal ref="changelogModalRef" />
</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import type { Product } from '~~/server/database/schemas/product.schema';
import { SUPPORT_EMAIL } from '~~/shared/site';

const { t, setLocale, locale, locales } = useI18n();
const supportEmail = SUPPORT_EMAIL;
const router = useRouter();
const toast = useToast();
const config = useRuntimeConfig();
const paymentsEnabled = computed(() => String(config.public.enablePayments).toLowerCase() === 'true');

const userStore = useUserStore();
const changelogModalRef = ref<{ showModal: () => void; close: () => void } | null>(null);

const openChangelog = () => {
    changelogModalRef.value?.showModal();
};

const { data: invoices, pending: invoicesPending, error: invoicesError } = await useFetch('/api/v1/billing/invoices', {
    immediate: paymentsEnabled.value,
});
const { data: products, pending: productsPending, error: productsError } = await useFetch<Product[]>('/api/v1/product');
const { data: activity, pending: activityPending, error: activityError } = await useFetch('/api/v1/activity', {
    query: {
        limit: 5
    }
});

const form = reactive({
    name: userStore.user?.name ?? '',
    username: userStore.user?.username ?? '',
    email: userStore.user?.email ?? '',
    locale: (userStore.user?.locale as 'en' | 'es' | 'ca' | undefined) ?? 'en',
    notifications: userStore.user?.notifications ?? true,
});

watch(() => userStore.user, (u) => {
    if (!u) return;
    form.name = u.name ?? '';
    form.username = u.username ?? '';
    form.email = u.email ?? '';
    form.locale = (u.locale as any) ?? 'en';
    form.notifications = u.notifications ?? true;
}, { immediate: true });

const isUnsubscribing = ref(false);
const isUpdatingPassword = ref(false);
const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    repeatNewPassword: '',
});

const userTierLabel = computed(() => {
    if (!userStore.subscription) return t('settings.noPlan');
    const tierName = userStore.tier?.name || t('settings.noPlan');
    
    // Show status badge
    if (userStore.subscription.status === 'CANCELLED') {
        return `${tierName} (${t('settings.cancelled')})`;
    } else if (userStore.subscription.status === 'EXPIRED') {
        return `${tierName} (${t('settings.expired')})`;
    }
    return tierName;
});

const cycleInfo = computed(() => {
    if (!userStore.subscription) return t('settings.noCycleInfo');
    
    const startsAt = new Date(userStore.subscription.startsAt);
    const endsAt = new Date(userStore.subscription.endsAt);
    
    if (userStore.subscription.status === 'ACTIVE') {
        return `${t('settings.renewsOn')} ${endsAt.toLocaleDateString()}`;
    } else if (userStore.subscription.status === 'CANCELLED') {
        return `${t('settings.accessUntil')} ${endsAt.toLocaleDateString()}`;
    } else if (userStore.subscription.status === 'EXPIRED') {
        return `${t('settings.expiredOn')} ${endsAt.toLocaleDateString()}`;
    }
    
    return t('settings.noCycleInfo');
});

const saveProfile = async () => {
    toast.show({ title: t('common.saved'), message: t('settings.saveSuccess'), status: 'success' });
};

const updatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.repeatNewPassword) {
        toast.show({ title: t('common.errors.title'), message: t('settings.passwordAllFieldsRequired'), status: 'error' });
        return;
    }

    if (passwordForm.newPassword !== passwordForm.repeatNewPassword) {
        toast.show({ title: t('common.errors.title'), message: t('settings.passwordMismatch'), status: 'error' });
        return;
    }

    if (passwordForm.newPassword.length < 6) {
        toast.show({ title: t('common.errors.title'), message: t('settings.passwordMinLength'), status: 'error' });
        return;
    }

    try {
        isUpdatingPassword.value = true;
        await $fetch('/api/v1/user/password', {
            method: 'POST',
            body: {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                repeatNewPassword: passwordForm.repeatNewPassword,
            },
        });

        passwordForm.currentPassword = '';
        passwordForm.newPassword = '';
        passwordForm.repeatNewPassword = '';

        toast.show({ title: t('common.saved'), message: t('settings.passwordUpdatedSuccess'), status: 'success' });
    } catch (error: any) {
        toast.show({
            title: t('common.errors.title'),
            message: error?.data?.statusMessage || t('common.errors.unknownError'),
            status: 'error'
        });
    } finally {
        isUpdatingPassword.value = false;
    }
};

function goToPlans() {
    router.push('/settings/plans');
}

function manageSubscription() {
    router.push('/settings/plans/billing');
}

// Change user locale
const localeCookie = useCookie<'en' | 'es' | 'ca'>('kithumbs-locale', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
});

const changeUserLocale = async (nextLocale: 'ca' | 'es' | 'en') => {
    localeCookie.value = nextLocale;
    setLocale(nextLocale);
    try {
        await $fetch('/api/v1/user/locale', {
            method: 'POST',
            body: {
                locale: nextLocale,
            },
        });
    } catch (error) {
        console.error(error);
        toast.show({ title: t('common.errors.title'), message: t('common.errors.unknownError'), status: 'warning' });
    }
}

// Delete account modal
const deleteAccountModal = ref<HTMLDialogElement | null>(null);
const confirmDeleteAccountSafetyInput = ref<string>('');
const deleteAccountSafetyInput = ref<string>(t('settings.deleteAccountSafetyInput', { deleteAccountSafetyInput: t('settings.deleteAccount') }));
const isDeletingAccount = ref(false);
function openDeleteAccountModal() {
    deleteAccountModal.value?.showModal();
}

function closeDeleteAccountModal() {
    deleteAccountModal.value?.close();
}

const confirmDeleteAccount = async () => {
    try {
        isDeletingAccount.value = true;
        await $fetch('/api/v1/user/delete-account', {
            method: 'POST',
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.show({ title: t('common.done'), message: t('settings.deleteAccountSuccess'), status: 'info' });
        closeDeleteAccountModal();
        await navigateTo('/login');
    } catch (error) {
        console.error("Error deleting account", error);
        toast.show({ title: t('common.errors.title'), message: t('common.errors.unknownError'), status: 'error' });
    } finally {
        isDeletingAccount.value = false;
    }
}

// Unsubscribe modal
const unsubscribeModal = ref<HTMLDialogElement | null>(null);
function openUnsubscribeModal() {
    unsubscribeModal.value?.showModal();
}

function closeUnsubscribeModal() {
    unsubscribeModal.value?.close();
}

async function confirmUnsubscribe() {
    if (!paymentsEnabled.value) {
        toast.show({ title: t('common.errors.title'), message: 'Payments are temporarily disabled.', status: 'warning' });
        return;
    }
    try {
        isUnsubscribing.value = true;
        await $fetch('/api/v1/billing/unsubscribe', {
            method: 'POST',
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.show({ title: t('common.done'), message: t('settings.unsubscribed'), status: 'info' });
        closeUnsubscribeModal();
        await userStore.getMe({ locale: locale.value });
    } catch (error) {
        console.error(error);
        toast.show({ title: t('common.errors.title'), message: t('common.errors.unknownError'), status: 'error' });
    } finally {
        isUnsubscribing.value = false;
    }
}

useHead({ title: clicklabPageTitle(t('settings.title')) });
onMounted(async () => {
    await userStore.getMe({ locale: locale.value });
});
</script>

<style scoped>

</style>