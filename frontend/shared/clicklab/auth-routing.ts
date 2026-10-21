import {
  CLICKLAB_STUDIO_ENTRY_PATH,
  loginPathWithRedirect,
  sanitizeInternalRedirect,
} from './safe-redirect';

export const GUEST_ONLY_ROUTES = ['/login', '/signup', '/reset-password', '/validate-email'] as const;

/** Routes reachable without a session (exact path match). */
export const PUBLIC_APP_ROUTES = [
  ...GUEST_ONLY_ROUTES,
  '/',
  '/studio',
  '/studio/avatars',
  '/privacy',
  '/terms',
  '/cookies',
  '/blog',
] as const;

export type AuthRouteGuardInput = {
  path: string;
  fullPath: string;
  query: Record<string, unknown>;
  authed: boolean;
  demoUi: boolean;
};

export type AuthRouteGuardResult =
  | { action: 'allow' }
  | { action: 'redirect'; to: string };

function isPublicRoute(path: string): boolean {
  return (PUBLIC_APP_ROUTES as readonly string[]).includes(path);
}

function loginWithReturn(fullPath: string): string {
  const safe = sanitizeInternalRedirect(fullPath, '/home');
  return `/login?redirect=${encodeURIComponent(safe)}`;
}

/**
 * Client route guard decisions (mirrors auth.global middleware policy).
 */
export function resolveAuthRouteGuard(input: AuthRouteGuardInput): AuthRouteGuardResult {
  const { path, fullPath, query, authed, demoUi } = input;

  if (authed && (GUEST_ONLY_ROUTES as readonly string[]).includes(path)) {
    if (path === '/login') {
      const redirect = typeof query.redirect === 'string' ? query.redirect : undefined;
      return { action: 'redirect', to: sanitizeInternalRedirect(redirect, '/home') };
    }
    return { action: 'redirect', to: '/home' };
  }

  if (authed && path === '/') {
    return { action: 'redirect', to: '/home' };
  }

  if (demoUi && path.startsWith('/2a87e77e')) {
    return { action: 'redirect', to: '/home' };
  }

  if (!authed && !isPublicRoute(path)) {
    return { action: 'redirect', to: loginWithReturn(fullPath) };
  }

  return { action: 'allow' };
}

/** Landing / marketing “start creating” CTA target. */
export function resolveCreateThumbnailHref(isSignedIn: boolean, destination = CLICKLAB_STUDIO_ENTRY_PATH): string {
  const safe = sanitizeInternalRedirect(destination, CLICKLAB_STUDIO_ENTRY_PATH);
  if (isSignedIn) {
    return safe;
  }
  return loginPathWithRedirect(safe);
}
