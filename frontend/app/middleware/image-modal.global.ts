export default defineNuxtRouteMiddleware((to, from) => {
    if (import.meta.server) return;

    const modalStore = useModalStore();

    // Check if navigating TO an image route
    if (to.path.startsWith('/images/') && to.params.imageId) {
        const imageId = to.params.imageId as string;

        // If coming from somewhere other than another image modal
        // Store the background route and open modal
        if (!from.path.startsWith('/images/')) {
            modalStore.openImageModal(imageId, from.fullPath);
            return; // Allow navigation to continue
        } else {
            // Navigating between images - just update the modal
            modalStore.imageId = imageId;
            return;
        }
    }

    // Check if navigating AWAY from an image route
    if (from.path.startsWith('/images/') && !to.path.startsWith('/images/')) {
        // Close the modal when navigating away
        modalStore.reset();
    }
});

