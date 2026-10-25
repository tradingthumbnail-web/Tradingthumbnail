import { defineStore } from 'pinia';

import type { Tier } from '~~/server/database/schemas/tier.schema';
import type { Locale, User } from '~~/server/database/schemas/user.schema';
import type { Subscription } from '~~/server/database/schemas/subscription.schema';
import { resolveModel, type ModelName, type SelectableFor } from '~~/server/constants/models-db';

const LOCAL_STORAGE_KEY_SIDEBAR_COLLAPSED = 'kithumbs-sidebar-collapsed';
const LOCAL_STORAGE_KEY_SIDEBAR_ITEMS = 'kithumbs-sidebar-items';
const LOCAL_STORAGE_KEY_MODEL_PREFERENCES = 'kithumbs-model-preferences';

const DEFAULT_SIDEBAR_ITEMS = {
    workspace: true,
    library: true,
    tools: true,
};

type ModelPreferences = {
    quickGenerationModel: ModelName | null;
    fineEditModel: ModelName | null;
};

const getStoredModelPreferences = (): ModelPreferences => {
    if (typeof localStorage === 'undefined') {
        return { quickGenerationModel: null, fineEditModel: null };
    }
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_MODEL_PREFERENCES);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return { quickGenerationModel: null, fineEditModel: null };
        }
    }
    return { quickGenerationModel: null, fineEditModel: null };
};

export const useUserStore = defineStore('user', {
    state: () => ({
        user: null as User | null,
        tier: null as Tier | null,
        subscription: null as Subscription | null,
        avatarCredits: 0,
        sidebar: {
            collapsed: typeof localStorage !== 'undefined' && localStorage.getItem(LOCAL_STORAGE_KEY_SIDEBAR_COLLAPSED) === 'true',
            items: typeof localStorage !== 'undefined' 
                ? JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_SIDEBAR_ITEMS) || 'null') || DEFAULT_SIDEBAR_ITEMS
                : DEFAULT_SIDEBAR_ITEMS,
        },
        modelPreferences: getStoredModelPreferences(),
    }),
    getters: {
        isSubscribed: (state) => state.subscription && state.subscription.status === 'ACTIVE',
        hasAvatarCredits: (state) => state.avatarCredits > 0,
        isAdmin: (state) => state.user?.role === 'ADMIN',
        getModelPreference: (state) => (type: SelectableFor): ModelName => {
            const key = type === 'quickGeneration' ? 'quickGenerationModel' : 'fineEditModel';
            return resolveModel(state.modelPreferences[key], type);
        },
    },
    actions: {
        async getMe({
            locale,
        }: { locale?: Locale | null } = { locale: null }) {
            try {
                const userData = await $fetch<{ user: User | null, tier: Tier | null, subscription: Subscription | null }>('/api/v1/auth/user');
                this.user = userData.user;
                this.tier = userData.tier;
                this.subscription = userData.subscription;
                this.avatarCredits = userData.user?.avatarCredit ?? 0;
                if (locale) await this.checkAndCorrectLocale(locale);
            } catch (error) {
                console.error(error);
                this.cleanUser();
            };
        },

        cleanUser() {
            this.user = null;
            this.tier = null;
            this.subscription = null;
        },

        async payForGeneration(_amountToPay: number) {
            await this.getMe({ locale: null });
        },

        toggleSidebar() {
            this.sidebar.collapsed = !this.sidebar.collapsed;
            localStorage.setItem(LOCAL_STORAGE_KEY_SIDEBAR_COLLAPSED, this.sidebar.collapsed.toString());
        },

        toggleSidebarItem(item: string) {
            this.sidebar.items[item] = !this.sidebar.items[item];
            localStorage.setItem(LOCAL_STORAGE_KEY_SIDEBAR_ITEMS, JSON.stringify(this.sidebar.items));
        },

        async checkAndCorrectLocale(clientLocale: Locale | null) {
            if (clientLocale && this.user && clientLocale !== this.user?.locale) {
                this.user.locale = clientLocale;
                await $fetch('/api/v1/user/locale', {
                    method: 'POST',
                    body: { locale: clientLocale },
                });
            }
        },

        setModelPreference(type: SelectableFor, model: ModelName) {
            const key = type === 'quickGeneration' ? 'quickGenerationModel' : 'fineEditModel';
            this.modelPreferences[key] = model;
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(LOCAL_STORAGE_KEY_MODEL_PREFERENCES, JSON.stringify(this.modelPreferences));
            }
        },
    }
});