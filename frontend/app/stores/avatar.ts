import { defineStore } from 'pinia';

import type { Avatar } from '~~/server/database/schemas/avatar.schema';

export const useAvatarStore = defineStore('avatar', {
    state: () => ({
        avatars: [] as Avatar[] | any,
        totalTrainingImages: 0 as number,
    }),
    getters: {

    },
    actions: {
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