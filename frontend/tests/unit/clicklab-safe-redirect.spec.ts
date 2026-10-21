import { describe, expect, it } from 'vitest';
import {
  CLICKLAB_STUDIO_ENTRY_PATH,
  loginPathWithRedirect,
  sanitizeInternalRedirect,
} from '~~/shared/clicklab/safe-redirect';

describe('clicklab safe redirect', () => {
  it('allows studio and studio subpaths with query', () => {
    expect(sanitizeInternalRedirect('/studio', '/home')).toBe('/studio');
    expect(sanitizeInternalRedirect('/studio?niche=crypto', '/home')).toBe('/studio?niche=crypto');
    expect(sanitizeInternalRedirect('/studio/avatars', '/home')).toBe('/studio/avatars');
  });

  it('allows /home when explicitly requested', () => {
    expect(sanitizeInternalRedirect('/home', '/studio')).toBe('/home');
  });

  it('rejects open redirects and external URLs', () => {
    expect(sanitizeInternalRedirect('//evil.com', '/studio')).toBe('/studio');
    expect(sanitizeInternalRedirect('https://evil.com', '/studio')).toBe('/studio');
    expect(sanitizeInternalRedirect('/\\evil.com', '/studio')).toBe('/studio');
    expect(sanitizeInternalRedirect('javascript:alert(1)', '/studio')).toBe('/studio');
  });

  it('allows protected workspace paths for return-after-login', () => {
    expect(sanitizeInternalRedirect('/settings', '/home')).toBe('/settings');
    expect(sanitizeInternalRedirect('/quick-generation', '/home')).toBe('/quick-generation');
  });

  it('rejects guest-only routes and landing as redirect targets', () => {
    expect(sanitizeInternalRedirect('/login', '/home')).toBe('/home');
    expect(sanitizeInternalRedirect('/', '/home')).toBe('/home');
  });

  it('builds login URL with encoded redirect', () => {
    expect(loginPathWithRedirect('/studio')).toBe('/login?redirect=%2Fstudio');
    expect(loginPathWithRedirect('/studio?niche=forex-ict')).toBe(
      '/login?redirect=%2Fstudio%3Fniche%3Dforex-ict',
    );
  });

  it('uses studio as default fallback constant', () => {
    expect(CLICKLAB_STUDIO_ENTRY_PATH).toBe('/studio');
  });
});
