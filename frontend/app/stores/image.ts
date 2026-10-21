import { defineStore } from 'pinia';

import type { Image } from '~~/server/database/schemas/image.schema';

export const useImageStore = defineStore('image', {
    state: () => ({
        images: [] as Image[] | any,
        selectedImage: null as Image | null,
        hasInitialized: false,
        pageSize: 24,
        visibleCount: 0,
        loading: false,
        error: null as unknown | null,
    }),
    getters: {
        visibleImages(state) {
            return Array.isArray(state.images) ? state.images.slice(0, state.visibleCount) : [];
        },
        getImageVersions(state) {
            if (!state.selectedImage) return [];
            const rootId = state.selectedImage.rootId || state.selectedImage.id;
            if (!Array.isArray(state.images)) return [];
            return state.images
                .filter((i: Image) => (i.rootId || i.id) === rootId)
                .sort((a: Image, b: Image) => {
                    const at = new Date(a.createdAt as unknown as string).getTime();
                    const bt = new Date(b.createdAt as unknown as string).getTime();
                    return at - bt; // chronological
                });
        },
    },
    actions: {
        async getImages() {
            this.loading = true;
            this.error = null;
            try {
                const images = await $fetch('/api/v1/image');
                this.images = images;
                this.hasInitialized = true;
                if (this.visibleCount === 0) {
                    this.visibleCount = Math.min(this.pageSize, this.images.length || 0);
                }
            } catch (error) {
                console.error(error);
                this.error = error;
            } finally {
                this.loading = false;
            }
        },

        addImage(image: Image) {
            this.images.unshift(image);
            if (this.visibleCount < this.images.length) {
                this.visibleCount += 1;
            }
        },

        async initialize(limit?: number) {
            if (typeof limit === 'number' && limit > 0) {
                this.pageSize = limit;
            }
            if (!this.hasInitialized) {
                await this.getImages();
            } else if (this.visibleCount === 0) {
                this.visibleCount = Math.min(this.pageSize, this.images.length || 0);
            }
        },

        showMore() {
            const next = this.visibleCount + this.pageSize;
            this.visibleCount = Math.min(next, this.images.length || 0);
        },

        async toggleFavorite(imageId: string) {
            try {
                await $fetch(`/api/v1/image/${imageId}/toggle-favorite`, {
                    method: 'POST'
                });
                const image = this.images.find((i: Image) => i.id === imageId);
                if (image) {
                    image.imageMetadata.isFavorite = !image.imageMetadata.isFavorite;
                }
            } catch (error) {
                console.error(error);
                throw error;
            }
        },

        async deleteImage(imageId: string) {
            try {
                await $fetch(`/api/v1/image/${imageId}`, {
                    method: 'DELETE',
                });
                this.images = this.images.filter((i: Image) => i.id !== imageId);
            } catch (error) {
                console.error(error);
                throw error;
            }
        },

        async selectImage(imageId: string) {
            try {
                const imageInCache = this.images.find((i: Image) => i.id === imageId);
                if (!imageInCache) {
                    const image = await $fetch<Image>(`/api/v1/image/${imageId}`);
                    this.images.push(image);
                    this.selectedImage = image;
                } else {
                    this.selectedImage = imageInCache;
                }
            } catch (error) {
                console.error(error);
                throw error;
            };
        },

        getImageSrc(imageId: string) {
            return `/api/v1/image/${imageId}/view`;
        },
    },
});