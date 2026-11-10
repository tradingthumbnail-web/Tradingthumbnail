import { defineStore } from 'pinia';

import type { Avatar } from '~~/server/database/schemas/avatar.schema';

export const useAvatarStore = defineStore('avatar', {
    state: () => ({
        avatars: [] as Avatar[] | any,
        totalTrainingImages: 0 as number,
        loading: false,
        error: null as unknown | null,
        hasInitialized: false,
        fetchPromise: null as Promise<Avatar[]> | null,
    }),
    getters: {

    },
    actions: {
        async fetchAvatars(force = false): Promise<Avatar[]> {
            if (!force && this.hasInitialized) {
                return this.avatars;
            }
            if (this.fetchPromise) {
                return this.fetchPromise;
            }
            this.loading = true;
            this.error = null;
            this.fetchPromise = (async () => {
                try {
                    const data = await $fetch<Avatar[]>('/api/v1/avatar');
                    this.avatars = data || [];
                    this.hasInitialized = true;
                    return this.avatars;
                } catch (error) {
                    console.error(error);
                    this.error = error;
                    return this.avatars;
                } finally {
                    this.loading = false;
                    this.fetchPromise = null;
                }
            })();
            return this.fetchPromise;
        },

        addAvatar(avatar: Avatar) {
            this.avatars.unshift(avatar);
        },

        updateAvatar(updated: Avatar) {
            this.avatars = this.avatars.map((a: Avatar) => a.id === updated.id ? updated : a);
        },

        removeAvatar(avatarId: string) {
            this.avatars = this.avatars.filter((a: Avatar) => a.id !== avatarId);
        },
        async getTotalTrainingImages(avatarId: string) {
            try {
                const totalTrainingImages = await $fetch<number>(`/api/v1/avatar/${avatarId}/total-training-images`);
                if (totalTrainingImages === undefined || totalTrainingImages === null) return 0;
                this.totalTrainingImages = totalTrainingImages;
                return totalTrainingImages;
            } catch (error) {
                console.error(error);
                throw error;
            }
        }
    }
});