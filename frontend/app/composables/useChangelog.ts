import type { Locale } from "~~/server/database/schemas/user.schema";

import { APP_VERSION, CHANGELOGS } from '~~/server/constants/changelog';

export function useChangelog() {
  const { locale } = useI18n();
  const localStorageKey = 'kithumbs-last-changelog-version';

  const getLatestChangelog = () => {
    if (CHANGELOGS.length === 0) {
      throw new Error('No changelog entries found');
    }
    const latest = CHANGELOGS[0]!;
    const currentLocale = locale.value as Locale;
    const localeData = latest[currentLocale] || latest.en;

    return {
      version: latest.version,
      title: localeData.title,
      features: localeData.features,
    };
  };

  const getAllChangelogs = () => {
    const currentLocale = locale.value as Locale;

    return CHANGELOGS.map((changelog) => {
      const localeData = changelog[currentLocale] || changelog.en;
      return {
        version: changelog.version,
        date: changelog.date,
        title: localeData.title,
        features: localeData.features,
      };
    });
  };

  const getChangelogByVersion = (version: string) => {
    const changelog = CHANGELOGS.find((c) => c.version === version);
    if (!changelog) return null;

    const currentLocale = locale.value as Locale;
    const localeData = changelog[currentLocale] || changelog.en;

    return {
      version: changelog.version,
      title: localeData.title,
      features: localeData.features,
    };
  };

  const getLastSeenVersion = (): string | null => {
    return localStorage.getItem(localStorageKey);
  };

  const markAsViewed = () => {
    localStorage.setItem(localStorageKey, APP_VERSION);
  };

  const hasNewVersion = (): boolean => {
    const lastSeen = getLastSeenVersion();
    return lastSeen !== APP_VERSION;
  };

  const checkForUpdates = (): boolean => {
    return hasNewVersion();
  };

  return {
    getLatestChangelog,
    getAllChangelogs,
    getChangelogByVersion,
    checkForUpdates,
    hasNewVersion,
    markAsViewed,
  };
}