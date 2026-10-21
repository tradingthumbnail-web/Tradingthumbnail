import { defineStore } from 'pinia';

import type { Asset } from "~~/server/database/schemas/assets.schema";

export const useAssetStore = defineStore('asset', {
    state: () => ({
        assets: [] as Asset[] | any,
    }),
    getters: {

    },
    actions: {
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