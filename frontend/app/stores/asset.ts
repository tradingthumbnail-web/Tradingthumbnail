import { defineStore } from 'pinia';

import type { Asset } from "~~/server/database/schemas/assets.schema";

export const useAssetStore = defineStore('asset', {
    state: () => ({
        assets: [] as Asset[] | any,
        loading: false,
        error: null as unknown | null,
        hasInitialized: false,
        fetchPromise: null as Promise<Asset[]> | null,
    }),
    getters: {

    },
    actions: {
        async fetchAssets(force = false): Promise<Asset[]> {
            if (!force && this.hasInitialized) {
                return this.assets;
            }
            if (this.fetchPromise) {
                return this.fetchPromise;
            }
            this.loading = true;
            this.error = null;
            this.fetchPromise = (async () => {
                try {
                    const data = await $fetch<Asset[]>('/api/v1/asset');
                    this.assets = data || [];
                    this.hasInitialized = true;
                    return this.assets;
                } catch (error) {
                    console.error(error);
                    this.error = error;
                    return this.assets;
                } finally {
                    this.loading = false;
                    this.fetchPromise = null;
                }
            })();
            return this.fetchPromise;
        },
        async togglePublic(assetId: string) {
            try {
                await $fetch(`/api/v1/asset/${assetId}/toggle-public`, {
                    method: 'POST',
                });
                const asset = this.assets.find((a: Asset) => a.id === assetId);
                if (asset) {
                    asset.isPublic = !asset.isPublic;
                }
                this.assets = this.assets.map((a: Asset) => a.id === assetId ? asset : a);
            } catch (error) {
                console.error(error);
                throw error;
            }
        },

        async deleteAsset(assetId: string) {
            try {
                await $fetch(`/api/v1/asset/${assetId}`, {
                    method: 'DELETE',
                });
                this.assets = this.assets.filter((a: Asset) => a.id !== assetId);
            } catch (error) {
                console.error(error);
                throw error;
            }
        },

        addAsset(asset: Asset) {
            this.assets.unshift(asset);
        }
    },
});