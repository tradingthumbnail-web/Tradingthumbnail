export const useAvatar = () => {
    const showAvatarCreateModal = useState('showAvatarCreateModal', () => false);

    return {
        showAvatarCreateModal
    }
}