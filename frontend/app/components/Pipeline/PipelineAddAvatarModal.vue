<template>
    <BaseModal :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" size="lg">
        <div class="p-6 flex flex-col gap-6 max-h-[85vh]">
            <div class="flex items-center justify-between flex-shrink-0">
                <h3 class="text-xl font-semibold">{{ $t('pipeline.addAvatar.title') }}</h3>
                <button type="button" class="btn btn-ghost btn-sm btn-circle" @click="$emit('update:modelValue', false)">
                    <Icon name="lucide:x" class="w-4 h-4" />
                </button>
            </div>

            <div class="form-control flex flex-col gap-2 flex-shrink-0">
                <label class="label">
                    <span class="label-text font-medium">{{ $t('pipeline.addAvatar.characterType') }}</span>
                </label>
                <div class="flex gap-2">
                    <label 
                        class="flex-1 cursor-pointer border rounded-box p-4 transition-all"
                        :class="characterType === 'avatar' ? 'border-primary bg-primary/10' : 'border-base-content/20 hover:border-base-content/40'"
                    >
                        <input type="radio" v-model="characterType" value="avatar" class="hidden" />
                        <div class="flex flex-col gap-1">
                            <span class="font-medium flex items-center gap-2">
                                <Icon name="lucide:sparkles" class="w-4 h-4" />
                                {{ $t('pipeline.addAvatar.trainedAvatar') }}
                            </span>
                            <span class="text-xs text-base-content/60">{{ $t('pipeline.addAvatar.trainedAvatarDescription') }}</span>
                        </div>
                    </label>
                    <label 
                        class="flex-1 cursor-pointer border rounded-box p-4 transition-all"
                        :class="characterType === 'uploadable' ? 'border-primary bg-primary/10' : 'border-base-content/20 hover:border-base-content/40'"
                    >
                        <input type="radio" v-model="characterType" value="uploadable" class="hidden" />
                        <div class="flex flex-col gap-1">
                            <span class="font-medium flex items-center gap-2">
                                <Icon name="lucide:upload" class="w-4 h-4" />
                                {{ $t('pipeline.addAvatar.uploadableCharacter') }}
                            </span>
                            <span class="text-xs text-base-content/60">{{ $t('pipeline.addAvatar.uploadableCharacterDescription') }}</span>
                        </div>
                    </label>
                </div>
            </div>

            <div class="form-control flex flex-col gap-2 flex-shrink-0">
                <label class="label">
                    <span class="label-text font-medium">{{ $t('pipeline.addAvatar.label') }}</span>
                </label>
                <input 
                    type="text" 
                    class="input input-bordered w-full" 
                    :placeholder="$t('pipeline.addAvatar.labelPlaceholder')"
                    v-model="label"
                />
            </div>

            <div v-if="characterType === 'avatar'" class="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">
                <label class="label flex-shrink-0">
                    <span class="label-text font-medium">{{ $t('pipeline.addAvatar.selectAvatars') }}</span>
                </label>
                <p class="text-sm text-base-content/60 flex-shrink-0">{{ $t('pipeline.addAvatar.selectAvatarsDescription') }}</p>
                
                <div v-if="!avatars || trainedAvatars.length === 0" class="text-center py-8 text-base-content/60">
                    {{ $t('pipeline.addAvatar.noAvatarsAvailable') }}
                </div>

                <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 overflow-y-auto p-1 max-h-[40vh]">
                    <div 
                        v-for="avatar in trainedAvatars" 
                        :key="avatar.id"
                        class="aspect-square rounded-box border-2 cursor-pointer transition-all overflow-hidden relative group"
                        :class="selectedAvatarIds.includes(avatar.id) ? 'border-primary ring-2 ring-primary/30' : 'border-base-content/20 hover:border-base-content/40'"
                        @click="toggleAvatar(avatar.id)"
                    >
                        <img 
                            :src="`/api/v1/avatar/${avatar.id}/training-image/1/view`" 
                            :alt="avatar.name"
                            class="w-full h-full object-cover"
                        />
                        <div 
                            v-if="selectedAvatarIds.includes(avatar.id)"
                            class="absolute inset-0 bg-primary/20 flex items-center justify-center"
                        >
                            <Icon name="lucide:check" class="w-6 h-6 text-primary" />
                        </div>
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <span class="text-xs text-white truncate block">{{ avatar.name }}</span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 mt-2 text-sm text-base-content/60 flex-shrink-0">
                    <Icon name="lucide:info" class="w-4 h-4" />
                    <span v-if="selectedAvatarIds.length === 0">{{ $t('pipeline.addAvatar.noAvatarsSelected') }}</span>
                    <span v-else>{{ selectedAvatarIds.length }} {{ $t('pipeline.addAvatar.avatarsSelected') }}</span>
                </div>
            </div>

            <div v-else class="flex flex-col gap-2 flex-shrink-0">
                <div class="alert alert-info">
                    <Icon name="lucide:info" class="w-4 h-4" />
                    <span class="text-sm">{{ $t('pipeline.addAvatar.uploadableInfo') }}</span>
                </div>
            </div>

            <div class="flex justify-end gap-2 flex-shrink-0">
                <button type="button" class="btn btn-ghost" @click="$emit('update:modelValue', false)">
                    {{ $t('common.cancel') }}
                </button>
                <button 
                    type="button" 
                    class="btn btn-primary" 
                    @click="addCharacter"
                    :disabled="!isValid"
                >
                    <Icon name="lucide:plus" class="w-4 h-4" />
                    {{ $t('pipeline.addAvatar.add') }}
                </button>
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import type { Avatar } from '~~/server/database/schemas/avatar.schema';
import type { PipelineElement } from '~~/server/database/schemas/pipeline.schema';

const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'add', element: Omit<PipelineElement, 'fabricObjectId' | 'position'>): void;
}>();

const { data: avatars } = await useFetch<Avatar[]>('/api/v1/avatar');

const trainedAvatars = computed(() => 
    avatars.value?.filter(a => a.status === 'TRAINED') ?? []
);

const characterType = ref<'avatar' | 'uploadable'>('avatar');
const label = ref('');
const selectedAvatarIds = ref<string[]>([]);

const isValid = computed(() => {
    if (!label.value.trim()) return false;
    if (characterType.value === 'avatar' && selectedAvatarIds.value.length === 0) return false;
    return true;
});

watch(() => props.modelValue, (open) => {
    if (open) {
        characterType.value = 'avatar';
        label.value = '';
        selectedAvatarIds.value = [];
    }
});

function toggleAvatar(avatarId: string) {
    const index = selectedAvatarIds.value.indexOf(avatarId);
    if (index === -1) {
        selectedAvatarIds.value.push(avatarId);
    } else {
        selectedAvatarIds.value.splice(index, 1);
    }
}

function addCharacter() {
    if (!isValid.value) return;
    
    const isConfigurable = characterType.value === 'uploadable' || selectedAvatarIds.value.length > 1;
    
    const element: Omit<PipelineElement, 'fabricObjectId' | 'position'> = {
        id: crypto.randomUUID(),
        type: 'AVATAR',
        label: label.value.trim(),
        isConfigurable,
        avatarOptions: {
            avatarIds: characterType.value === 'avatar' ? [...selectedAvatarIds.value] : [],
            defaultAvatarId: characterType.value === 'avatar' ? selectedAvatarIds.value[0] : undefined,
            characterType: characterType.value,
        },
    };
    
    emit('add', element);
    emit('update:modelValue', false);
}
</script>
