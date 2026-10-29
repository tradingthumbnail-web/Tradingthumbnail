<template>
    <div class="h-full flex flex-col" data-tour="avatar-page">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
                <h1 class="text-2xl font-bold tracking-tight">{{ $t('avatars.title') }}</h1>
                <p class="text-sm text-base-content/50 mt-1.5">{{ $t('avatars.description') }}</p>
            </div>

            <div class="flex items-center gap-3" data-tour="avatar-credits">
                <div v-if="!userStore.hasAvatarCredits" class="tooltip tooltip-left" :data-tip="$t('avatars.creditsTooltip')">
                    <Icon name="lucide:info" size="16" mode="svg" class="text-warning" />
                </div>
                <div class="bg-base-200/60 border border-base-100/10 rounded-xl px-4 py-3 flex items-center gap-4">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon name="lucide:user-circle" size="16" class="text-primary" />
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] uppercase tracking-wider text-base-content/40">{{ $t('avatars.credits') }}</span>
                            <span class="text-sm font-bold tabular-nums">{{ avatarCredits }}</span>
                        </div>
                    </div>
                    <div class="hidden md:block h-2 w-24 bg-base-300/50 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500" :style="{width: `${(avatarCreditsProgress / avatarCreditsMax) * 100}%`}"></div>
                    </div>
                </div>
                
                <button class="btn btn-primary gap-2 shadow-lg hover:shadow-xl transition-shadow" @click="showAvatarCreateModal = true;" 
                :disabled="!userStore.hasAvatarCredits" data-tour="avatar-create">
                    <Icon name="lucide:plus" size="16" mode="svg" />
                    <span>{{ $t('avatars.create.action') }}</span>
                </button>
            </div>
        </div>

        <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div v-for="n in 8" :key="n" class="bg-base-200/60 rounded-2xl overflow-hidden border border-base-100/5">
                <div class="skeleton h-44 w-full rounded-none"></div>
                <div class="p-4 space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="skeleton h-5 w-16 rounded-full"></div>
                        <div class="skeleton h-3 w-3 rounded-full"></div>
                    </div>
                    <div class="skeleton h-4 w-2/3"></div>
                    <div class="skeleton h-9 w-full mt-2 rounded-lg"></div>
                </div>
            </div>
        </div>

        <div v-else-if="error" class="alert alert-error shadow-lg rounded-2xl border border-error/20">
            <Icon name="lucide:alert-circle" size="20" />
            <span>{{ $t('common.errorLoading') }}</span>
        </div>

        <div v-else-if="!avatars?.length" class="card bg-base-200/60 border border-base-100/10 rounded-2xl shadow-lg">
            <div class="card-body py-20 items-center text-center">
                <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-6">
                    <Icon name="lucide:users" size="44" mode="svg" class="text-primary/60" />
                </div>
                <h2 class="text-xl font-bold tracking-tight">{{ $t('avatars.empty.title') }}</h2>
                <p class="text-base-content/50 text-sm max-w-sm mt-2">{{ $t('avatars.empty.description') }}</p>
                <div class="mt-8">
                    <button class="btn btn-primary btn-lg gap-2 shadow-lg hover:shadow-xl transition-shadow" @click="showAvatarCreateModal = true;" :disabled="!userStore.hasAvatarCredits">
                        <Icon name="lucide:plus" size="18" mode="svg" /> {{ $t('avatars.empty.action') }}
                    </button>
                </div>
            </div>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AvatarsAvatarCard
                v-for="av in avatars"
                :key="av.id"
                :avatar="av"
                :hideMenu="isDeleteModalOpen"
                @use="onUse"
                @edit="onEdit"
                @delete="onDelete"
            />
        </div>

        <AvatarsCreateAvatarModal :show="showAvatarCreateModal" @close="showAvatarCreateModal = false" @refresh="refreshAvatars" />

        <BaseModal v-model="isDeleteModalOpen" size="sm">
            <div class="p-6 flex flex-col gap-5">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center flex-shrink-0">
                        <Icon name="lucide:trash-2" size="22" class="text-error" />
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold tracking-tight">{{ $t('avatars.deleteConfirmTitle') }}</h3>
                        <p class="text-sm text-base-content/60 mt-1">
                            {{ $t('avatars.deleteConfirmMessage', { name: avatarToDelete?.name ?? '' }) }}
                        </p>
                    </div>
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <button type="button" class="btn btn-ghost" @click="isDeleteModalOpen = false">
                        {{ $t('common.cancel') }}
                    </button>
                    <button type="button" class="btn btn-error gap-2 shadow-lg" @click="deleteAvatar" :disabled="isDeleting">
                        <span v-if="isDeleting" class="loading loading-spinner loading-sm"></span>
                        <Icon v-else name="lucide:trash-2" size="16" />
                        {{ $t('common.delete') }}
                    </button>
                </div>
            </div>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import type { Avatar } from '~~/server/database/schemas/avatar.schema';
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';

const { t } = useI18n();
const toast = useToast();
const userStore = useUserStore();
const { showAvatarCreateModal } = useAvatar();
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const avatarToDelete = ref<Avatar | null>(null);

const { data: avatars, pending, error, refresh: refreshAvatars } = await useFetch('/api/v1/avatar');

const avatarCredits = computed(() => userStore.user?.avatarCredit ?? 0);
const avatarCreditsMax = computed(() => Math.max(avatarCredits.value, (userStore.tier?.avatarSlots ?? 0)) || 10);
const avatarCreditsProgress = computed(() => Math.min(avatarCredits.value, avatarCreditsMax.value));
const hasTrainingAvatars = computed(() => Boolean(avatars.value?.some((avatar: Avatar) => avatar.status === 'TRAINING')));

let trainingPollTimer: ReturnType<typeof setInterval> | null = null;
let isPollingAvatars = false;

function stopTrainingPoll() {
    if (trainingPollTimer) {
        clearInterval(trainingPollTimer);
        trainingPollTimer = null;
    }
}

function startTrainingPollIfNeeded() {
    if (!hasTrainingAvatars.value) {
        stopTrainingPoll();
        return;
    }
    if (trainingPollTimer) return;
    trainingPollTimer = setInterval(async () => {
        if (!hasTrainingAvatars.value) {
            stopTrainingPoll();
            return;
        }
        if (isPollingAvatars || pending.value) return;
        isPollingAvatars = true;
        try {
            await refreshAvatars();
        } finally {
            isPollingAvatars = false;
        }
    }, 15_000);
}

watch(hasTrainingAvatars, (isTraining) => {
    if (isTraining) {
        startTrainingPollIfNeeded();
    } else {
        stopTrainingPoll();
    }
});

async function onUse(avatar: Avatar) {
    if (avatar.status !== 'TRAINED') return;
    await navigateTo(`/photoshoot?avatarId=${avatar.id}`);
}

async function onEdit(avatar: Avatar) {
    if (avatar.status !== 'TRAINED') return;
    await navigateTo(`/photoshoot?avatarId=${avatar.id}`);
}

async function onDelete(avatar: Avatar) {
    avatarToDelete.value = avatar;
    isDeleteModalOpen.value = true;
}

async function deleteAvatar() {
    if (!avatarToDelete.value || isDeleting.value) return;
    isDeleting.value = true;
    try {
        await $fetch(`/api/v1/avatar/${avatarToDelete.value.id}`, {
            method: 'DELETE'
        });
        await refreshAvatars();
    } catch (e) {
        console.error(e);
        toast.show({
            title: t('common.errors.title'),
            message: t('common.errors.generic'),
            status: 'error',
        });
    } finally {
        isDeleting.value = false;
        isDeleteModalOpen.value = false;
        avatarToDelete.value = null;
    }
}

onMounted(async () => {
    if (!userStore.user) await userStore.getMe();
    startTrainingPollIfNeeded();
});

onBeforeUnmount(() => {
    stopTrainingPoll();
});

useHead({
    title: clicklabPageTitle(t('avatars.title')),
})
</script>

<style scoped>

</style>