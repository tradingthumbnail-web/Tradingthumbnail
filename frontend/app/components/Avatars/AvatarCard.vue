<template>
    <div class="group card bg-base-200/60 rounded-2xl overflow-visible hover:shadow-2xl hover:bg-base-200/80 transition-all duration-300 border border-base-100/5 hover:border-base-100/15">
        <div class="relative">
            <div class="aspect-[4/3] w-full bg-base-300/30 overflow-hidden rounded-t-2xl">
                <BaseKiThumbsImage :src="`/api/v1/avatar/${avatar.id}/training-image`" alt="Avatar Training Image" :container-class="'group-hover:scale-105 transition-transform duration-500'" />
                <div class="absolute inset-0 bg-gradient-to-t from-base-300/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div class="absolute top-3 right-3">
                <span class="badge bg-base-100/90 backdrop-blur-sm border-0 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.5">{{ genderLabel }}</span>
            </div>

            <div class="absolute bottom-3 left-3 flex items-center gap-2 bg-base-100/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
                <span :class="['w-2.5 h-2.5 rounded-full', statusDotClass]" />
                <span class="text-xs font-semibold">{{ statusLabel }}</span>
            </div>
        </div>

        <div class="p-4 pt-3.5">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                    <h3 class="text-sm font-bold truncate tracking-tight">{{ avatar.name }}</h3>
                    <div class="text-[11px] text-base-content/40 mt-0.5 flex items-center gap-1.5">
                        <Icon name="lucide:calendar" size="11" />
                        {{ createdAtLabel }}
                    </div>
                </div>

                <div v-if="!hideMenu" class="dropdown dropdown-end">
                    <button tabindex="0" class="btn btn-ghost btn-xs btn-circle hover:bg-base-100/50" aria-label="Menu">
                        <Icon name="lucide:more-vertical" size="14" mode="svg" />
                    </button>
                    <ul class="dropdown-content menu bg-base-100/95 backdrop-blur-xl rounded-xl z-[9999] w-40 p-1.5 shadow-2xl border border-base-100/20">
                        <li><button class="rounded-lg text-sm py-2" :disabled="!isTrained" @click="handleUse">
                                <Icon name="lucide:play" size="14" mode="svg" class="text-primary" /> {{ $t('avatars.use') }}
                            </button></li>
                        <li><button class="rounded-lg text-sm py-2 text-error hover:bg-error/10" @click="$emit('delete', avatar)">
                                <Icon name="lucide:trash-2" size="14" mode="svg" /> {{ $t('common.delete') }}
                            </button></li>
                    </ul>
                </div>
            </div>

            <div v-if="avatar.trainingMetadata && avatar.status !== 'TRAINED'" class="mt-3.5">
                <div class="flex items-center justify-between text-[11px] text-base-content/50 mb-1.5">
                    <span class="font-medium uppercase tracking-wide">{{ $t('avatars.training') }}</span>
                    <span class="font-bold tabular-nums text-primary">{{ trainingProgress }}%</span>
                </div>
                <div class="h-1.5 w-full bg-base-300/50 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-primary via-primary to-secondary rounded-full transition-all duration-700 ease-out" :style="{width: `${trainingProgress}%`}"></div>
                </div>
            </div>

            <div class="mt-4">
                <button
                    class="btn btn-primary btn-sm w-full gap-2 shadow-lg hover:shadow-xl transition-all duration-200 text-[13px] font-semibold"
                    :disabled="!isTrained"
                    @click="handleUse"
                >
                    <Icon name="lucide:sparkles" size="15" mode="svg" />
                    <span>{{ $t('avatars.use') }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Avatar } from '~~/server/database/schemas/avatar.schema';

const { t } = useI18n();
const props = defineProps<{ avatar: Avatar | any; hideMenu?: boolean }>();
const isAvatarSendingModalOpen = ref(false);

const emit = defineEmits<{
    (e: 'use', avatar: Avatar): void;
    (e: 'edit', avatar: Avatar): void;
    (e: 'delete', avatar: Avatar): void;
}>();

const isTrained = computed(() => props.avatar?.status === 'TRAINED');

function handleUse() {
    if (!isTrained.value) return;
    emit('use', props.avatar);
}

const statusLabel = computed(() => {
    const labels: Record<string, string> = {
        TRAINED: t('avatars.statuses.trained'),
        TRAINING: t('avatars.statuses.training'),
        FAILED: t('avatars.statuses.failed'),
    };
    return labels[props.avatar.status] ?? props.avatar.status;
});

const statusBadgeClass = computed(() => {
    switch (props.avatar.status) {
        case 'TRAINED':
            return 'badge-success';
        case 'TRAINING':
            return 'badge-warning';
        case 'FAILED':
            return 'badge-error';
        default:
            return 'badge-ghost';
    }
});

const statusDotClass = computed(() => {
    switch (props.avatar.status) {
        case 'TRAINED':
            return 'bg-success';
        case 'TRAINING':
            return 'bg-warning animate-pulse';
        case 'FAILED':
            return 'bg-error';
        default:
            return 'bg-base-content/30';
    }
});

const genderLabel = computed(() => {
    const g = props.avatar.gender;
    if (!g) return '—';
    return g.charAt(0) + g.slice(1).toLowerCase();
});

const createdAtLabel = computed(() => {
    try {
        const date = props.avatar.createdAt ? new Date(props.avatar.createdAt as unknown as string) : null;
        return date ? date.toLocaleDateString() : '';
    } catch {
        return '';
    }
});

const trainingProgress = computed(() => {
    const meta = props.avatar.trainingMetadata as any;
    const steps = Number(meta?.trainingSteps || 0);
    const epochs = Number(meta?.trainingEpochs || 0);
    const max = steps || epochs || 100;
    // This is a placeholder visual; backend can provide precise progress later
    return Math.min(100, Math.max(0, Math.round((steps || epochs) ? 70 : 30)));
});
</script>

<style scoped></style>
