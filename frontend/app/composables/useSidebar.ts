const isDrawerOpenState = ref(false);

export const useSidebar = () => {
    const openDrawer = () => {
        isDrawerOpenState.value = true;
    };

    const closeDrawer = () => {
        isDrawerOpenState.value = false;
    };

    return {
        isDrawerOpen: readonly(isDrawerOpenState),
        openDrawer,
        closeDrawer
    };
};