/** Default studio entry after sign-in from marketing CTAs. */
export const CLICKLAB_STUDIO_ENTRY_PATH = '/studio';

const ALLOWED_EXACT = new Set([CLICKLAB_STUDIO_ENTRY_PATH, '/home']);

/** Internal app prefixes allowed after login (open-redirect safe). */
const ALLOWED_PREFIXES = [
  '/studio',
  '/home',
  '/settings',
  '/archive',
  '/assets',
  '/avatars',
  '/graph',
  '/quick-generation',
  '/quick-thumb',
  '/sketch',
  '/pipeline',
  '/chat',
  '/photoshoot',
  '/image-to-image',
  '/images',
  '/thumbnails',
  '/changelog',
] as const;

const BLOCKED_REDIRECT_PATHS = new Set([
  '/login',
  '/signup',
  '/reset-password',
  '/validate-email',
  '/',
]);

/**
 * Validates post-login redirect targets (open-redirect safe, internal app paths only).
 */
export function sanitizeInternalRedirect(
  raw: string | null | undefined,
  fallback = '/home',
): string {
  if (!raw || typeof raw !== 'string') {
    return fallback;
  }

  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }
  if (trimmed.includes('://') || trimmed.includes('\\') || trimmed.includes('@')) {
    return fallback;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, 'http://clicklab.local');
  } catch {
    return fallback;
  }

  if (parsed.origin !== 'http://clicklab.local') {
    return fallback;
  }

  const pathname = parsed.pathname;
  if (!isAllowedPostLoginPath(pathname)) {
    return fallback;
  }

  return `${pathname}${parsed.search}${parsed.hash}`;
}

export function isAllowedPostLoginPath(pathname: string): boolean {
  if (BLOCKED_REDIRECT_PATHS.has(pathname)) {
    return false;
  }
  if (ALLOWED_EXACT.has(pathname)) {
    return true;
  }
  return ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Login URL preserving intended in-app destination. */
export function loginPathWithRedirect(destination: string): string {
  const safe = sanitizeInternalRedirect(destination, CLICKLAB_STUDIO_ENTRY_PATH);
  return `/login?redirect=${encodeURIComponent(safe)}`;
}
