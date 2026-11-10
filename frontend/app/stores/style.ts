import { defineStore } from 'pinia';
import type { Style } from '~~/server/database/schemas/style.schema';

export const useStyleStore = defineStore('style', {
    state: () => ({
        styles: [] as Style[],
        loading: false,
        error: null as unknown | null,
        hasInitialized: false,
        fetchPromise: null as Promise<Style[]> | null,
    }),
    actions: {
        async fetchStyles(force = false): Promise<Style[]> {
            if (!force && this.hasInitialized) {
                return this.styles;
            }
            if (this.fetchPromise) {
                return this.fetchPromise;
            }
            this.loading = true;
            this.error = null;
            this.fetchPromise = (async () => {
                try {
                    const data = await $fetch<Style[]>('/api/v1/style');
                    this.styles = data || [];
                    this.hasInitialized = true;
                    return this.styles;
                } catch (error) {
                    console.error(error);
                    this.error = error;
                    return this.styles;
                } finally {
                    this.loading = false;
                    this.fetchPromise = null;
                }
            })();
            return this.fetchPromise;
        },
    },
});
