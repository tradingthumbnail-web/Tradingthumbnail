import { defineStore } from 'pinia';

export const useModalStore = defineStore('modal', {
    state: () => ({
        isOpen: false,
        imageId: null as string | null,
        backgroundRoute: null as string | null,
    }),
    actions: {
        openImageModal(imageId: string, fromRoute: string) {
            this.imageId = imageId;
            this.backgroundRoute = fromRoute;
            this.isOpen = true;
        },
        
        closeModal() {
            this.isOpen = false;
            this.imageId = null;
            // Don't clear backgroundRoute immediately - let navigation happen first
        },
        
        reset() {
            this.isOpen = false;
            this.imageId = null;
            this.backgroundRoute = null;
        }
    }
});

