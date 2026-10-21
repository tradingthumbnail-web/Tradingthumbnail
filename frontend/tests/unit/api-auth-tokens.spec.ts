import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadBody = vi.fn();
const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});

vi.mock('h3', () => ({
    createError: mockCreateError,
    readBody: mockReadBody,
    defineEventHandler: vi.fn((handler: any) => handler),
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    readBody: mockReadBody,
    createError: mockCreateError,
});

const mockFindFirst = vi.fn();
const mockUpdateWhere = vi.fn();
const mockDeleteWhere = vi.fn();

vi.mock('~~/server/database', () => ({
    db: {
        query: {
            resetTokensTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
            userTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: mockUpdateWhere,
            })),
        })),
        delete: vi.fn(() => ({
            where: mockDeleteWhere,
        })),
    },
}));

vi.mock('@node-rs/argon2', () => ({
    hash: vi.fn(async () => 'hashed-password'),
}));

describe('API: verification and reset tokens', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUpdateWhere.mockResolvedValue(undefined);
        mockDeleteWhere.mockResolvedValue(undefined);
    });

    it('rejects a missing verification token', async () => {
        mockReadBody.mockResolvedValue({});
        const handler = (await import('~~/server/api/v1/auth/validate-email.post')).default;
        await expect(handler({} as any)).rejects.toMatchObject({
            statusCode: 400,
            message: 'Token is required',
        });
    });

    it('rejects an invalid or expired verification token', async () => {
        mockReadBody.mockResolvedValue({ token: 'expired-or-forged' });
        mockFindFirst.mockResolvedValue(null);
        const handler = (await import('~~/server/api/v1/auth/validate-email.post')).default;
        await expect(handler({} as any)).rejects.toMatchObject({
            statusCode: 400,
            message: 'Invalid or expired token',
        });
    });

    it('invalidates a verification token after successful use so it cannot be reused', async () => {
        mockReadBody.mockResolvedValue({ token: 'valid-token' });
        mockFindFirst
            .mockResolvedValueOnce({
                tokenHash: 'verify:abc',
                userId: 'user-a',
                expiresAt: new Date(Date.now() + 60_000),
            })
            .mockResolvedValueOnce({
                id: 'user-a',
                validationDate: null,
            });

        const handler = (await import('~~/server/api/v1/auth/validate-email.post')).default;
        await expect(handler({} as any)).resolves.toEqual({ success: true });
        expect(mockDeleteWhere).toHaveBeenCalled();

        mockFindFirst.mockResolvedValue(null);
        await expect(handler({} as any)).rejects.toMatchObject({
            statusCode: 400,
            message: 'Invalid or expired token',
        });
    });

    it('rejects an invalid or expired password reset token', async () => {
        mockReadBody.mockResolvedValue({ token: 'forged', password: 'new-password' });
        mockFindFirst.mockResolvedValue(null);
        const handler = (await import('~~/server/api/v1/auth/change-password.post')).default;
        await expect(handler({} as any)).rejects.toMatchObject({
            statusCode: 400,
            message: 'Invalid or expired token',
        });
        expect(mockUpdateWhere).not.toHaveBeenCalled();
    });

    it('invalidates a reset token after the password is changed', async () => {
        mockReadBody.mockResolvedValue({ token: 'valid-reset', password: 'new-password' });
        mockFindFirst.mockResolvedValue({
            tokenHash: 'reset:abc',
            user: { id: 'user-a' },
        });
        const handler = (await import('~~/server/api/v1/auth/change-password.post')).default;
        await expect(handler({} as any)).resolves.toMatchObject({ statusCode: 200 });
        expect(mockDeleteWhere).toHaveBeenCalled();
    });
});
