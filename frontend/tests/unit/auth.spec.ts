import { describe, it, expect, vi, beforeEach } from 'vitest';

import { generateSessionToken, encodeUuid, verifyUuid, createSession, validateSessionBySessionId } from '../../server/utils/auth';
import { db } from '../../server/database';

// Mock drizzle db and related tables used inside auth utils
vi.mock('../../server/database', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(async () => [{ id: 'session-id' }]),
    delete: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    query: {
      sessionTable: {
        findFirst: vi.fn(async () => null),
      },
    },
  },
}));

vi.mock('../../server/database/schemas/session.schema', () => ({
  sessionTable: { id: 'id', userId: 'userId' },
}));

vi.mock('../../server/database/schemas/subscription.schema', () => ({
  subscriptionTable: { createdAt: 'createdAt' },
}));

describe('utils/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generateSessionToken returns a base32-like token', () => {
    const t = generateSessionToken();
    expect(typeof t).toBe('string');
    expect(t.length).toBeGreaterThan(10);
  });

  it('encodeUuid and verifyUuid match for same id', async () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    const enc = await encodeUuid(id);
    expect(await verifyUuid(id, enc)).toBe(true);
  });

  it('createSession inserts and returns session', async () => {
    const session = await createSession('token', 'user1');
    expect(session).toBeTruthy();
    expect((db.insert as any).mock.calls.length).toBeGreaterThan(0);
  });

  it('validateSessionBySessionId returns nulls when not found', async () => {
    const res = await validateSessionBySessionId('nope');
    expect(res.session).toBeNull();
    expect(res.user).toBeNull();
  });
});