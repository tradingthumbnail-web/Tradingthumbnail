<template>
    <BaseModal :model-value="modelValue" size="md" @update:modelValue="onModelUpdate" @close="onClose">
        <div class="w-full max-w-2xl bg-base-200">
            <div class="flex items-center gap-3 p-4 pb-2 bg-base-100">
                <Icon name="lucide:search" class="h-5 w-5 text-base-content/70 " />
                <input ref="searchInputRef" v-model="searchQuery" type="search" id="search-input"
                    class="input input-ghost flex-1 h-auto border-0 px-0 text-lg text-base-content placeholder:text-base-content/50 focus:outline-none"
                    :placeholder="t('header.searchPlaceholder')" @input="handleSearch" />
                <button type="button" class="btn btn-ghost btn-sm" @click="closeModal">
                    <Icon name="lucide:x" class="h-4 w-4" />
                </button>
            </div>

            <!-- Search Results -->
            <div class="px-4 pb-4">
                <div v-if="searchQuery.trim()" class="space-y-4">
                    <!-- Suggestions -->
                    <div v-if="suggestions.length > 0" class="space-y-2">
                        <h3 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide">{{
                            t('search.suggestions') }}</h3>
                        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2" role="listbox">
                            <li v-for="(suggestion, idx) in suggestions" :key="suggestion.id">
                                <button type="button"
                                    :class="['btn btn-outline btn-sm justify-start w-full', idx === activeIndex ? 'ring ring-[var(--color-primary)]' : '']"
                                    role="option"
                                    :aria-selected="idx === activeIndex"
                                    @click="selectSuggestion(suggestion)"
                                >
                                    <Icon :name="suggestion.icon" class="h-4 w-4 mr-2" />
                                    {{ suggestion.label }}
                                </button>
                            </li>
                        </ul>
                    </div>

                    <!-- Quick Actions -->
                    <div v-if="quickActions.length > 0" class="space-y-2">
                        <h3 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide">{{
                            t('search.quickActions') }}</h3>
                        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2" role="listbox">
                            <li v-for="(action, idx) in quickActions" :key="action.id">
                                <button type="button"
                                    :class="['btn btn-ghost btn-sm justify-start w-full', (idx + suggestions.length) === activeIndex ? 'ring ring-[var(--color-primary)]' : '']"
                                    role="option"
                                    :aria-selected="(idx + suggestions.length) === activeIndex"
                                    @click="executeAction(action)"
                                >
                                    <Icon :name="action.icon" class="h-4 w-4 mr-2" />
                                    {{ action.label }}
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else class="text-center py-8">
                    <Icon name="lucide:search" class="h-12 w-12 mx-auto text-base-content/30 mb-4" />
                    <p class="text-base-content/60">{{ t('search.startTyping') }}</p>
                    <p class="text-sm text-base-content/40 mt-2">{{ t('search.tryExamples') }}</p>
                </div>
            </div>

            <div class="px-4 py-3 border-t border-base-300/60 bg-base-200/80 backdrop-blur flex items-center justify-end">
                <button type="button" class="btn" @click="closeModal">{{ t('common.close') }}</button>
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
interface SearchSuggestion {
    id: string;
    label: string;
    icon: string;
    type: 'page' | 'component' | 'action';
    path?: string; // for type 'page'
}

interface QuickAction {
    id: string;
    label: string;
    icon: string;
    action: () => void;
}

const props = defineProps<{
    modelValue: boolean;
    initialQuery?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    'search': [query: string];
    'select': [item: SearchSuggestion];
}>();

const { t } = useI18n();
const router = useRouter();
const searchInputRef = ref<HTMLInputElement | null>(null);
const searchQuery = ref(props.initialQuery || '');
const activeIndex = ref<number>(0);

const suggestions = computed((): SearchSuggestion[] => {
    const query = searchQuery.value.toLowerCase().trim();
    if (!query) return [];

    const pages: SearchSuggestion[] = [
        { id: 'home', label: 'Home', icon: 'lucide:home', type: 'page', path: '/' },
        { id: 'graph', label: 'Graph', icon: 'lucide:git-branch', type: 'page', path: '/graph' },
        { id: 'images', label: 'Images', icon: 'lucide:image', type: 'page', path: '/images' },
        { id: 'thumbnails', label: 'Thumbnails', icon: 'lucide:layout-grid', type: 'page', path: '/thumbnails' },
        { id: 'settings', label: 'Settings', icon: 'lucide:settings', type: 'page', path: '/settings' },
        { id: 'plans', label: 'Plans', icon: 'lucide:credit-card', type: 'page', path: '/settings/plans' },
        { id: 'tools-chat', label: 'Chat', icon: 'lucide:message-square', type: 'page', path: '/chat' },
        { id: 'tools-image-to-image', label: 'Image to Image', icon: 'lucide:arrows-left-right', type: 'page', path: '/image-to-image' },
        { id: 'tools-photoshoot', label: 'Photoshoot', icon: 'lucide:camera', type: 'page', path: '/photoshoot' },
        { id: 'tools-quick-generation', label: 'Quick Generation', icon: 'lucide:zap', type: 'page', path: '/quick-generation' },
        { id: 'tools-quick-thumb', label: 'Quick Thumb', icon: 'lucide:square', type: 'page', path: '/quick-thumb' },
        { id: 'tools-sketch', label: 'Sketch', icon: 'lucide:pencil', type: 'page', path: '/sketch' },
        { id: 'archive', label: 'Archive', icon: 'lucide:archive', type: 'page', path: '/archive' },
        { id: 'assets', label: 'Assets', icon: 'lucide:package', type: 'page', path: '/assets' },
        { id: 'avatars', label: 'Avatars', icon: 'lucide:circle-user-round', type: 'page', path: '/avatars' },
    ];

    return pages.filter(item => item.label.toLowerCase().includes(query));
});

const quickActions = computed((): QuickAction[] => {
    const query = searchQuery.value.toLowerCase().trim();
    if (!query) return [];

    const allActions: QuickAction[] = [
        {
            id: 'new-project',
            label: t('search.newProject'),
            icon: 'lucide:plus',
            action: () => console.log('Create new project')
        },
        {
            id: 'export-data',
            label: t('search.exportData'),
            icon: 'lucide:download',
            action: () => console.log('Export data')
        },
        {
            id: 'clear-cache',
            label: t('search.clearCache'),
            icon: 'lucide:trash-2',
            action: () => console.log('Clear cache')
        }
    ];

    return allActions.filter(action =>
        action.label.toLowerCase().includes(query)
    );
});

const allOptions = computed(() => {
    // combined list to index across suggestions then actions
    return [
        ...suggestions.value.map(s => ({ kind: 'suggestion' as const, item: s })),
        ...quickActions.value.map(a => ({ kind: 'action' as const, item: a }))
    ];
});

const handleSearch = () => {
    emit('search', searchQuery.value);
    activeIndex.value = 0;
};

const selectSuggestion = (suggestion: SearchSuggestion) => {
    emit('select', suggestion);
    if (suggestion.type === 'page' && suggestion.path) {
        router.push(suggestion.path);
    }
    closeModal();
};

const executeAction = (action: QuickAction) => {
    action.action();
    closeModal();
};

function moveActive(delta: number) {
    const total = allOptions.value.length;
    if (total === 0) return;
    const next = (activeIndex.value + delta + total) % total;
    activeIndex.value = next;
}

function selectActive() {
    const options = allOptions.value;
    const total = options.length;
    if (total === 0) return;
    const index = Math.max(0, Math.min(activeIndex.value, total - 1));
    activeIndex.value = index;
    const entry = options[index];
    if (!entry) return;
    if (entry.kind === 'suggestion') {
        selectSuggestion(entry.item as SearchSuggestion);
    } else {
        executeAction(entry.item as QuickAction);
    }
}

const closeModal = () => {
    emit('update:modelValue', false);
};

const focusInput = () => {
    nextTick(() => {
        const el = document.getElementById('search-input') as HTMLInputElement | null;
        if (el) {
            el.focus();
            el.select();
        }
    });
};

// Watch for modal state changes
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        focusInput();
    }
});

function onModelUpdate(v: boolean) {
    emit('update:modelValue', v);
}

function onClose() {
    emit('update:modelValue', false);
}

function handleKeydown(e: KeyboardEvent) {
    if (!props.modelValue) return;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveActive(1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveActive(-1);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        selectActive();
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
</style>