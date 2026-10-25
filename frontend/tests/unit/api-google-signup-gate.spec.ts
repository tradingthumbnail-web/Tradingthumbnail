import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadBody = vi.fn();
const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});
const mockSetCookie = vi.fn();
const mockVerifyGoogleIdentity = vi.hoisted(() => vi.fn());
const mockFindOrCreateGoogleUser = vi.hoisted(() => vi.fn());
const mockIssueAuthSession = vi.hoisted(() => vi.fn());

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
});

vi.mock('~~/server/services/auth/google-oauth', () => ({
    verifyGoogleIdentity: (...args: unknown[]) => mockVerifyGoogleIdentity(...args),
    findOrCreateGoogleUser: (...args: unknown[]) => mockFindOrCreateGoogleUser(...args),
    issueAuthSession: (...args: unknown[]) => mockIssueAuthSession(...args),
}));

describe('API: Google signup gate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockReadBody.mockResolvedValue({ token: 'google-id-token' });
        mockVerifyGoogleIdentity.mockResolvedValue({
            email: 'new-user@example.com',
            name: 'New User',
            givenName: 'New',
        });
        mockFindOrCreateGoogleUser.mockResolvedValue('user-id');
        mockIssueAuthSession.mockResolvedValue(undefined);
    });

    it('rejects requests when token is missing', async () => {
        mockReadBody.mockResolvedValue({});
        const handler = (await import('~~/server/api/v1/auth/google/validate-token.post')).default;

        await expect(handler({ node: { res: { statusCode: 200 } } } as any)).rejects.toMatchObject({
            statusCode: 400,
            message: 'Token is required',
        });
        expect(mockVerifyGoogleIdentity).not.toHaveBeenCalled();
    });

    it('creates local session after a valid google token', async () => {
        const handler = (await import('~~/server/api/v1/auth/google/validate-token.post')).default;

        await expect(handler({ node: { res: { statusCode: 200 } } } as any)).resolves.toEqual({
            message: 'Welcome :)',
        });
        expect(mockVerifyGoogleIdentity).toHaveBeenCalledWith(expect.anything(), 'google-id-token');
        expect(mockFindOrCreateGoogleUser).toHaveBeenCalledTimes(1);
        expect(mockIssueAuthSession).toHaveBeenCalledWith(expect.anything(), 'user-id');
    });
});
