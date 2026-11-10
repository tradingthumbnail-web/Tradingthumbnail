<template>
    <section data-tour="home-activity" class="space-y-4">
        <div class="flex items-center justify-between gap-3">
            <div>
                <h2 class="clicklab-display text-lg font-semibold text-white">{{ $t('activity.title') || 'Recent Activity' }}</h2>
                <p class="mt-1 text-sm text-[var(--cl-text-muted)]">{{ $t('activity.description') || 'Your latest generations and actions.' }}</p>
            </div>
            <NuxtLink to="/settings/activity" class="clicklab-btn-secondary !px-3 !py-1.5 !text-xs">
                {{ $t('common.viewAll') || 'View all' }}
                <Icon name="lucide:arrow-right" size="14" />
            </NuxtLink>
        </div>

        <div v-if="pending && !activities?.length" class="space-y-2">
            <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-xl bg-white/5" />
        </div>

        <div v-else-if="error" class="clicklab-dashboard-card border border-red-500/20 p-4">
            <p class="text-xs text-red-200/80">{{ $t('activity.errors.unableToLoadActivity') || 'Unable to load recent activity' }}</p>
        </div>

        <div v-else-if="!activities?.length" class="clicklab-dashboard-card p-6 text-center">
            <p class="text-sm text-[var(--cl-text-muted)]">{{ $t('activity.noActivity') || 'No recent activity recorded.' }}</p>
        </div>

        <div v-else class="clicklab-dashboard-card divide-y divide-white/5 overflow-hidden">
            <div
                v-for="act in normalized"
                :key="act.id"
                class="flex items-center justify-between gap-4 p-3.5 transition-colors hover:bg-white/[0.02]"
            >
                <div class="flex items-center gap-3 min-w-0">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[var(--cl-neon)]">
                        <Icon name="lucide:activity" size="16" />
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-white truncate">
                            {{ $t(`eventTypes.${act.eventType}`) || act.eventType }}
                        </p>
                        <p class="text-xs text-[var(--cl-text-muted)]">
                            <span class="capitalize">{{ act.targetType.toLowerCase() }}</span>
                            <span v-if="act.targetId && act.targetId !== '-'"> · #{{ act.targetId.slice(0, 8) }}</span>
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                    <span class="text-xs text-[var(--cl-text-muted)]">{{ formatDate(act.createdAt) }}</span>
                    <NuxtLink
                        v-if="act.targetType === 'IMAGE' && act.targetId && act.targetId !== '-'"
                        :to="`/images/${act.targetId}`"
                        class="btn btn-ghost btn-xs btn-circle text-[var(--cl-text-muted)] hover:text-white"
                        title="View image"
                    >
                        <Icon name="lucide:external-link" size="14" />
                    </NuxtLink>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
type ActivityItem = {
    id: number;
    eventType: string;
    targetType: string;
    targetId: string;
    createdAt: string | Date | null;
};

const { data: rawActivities, pending, error } = useLazyFetch<any[]>('/api/v1/activity', {
    query: { limit: 5 },
});

const activities = computed(() => (Array.isArray(rawActivities.value) ? rawActivities.value : []));

const normalized = computed<ActivityItem[]>(() => {
    return activities.value.map((a: any) => ({
        id: a.id,
        eventType: a.eventType ?? a.event_type ?? 'action',
        targetType: a.targetType ?? a.target_type ?? 'ITEM',
        targetId: a.targetId ?? a.target_id ?? '-',
        createdAt: a.createdAt ?? a.created_at ?? null,
    }));
});

function formatDate(dt: string | Date | null): string {
    if (!dt) return '';
    try {
        return new Date(dt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
}
</script>
