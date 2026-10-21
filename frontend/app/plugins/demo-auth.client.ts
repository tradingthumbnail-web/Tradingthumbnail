import { isDemoUiCookieActive, DEMO_UI_COOKIE } from '~~/shared/clicklab/demo-auth';

export default defineNuxtPlugin(() => {
  const cookie = useCookie(DEMO_UI_COOKIE);
  if (!isDemoUiCookieActive(cookie.value)) {
    return;
  }

  const { applyDemoSessionToStore } = useDemoAuth();
  applyDemoSessionToStore();
});
