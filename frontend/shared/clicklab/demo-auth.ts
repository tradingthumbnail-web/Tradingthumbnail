import type { User } from '~~/server/database/schemas/user.schema';
import type { Tier } from '~~/server/database/schemas/tier.schema';

export const DEMO_UI_COOKIE = 'clicklab-demo-ui';

export const DEMO_USER_ID = '00000000-0000-4000-a800-000000000001';

const now = new Date();

export function createDemoUiUser(): User {
  return {
    id: DEMO_USER_ID,
    name: 'Demo Creator',
    username: 'demo_creator',
    email: 'demo@clicklab.local',
    hashedPassword: 'demo-ui-only',
    credit: 120,
    avatarCredit: 1,
    stripeCustomerId: null,
    polarCustomerId: null,
    role: 'USER',
    validationDate: now,
    notifications: true,
    locale: 'en',
    createdAt: now,
    updatedAt: now,
    lastSignedInAt: now,
  };
}

export function createDemoUiTier(): Tier {
  return {
    id: 0,
    name: 'Demo',
    description: 'UI preview — no real billing',
    price: '0',
    stripePriceId: null,
    stripeProductId: null,
    polarPriceId: null,
    polarProductId: null,
    polarYearlyProductId: null,
    avatarSlots: 1,
    features: {
      maxCredits: 200,
      displayFeatures: [],
    },
    createdAt: now,
  };
}

export function isDemoUiCookieActive(value: string | null | undefined): boolean {
  return value === '1';
}
