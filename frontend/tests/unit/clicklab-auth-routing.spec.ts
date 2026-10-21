import { describe, expect, it } from 'vitest';
import { resolveAuthRouteGuard, resolveCreateThumbnailHref } from '~~/shared/clicklab/auth-routing';
import { loginPathWithRedirect, sanitizeInternalRedirect } from '~~/shared/clicklab/safe-redirect';

describe('clicklab auth routing', () => {
  it('guest opening protected route → login with safe redirect', () => {
    const result = resolveAuthRouteGuard({
      path: '/home',
      fullPath: '/home',
      query: {},
      authed: false,
      demoUi: false,
    });
    expect(result).toEqual({
      action: 'redirect',
      to: '/login?redirect=%2Fhome',
    });
  });

  it('guest opening / → allow', () => {
    expect(
      resolveAuthRouteGuard({
        path: '/',
        fullPath: '/',
        query: {},
        authed: false,
        demoUi: false,
      }).action,
    ).toBe('allow');
  });

  it('successful login default (no query) is resolved on login page as /home', () => {
    expect(sanitizeInternalRedirect(undefined, '/home')).toBe('/home');
  });

  it('login with redirect=/studio → studio', () => {
    expect(sanitizeInternalRedirect('/studio', '/home')).toBe('/studio');
    expect(
      resolveAuthRouteGuard({
        path: '/login',
        fullPath: '/login?redirect=%2Fstudio',
        query: { redirect: '/studio' },
        authed: true,
        demoUi: false,
      }),
    ).toEqual({ action: 'redirect', to: '/studio' });
  });

  it('authenticated user on / → /home', () => {
    expect(
      resolveAuthRouteGuard({
        path: '/',
        fullPath: '/',
        query: {},
        authed: true,
        demoUi: false,
      }),
    ).toEqual({ action: 'redirect', to: '/home' });
  });

  it('authenticated user on /login without redirect → /home', () => {
    expect(
      resolveAuthRouteGuard({
        path: '/login',
        fullPath: '/login',
        query: {},
        authed: true,
        demoUi: false,
      }),
    ).toEqual({ action: 'redirect', to: '/home' });
  });

  it('rejects invalid/external redirect parameters', () => {
    expect(sanitizeInternalRedirect('https://evil.com', '/home')).toBe('/home');
    expect(sanitizeInternalRedirect('//evil.com', '/home')).toBe('/home');
    expect(
      resolveAuthRouteGuard({
        path: '/login',
        fullPath: '/login?redirect=https%3A%2F%2Fevil.com',
        query: { redirect: 'https://evil.com' },
        authed: true,
        demoUi: false,
      }),
    ).toEqual({ action: 'redirect', to: '/home' });
  });

  it('blocks redirect loops to guest-only routes', () => {
    expect(sanitizeInternalRedirect('/login', '/home')).toBe('/home');
    expect(sanitizeInternalRedirect('/signup', '/home')).toBe('/home');
  });

  it('create-thumbnail marketing link pattern for guests', () => {
    expect(loginPathWithRedirect('/studio')).toBe('/login?redirect=%2Fstudio');
    expect(resolveCreateThumbnailHref(false, '/studio')).toBe('/login?redirect=%2Fstudio');
  });

  it('authenticated create-thumbnail CTA opens studio directly', () => {
    expect(resolveCreateThumbnailHref(true, '/studio')).toBe('/studio');
    expect(resolveCreateThumbnailHref(true, '/studio?niche=crypto')).toBe('/studio?niche=crypto');
  });

  it('demo admin route blocked for demo UI session', () => {
    expect(
      resolveAuthRouteGuard({
        path: '/2a87e77e-19a8-4448-9eeb-fa72c1e6e4a7',
        fullPath: '/2a87e77e-19a8-4448-9eeb-fa72c1e6e4a7',
        query: {},
        authed: true,
        demoUi: true,
      }),
    ).toEqual({ action: 'redirect', to: '/home' });
  });

  it('protected route with query preserves query in login redirect', () => {
    const result = resolveAuthRouteGuard({
      path: '/settings',
      fullPath: '/settings?tab=billing',
      query: { tab: 'billing' },
      authed: false,
      demoUi: false,
    });
    expect(result.action).toBe('redirect');
    if (result.action === 'redirect') {
      expect(result.to).toContain('/login?redirect=');
      expect(decodeURIComponent(result.to.split('redirect=')[1] ?? '')).toBe('/settings?tab=billing');
    }
  });
});
