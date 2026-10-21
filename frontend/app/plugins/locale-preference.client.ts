const LOCALE_COOKIE = 'kithumbs-locale';
const ALLOWED = ['en', 'es', 'ca'] as const;
type AppLocale = (typeof ALLOWED)[number];

export default defineNuxtPlugin(async (nuxtApp) => {
  const cookie = useCookie<AppLocale | null>(LOCALE_COOKIE, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  const i18n = nuxtApp.$i18n as { setLocale: (code: AppLocale) => Promise<void> | void };

  const fromCookie = cookie.value;
  const nextLocale: AppLocale =
    fromCookie && ALLOWED.includes(fromCookie) ? fromCookie : 'en';

  if (!fromCookie || !ALLOWED.includes(fromCookie)) {
    cookie.value = 'en';
  }

  await i18n.setLocale(nextLocale);
});
