export const useAsset = () => {
    const showAssetModal = useState('showAssetModal', () => false);

    const openAssetModal = () => {
        showAssetModal.value = true;
    }

    const closeAssetModal = () => {
        showAssetModal.value = false;
    }

    return {
        showAssetModal,

        openAssetModal,
        closeAssetModal,
    }
}