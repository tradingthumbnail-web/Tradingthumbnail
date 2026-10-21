import { resolveCreateThumbnailHref } from '~~/shared/clicklab/auth-routing';
import { CLICKLAB_STUDIO_ENTRY_PATH } from '~~/shared/clicklab/safe-redirect';
import { DEMO_UI_COOKIE, isDemoUiCookieActive } from '~~/shared/clicklab/demo-auth';

let landingSessionHydrated = false;

/**
 * Resolves href for "start creating" CTAs: /studio when signed in, else /login?redirect=…
 */
export function useClickLabStudioEntry() {
  const userStore = useUserStore();
  const demoCookie = useCookie(DEMO_UI_COOKIE);

  onMounted(async () => {
    if (landingSessionHydrated || userStore.user) {
      return;
    }
    landingSessionHydrated = true;
    try {
      await userStore.getMe({ locale: null });
    } catch {
      // Guest — CTAs will send to login with redirect.
    }
  });

  const isSignedIn = computed(
    () => Boolean(userStore.user) || isDemoUiCookieActive(demoCookie.value),
  );

  function resolveCreateThumbnailTarget(destination = CLICKLAB_STUDIO_ENTRY_PATH): string {
    return resolveCreateThumbnailHref(isSignedIn.value, destination);
  }

  return {
    isSignedIn,
    resolveCreateThumbnailTarget,
    studioEntryPath: CLICKLAB_STUDIO_ENTRY_PATH,
  };
}
