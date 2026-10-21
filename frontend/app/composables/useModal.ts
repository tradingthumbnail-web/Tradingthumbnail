export function useModal(initial = false) {
    const isOpen = ref<boolean>(initial);

    function open() {
        isOpen.value = true;
    }

    function close() {
        isOpen.value = false;
    }

    function toggle() {
        isOpen.value = !isOpen.value;
    }

    return { isOpen, open, close, toggle };
}


