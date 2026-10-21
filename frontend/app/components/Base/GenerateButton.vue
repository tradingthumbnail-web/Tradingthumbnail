<template>
    <div class="p-4 pt-3 flex items-center justify-center flex-col gap-3 border-t border-base-100/10">
        <div class="flex items-center gap-2 text-xs text-base-content/50">
            <Icon name="lucide:coins" size="14" class="text-primary/70" />
            <span>{{ props.credits }} {{ $t('common.credits') }} {{ $t('common.willBeUsed') }}</span>
        </div>
        <button 
            class="btn btn-primary w-full h-12 gap-2.5 text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
            @click="emit('click')" 
            :disabled="isDisabled" 
            :class="{ 'btn-disabled opacity-50': isDisabled }">
            <Icon name="lucide:wand-sparkles" size="18" mode="svg" v-if="!props.isLoading" />
            <span class="loading loading-spinner loading-sm" v-if="props.isLoading"></span>
            <span v-if="!props.isLoading">{{ props.label }}</span>
            <Transition 
                v-else 
                mode="out-in"
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1">
                <span :key="currentMessage" class="inline-block">{{ currentMessage }}</span>
            </Transition>
            <div class="hidden lg:flex items-center gap-1 text-[10px] text-primary-content/60 bg-primary-content/10 px-2 py-1 rounded-md ml-1" v-if="!props.isLoading && props.hotkeyEnabled">
                <kbd class="font-mono">{{ shortcutPrimary }}</kbd>
                <span>+</span>
                <kbd class="font-mono">Enter</kbd>
            </div>
        </button>
    </div>
</template>

<script setup lang="ts">
const shortcutPrimary = ref('');
const { t } = useI18n();
const emit = defineEmits<{
    (e: 'click'): void;
}>();

const props = withDefaults(defineProps<{
    label?: string;
    loadingLabel?: string;
    isLoading: boolean;
    credits: number;
    hotkeyEnabled: boolean;
    disabled?: boolean;
}>(), {
    label: () => useI18n().t('common.generate'),
    loadingLabel: () => useI18n().t('common.generating'),
    isLoading: false,
    credits: 0,
    hotkeyEnabled: true,
    disabled: false,
});

const isDisabled = computed(() => props.isLoading || props.disabled);

const loadingMessages = [
    t('common.button.1'),
    t('common.button.2'),
    t('common.button.3'),
    t('common.button.4'),
    t('common.button.5'),
    t('common.button.6'),
    t('common.button.7'),
    t('common.button.8'),
    t('common.button.9'),
    t('common.button.10'),
    t('common.button.11'),
    t('common.button.12'),
];

const currentMessage = ref(loadingMessages[0]);
let messageInterval: any = null;

function pickNextMessage() {
    if (!loadingMessages.length) return;
    const prev = currentMessage.value;
    let next = prev;
    // avoid immediate repeats
    for (let i = 0; i < loadingMessages.length && next === prev; i++) {
        next = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    }
    currentMessage.value = next;
}

watch(() => props.isLoading, (loading) => {
    if (loading) {
        // initialize with a random message and start cycling
        pickNextMessage();
        if (messageInterval) clearInterval(messageInterval);
        messageInterval = setInterval(pickNextMessage, 3000);
    } else {
        if (messageInterval) {
            clearInterval(messageInterval);
            messageInterval = null;
        }
        currentMessage.value = loadingMessages[0];
    }
}, { immediate: true });

const handleKeyPress = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isDisabled.value) {
            emit('click');
        }
    }
};

onMounted(() => {
    window.addEventListener('keydown', handleKeyPress);
    if (typeof navigator !== 'undefined') {
        shortcutPrimary.value = /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl';
    }
});
onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress);
    if (messageInterval) clearInterval(messageInterval);
});
</script>

<style scoped></style>