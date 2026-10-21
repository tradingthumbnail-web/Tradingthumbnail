import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadBody = vi.fn();
const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});
const mockSetCookie = vi.fn();
const mockUseRuntimeConfig = vi.fn();
const mockVerifyIdToken = vi.hoisted(() => vi.fn());
const mockFindFirst = vi.hoisted(() => vi.fn());
const mockInsertValues = vi.hoisted(() => vi.fn());

vi.mock('h3', () => ({
    createError: mockCreateError,
    readBody: mockReadBody,
    defineEventHandler: vi.fn((handler: any) => handler),
    setCookie: mockSetCookie,
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    readBody: mockReadBody,
    createError: mockCreateError,
    setCookie: mockSetCookie,
    useRuntimeConfig: mockUseRuntimeConfig,
});

vi.mock('google-auth-library', () => ({
    OAuth2Client: class {
        verifyIdToken = mockVerifyIdToken;
    },
}));

vi.mock('~~/server/database', () => ({
    db: {
        query: {
            userTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
        },
        insert: vi.fn(() => ({
            values: mockInsertValues,
        })),
    },
}));

vi.mock('~~/server/utils/auth', () => ({
    generateSessionToken: vi.fn(() => 'session-token'),
    createSession: vi.fn(async () => ({ id: 'session-id' })),
    invalidateSessionByUserId: vi.fn(() => Promise.resolve()),
}));

describe('API: Google signup gate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockReadBody.mockResolvedValue({ token: 'google-id-token' });
        mockUseRuntimeConfig.mockReturnValue({
            googleClientId: 'client-id',
            googleSecretId: 'client-secret',
            public: {
                appUrl: 'https://app.example.com',
                enableSignIn: false,
            },
        });
        mockVerifyIdToken.mockResolvedValue({
            getPayload: () => ({
                email: 'new-user@example.com',
                name: 'New User',
                given_name: 'New',
            }),
        });
        mockInsertValues.mockReturnValue({
            returning: vi.fn(async () => [{ id: 'new-user-id' }]),
        });
    });

    it('blocks Google account creation when the signup gate is disabled', async () => {
        mockFindFirst.mockResolvedValue(null);
        const handler = (await import('~~/server/api/v1/auth/google/validate-token.post')).default;

        await expect(handler({ node: { res: { statusCode: 200 } } } as any)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Sign in is not enabled',
        });
        expect(mockInsertValues).not.toHaveBeenCalled();
    });

    it('still allows login for an existing Google user when signup is disabled', async () => {
        mockFindFirst.mockResolvedValue({ id: 'existing-user', email: 'new-user@example.com' });
        const handler = (await import('~~/server/api/v1/auth/google/validate-token.post')).default;

        await expect(handler({ node: { res: { statusCode: 200 } } } as any)).resolves.toEqual({
            message: 'Welcome :)',
        });
        expect(mockInsertValues).not.toHaveBeenCalled();
    });
});
