<template>
    <div class="form-control flex flex-col gap-2">
        <label class="label">
            <span class="label-text text-sm font-medium">{{ $t('photoshoot.selectAvatar') }}</span>
        </label>
        <div class="flex items-center gap-2">
            <BaseKiThumbsImage v-if="currentAvatar" :src="`/api/v1/avatar/${currentAvatar.id}/training-image`" alt="Avatar Training Image" class="max-w-10 max-h-10 rounded-full" />
            <span v-else class="w-10 h-10 rounded-full bg-base-100 border border-base-content/40 flex items-center justify-center">
                <Icon name="lucide:scan-face" size="24" class="text-base-content/40" />
            </span>
            <select class="select select-bordered bg-base-100 flex-1" v-model="selectedId">
                <option disabled value="">{{ $t('photoshoot.selectAvatar') }}</option>
                <option
                    v-for="avatar in avatars"
                    :key="avatar.id"
                    :value="avatar.id"
                    :disabled="avatar.status && avatar.status !== 'TRAINED'"
                >{{ avatar.name }}</option>
            </select>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Avatar } from '~~/server/database/schemas/avatar.schema';

const props = defineProps<{
    avatars: Avatar[] | any;
    avatarId: string | null;
}>();

const emit = defineEmits<{
    (e: 'update:avatarId', value: string): void;
}>();

const selectedId = ref<string | null>(props.avatarId ?? null);
const currentAvatar = computed<Avatar | null>(() => {
    if (!props.avatars || !selectedId.value) return null;
    return props.avatars.find((a: Avatar) => a.id === selectedId.value) || null;
});

watch(() => props.avatarId, (newAvatarId) => {
    selectedId.value = newAvatarId ?? null;
}, { immediate: true });

watch(selectedId, (newId) => {
    emit('update:avatarId', newId ?? '');
});
</script>

<style scoped>

</style>