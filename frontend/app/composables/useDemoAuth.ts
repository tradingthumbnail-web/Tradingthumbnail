import {
  DEMO_UI_COOKIE,
  createDemoUiTier,
  createDemoUiUser,
  isDemoUiCookieActive,
} from '~~/shared/clicklab/demo-auth';
import { sanitizeInternalRedirect } from '~~/shared/clicklab/safe-redirect';

export function useDemoAuth() {
  const demoCookie = useCookie(DEMO_UI_COOKIE, {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });

  const isActive = computed(() => isDemoUiCookieActive(demoCookie.value));

  function applyDemoSessionToStore() {
    const userStore = useUserStore();
    userStore.user = createDemoUiUser();
    userStore.tier = createDemoUiTier();
    userStore.subscription = null;
    userStore.avatarCredits = userStore.user.avatarCredit;
  }

  async function signInDemoUi(redirectTo?: string) {
    demoCookie.value = '1';
    applyDemoSessionToStore();
    await navigateTo(sanitizeInternalRedirect(redirectTo, '/home'));
  }

  async function signOutDemoUi() {
    demoCookie.value = null;
    useUserStore().cleanUser();
    await navigateTo('/');
  }

  return {
    isActive,
    applyDemoSessionToStore,
    signInDemoUi,
    signOutDemoUi,
  };
}
