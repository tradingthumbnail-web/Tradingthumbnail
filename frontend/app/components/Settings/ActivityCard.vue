<template>
    <div class="card bg-base-100 shadow-md rounded-box">
        <div class="card-body p-6">
            <div v-if="error" role="alert" class="alert alert-error mt-4">
                <span>{{ $t('activity.errors.unableToLoadActivity') }}</span>
            </div>

            <div v-else-if="pending" class="mt-4 space-y-3">
                <div class="skeleton h-12 w-full"></div>
                <div class="skeleton h-12 w-full"></div>
                <div class="skeleton h-12 w-full"></div>
            </div>

            <div v-else-if="!hasActivity" class="mt-4 text-base-content/70 text-sm">
                {{ $t('activity.noActivity') }}
            </div>

            <div v-else class="mt-4 overflow-x-auto">
                <table class="table">
                    <thead>
                        <tr>
                            <th>{{ $t('activity.id') }}</th>
                            <th>{{ $t('activity.event') }}</th>
                            <th>{{ $t('activity.target') }}</th>
                            <th>{{ $t('activity.date') }}</th>
                            <th>{{ $t('activity.targetPreview') }}</th>
                            <th class="text-right">{{ $t('activity.actions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="a in normalized" :key="a.id" class="hover align-top">
                            <td class="font-medium">#{{ a.id }}</td>
                            <td>
                                <span class="badge badge-info">{{ $t(`eventTypes.${a.eventType}`) }}</span>
                            </td>
                            <td>
                                <span :class="['badge', targetTypeClass(a.targetType)]">{{ a.targetType }}</span>
                            </td>
                            <td>{{ formatDate(a.createdAt) }}</td>
                            <td class="max-w-[200px]">
                                <BaseKiThumbsImage 
                                    :src="`/api/v1/image/${a.targetId}/view`"
                                    :alt="a.targetId"
                                    :container-class="'w-full h-full object-cover'"
                                />
                            </td>
                            <td class="text-right">
                                <div class="join justify-end">
                                    <button class="btn btn-secondary btn-xs join-item" @click="toggleDetails(a.id)">
                                        <Icon name="lucide:info" size="16" mode="svg" />
                                        <span>{{ $t('common.details') }}</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-for="a in normalized" :key="`details-${a.id}`" v-show="expanded.has(a.id)" class="bg-base-200">
                            <td colspan="8">
                                <div class="p-4">
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div class="space-y-1">
                                            <div class="text-xs opacity-60">{{ $t('activity.project') }}</div>
                                            <div class="text-sm break-all">{{ a.projectId || '-' }}</div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-xs opacity-60">{{ $t('activity.user') }}</div>
                                            <div class="text-sm break-all">{{ a.userId || '-' }}</div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-xs opacity-60">{{ $t('activity.target') }}</div>
                                            <div class="text-sm">{{ a.targetType }} · <span class="font-mono text-xs break-all">{{ a.targetId }}</span></div>
                                        </div>
                                        <div class="space-y-1 md:col-span-3">
                                            <div class="text-xs opacity-60">{{ $t('activity.payload') }}</div>
                                            <div class="text-sm">
                                                <pre class="whitespace-pre-wrap text-xs bg-base-300 rounded p-3 overflow-x-auto">{{ formatPayload(a.payload) }}</pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { EventType } from "~~/shared/event-types";

type TargetType = "IMAGE" | "PROJECT" | "BRANCH" | "STYLE";

type Activity = {
    id: number;
    projectId: string | null;
    userId: string | null;
    targetType: TargetType;
    targetId: string;
    eventType: EventType | string;
    payload: Record<string, any>;
    createdAt: string | Date;
};

const props = defineProps<{
    activities?: unknown;
    pending?: boolean;
    error?: any;
}>();

const hasActivity = computed(() => Array.isArray(props.activities) && props.activities.length > 0);

const normalized = computed(() => {
    if (!Array.isArray(props.activities)) return [] as Activity[];
    return (props.activities as any[]).map((a: any) => ({
        id: a.id,
        projectId: a.projectId ?? null,
        userId: a.userId ?? null,
        targetType: (a.targetType ?? 'IMAGE') as TargetType,
        targetId: a.targetId ?? '-',
        eventType: a.eventType ?? 'image.generated',
        payload: a.payload ?? {},
        createdAt: a.createdAt ?? a.created_at ?? null,
    })) as Activity[];
});

const expanded = ref<Set<number>>(new Set());
function toggleDetails(id: number) {
    const next = new Set(expanded.value);
    if (next.has(id)) next.delete(id); else next.add(id);
    expanded.value = next;
}

function formatDate(value: string | Date | null) {
    if (!value) return '-';
    try {
        const date = typeof value === 'string' ? new Date(value) : value;
        return date.toLocaleString();
    } catch {
        return '-';
    }
}

function formatPayload(meta: Record<string, any>) {
    try {
        return JSON.stringify(meta ?? {}, null, 2);
    } catch {
        return String(meta ?? '');
    }
}

function targetTypeClass(target: TargetType) {
    switch (target) {
        case 'IMAGE':
            return 'badge-primary';
        case 'PROJECT':
            return 'badge-secondary';
        case 'BRANCH':
            return 'badge-accent';
        case 'STYLE':
            return 'badge-neutral';
        default:
            return 'badge-ghost';
    }
}
</script>

<style scoped>

</style>

