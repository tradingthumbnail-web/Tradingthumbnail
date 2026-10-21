type Admin = {
    id: string;
    name: string;
    email: string;
}

type ImpersonationState = {
    isImpersonating: boolean;
    targetUser: { id: string; name: string; email: string } | null;
}

type ImpersonationStatus = {
    isImpersonating: boolean;
    currentUser?: { id: string; name: string; email: string }
}

export const useImpersonateStore = defineStore('impersonate', {
    state: (): ImpersonationState => ({
        isImpersonating: false,
        targetUser: null,
    }),
    actions: {
        async getImpersonationStatus() {
            try {
                const impersonationStatus = await $fetch<ImpersonationStatus>('/api/v1/admin/impersonation-status');
                this.isImpersonating = impersonationStatus.isImpersonating;
                if (impersonationStatus.isImpersonating && impersonationStatus.currentUser) {
                    this.targetUser = {
                        id: impersonationStatus.currentUser.id,
                        name: impersonationStatus.currentUser.name,
                        email: impersonationStatus.currentUser.email,
                    };
                } else {
                    this.targetUser = null;
                }
            } catch (error) {
                console.error(error);
                this.isImpersonating = false;
                this.targetUser = null;
            }
        },

        async stopImpersonating() {
            try {
                await $fetch('/api/v1/admin/stop-impersonate', {
                    method: 'POST',
                });
                this.isImpersonating = false;
                this.targetUser = null;
            } catch (error) {
                console.error(error);
                throw error;
            }
        },

        async impersonateUser(userId: string) {
            try {
                const response = await $fetch('/api/v1/admin/impersonate', {
                    method: 'POST',
                    body: { userId },
                });
                this.isImpersonating = true;
                this.targetUser = {
                    id: response.user.id,
                    name: response.user.name,
                    email: response.user.email,
                };
            } catch (error) {
                console.error(error);
                this.isImpersonating = false;
                this.targetUser = null;
                throw error;
            }
        },
    },
});