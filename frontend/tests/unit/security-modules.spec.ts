import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});

Object.assign(globalThis, { createError: mockCreateError });

const mockReturning = vi.fn();
const mockWhere = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockFindFirst = vi.fn();

vi.mock('~~/server/database', () => ({
    db: {
        update: (...args: unknown[]) => mockUpdate(...args),
        query: {
            imageTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
            avatarTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
            subscriptionTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
        },
    },
}));

import { requireUserId } from '~~/server/utils/require-user';
import { assertSignupEnabled, isSignupEnabled } from '~~/server/utils/signup-gate';
import {
    generateSecretToken,
    hashSecretToken,
    resetTokenHash,
    verifyTokenHash,
} from '~~/server/utils/secure-token';
import {
    computeQuickGenerationCost,
    computePhotoshootCost,
    clampQuickGenerationImageCount,
} from '~~/server/services/generation/generation-cost';
import { deductUserCredits, runChargedWork } from '~~/server/services/user/credits';
import { getOwnedImage, getOwnedImageOrThrow } from '~~/server/services/image.service';
import { getOwnedAvatarOrThrow } from '~~/server/services/avatar/owned-avatar';
import { applyVerifiedSubscriptionCancellation } from '~~/server/services/stripe/apply-subscription-cancellation';

describe('security: authentication helper', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects unauthenticated requests', () => {
        expect(() => requireUserId({ context: {} } as any)).toThrowError('Unauthorized');
        expect(mockCreateError).toHaveBeenCalledWith({ statusCode: 401, statusMessage: 'Unauthorized' });
    });

    it('returns the authenticated user id', () => {
        expect(requireUserId({ context: { user: { id: 'user-a' } } } as any)).toBe('user-a');
    });
});

describe('security: signup gate', () => {
    it('treats boolean false and string "false" as disabled', () => {
        expect(isSignupEnabled(false)).toBe(false);
        expect(isSignupEnabled('false')).toBe(false);
        expect(isSignupEnabled('FALSE')).toBe(false);
        expect(isSignupEnabled(true)).toBe(true);
        expect(isSignupEnabled('true')).toBe(true);
        expect(isSignupEnabled(undefined)).toBe(true);
    });

    it('throws 403 when signup is disabled', () => {
        expect(() => assertSignupEnabled(false)).toThrowError('Sign in is not enabled');
        expect(mockCreateError).toHaveBeenCalledWith({
            statusCode: 403,
            statusMessage: 'Sign in is not enabled',
        });
    });
});

describe('security: verification and reset tokens', () => {
    it('issues cryptographically random tokens that are not user-id derived', () => {
        const a = generateSecretToken();
        const b = generateSecretToken();
        expect(a).not.toEqual(b);
        expect(a.length).toBeGreaterThan(20);
        expect(a).not.toContain('user-123');
    });

    it('stores only hashed representations with type prefixes', () => {
        const raw = generateSecretToken();
        expect(hashSecretToken(raw)).toMatch(/^[a-f0-9]{64}$/);
        expect(verifyTokenHash(raw).startsWith('verify:')).toBe(true);
        expect(resetTokenHash(raw).startsWith('reset:')).toBe(true);
        expect(verifyTokenHash(raw)).not.toBe(raw);
        expect(resetTokenHash(raw)).not.toBe(verifyTokenHash(raw));
    });

    it('does not accept a verification token as a reset token', () => {
        const raw = generateSecretToken();
        expect(verifyTokenHash(raw)).not.toEqual(resetTokenHash(raw));
    });
});

describe('security: generation cost is server-computed', () => {
    it('ignores client attempts to generate more images than the billed cap', () => {
        expect(clampQuickGenerationImageCount(99)).toBe(4);
        expect(computeQuickGenerationCost({
            numberOfImages: 99,
            imageQuality: 'low',
        })).toBe(computeQuickGenerationCost({
            numberOfImages: 4,
            imageQuality: 'low',
        }));
    });

    it('does not trust a client-supplied cheap quality for nano-banana-2 options', () => {
        const billed = computeQuickGenerationCost({
            numberOfImages: 1,
            imageQuality: 'low',
            model: 'fal-ai/nano-banana-2',
            modelOptions: { resolution: '4K', enableWebSearch: true },
        });
        expect(billed).toBeGreaterThan(3);
        expect(billed).toBe(10);
    });

    it('clamps photoshoot variations so cost cannot be spoofed downward or exploded', () => {
        expect(computePhotoshootCost(1)).toBe(1);
        expect(computePhotoshootCost(8)).toBe(8);
        expect(computePhotoshootCost(1000)).toBe(8);
        expect(computePhotoshootCost(0)).toBe(1);
    });
});

describe('security: credit deduction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSet.mockReturnValue({ where: mockWhere });
        mockWhere.mockReturnValue({ returning: mockReturning });
        mockUpdate.mockReturnValue({ set: mockSet });
    });

    it('rejects insufficient credits with 402', async () => {
        mockReturning.mockResolvedValue([]);
        await expect(deductUserCredits('user-a', 5)).rejects.toMatchObject({
            message: 'User does not have enough credit',
            statusCode: 402,
        });
    });

    it('does not trust a client-supplied zero/negative charge as a bypass of a positive cost', async () => {
        await expect(deductUserCredits('user-a', -10)).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('refunds credits when charged work fails', async () => {
        mockReturning
            .mockResolvedValueOnce([{ id: 'user-a', credit: 7 }])
            .mockResolvedValueOnce([{ id: 'user-a', credit: 10 }]);

        await expect(runChargedWork('user-a', 3, async () => {
            throw new Error('provider failed');
        })).rejects.toThrow('provider failed');

        expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    it('does not refund when charged work succeeds', async () => {
        mockReturning.mockResolvedValue([{ id: 'user-a', credit: 7 }]);
        const result = await runChargedWork('user-a', 3, async () => 'ok');
        expect(result).toBe('ok');
        expect(mockUpdate).toHaveBeenCalledTimes(1);
    });
});

describe('security: ownership lookups', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not return another user\'s image', async () => {
        mockFindFirst.mockResolvedValue(null);
        await expect(getOwnedImage('img-b', 'user-a')).resolves.toBeNull();
        await expect(getOwnedImageOrThrow('img-b', 'user-a')).rejects.toMatchObject({
            message: 'Image not found',
            statusCode: 404,
        });
    });

    it('does not return another user\'s avatar', async () => {
        mockFindFirst.mockResolvedValue(null);
        await expect(getOwnedAvatarOrThrow('avatar-b', 'user-a')).rejects.toMatchObject({
            message: 'Avatar not found',
            statusCode: 404,
        });
    });
});

describe('security: stripe cancellation mapping', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSet.mockReturnValue({ where: mockWhere });
        mockWhere.mockResolvedValue(undefined);
        mockUpdate.mockReturnValue({ set: mockSet });
    });

    it('updates the mapped user subscription to CANCELLED', async () => {
        mockFindFirst.mockResolvedValue({
            id: 'sub-row-1',
            userId: 'user-a',
            stripeSubscriptionId: 'sub_123',
            status: 'ACTIVE',
        });

        await expect(applyVerifiedSubscriptionCancellation('sub_123')).resolves.toEqual({
            userId: 'user-a',
            status: 'updated',
        });
        expect(mockUpdate).toHaveBeenCalled();
    });

    it('is idempotent when already cancelled', async () => {
        mockFindFirst.mockResolvedValue({
            id: 'sub-row-1',
            userId: 'user-a',
            stripeSubscriptionId: 'sub_123',
            status: 'CANCELLED',
        });

        await expect(applyVerifiedSubscriptionCancellation('sub_123')).resolves.toEqual({
            userId: 'user-a',
            status: 'already-cancelled',
        });
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('does not update an arbitrary user when the Stripe subscription is unknown', async () => {
        mockFindFirst.mockResolvedValue(undefined);
        await expect(applyVerifiedSubscriptionCancellation('sub_unknown')).resolves.toEqual({
            userId: null,
            status: 'not-found',
        });
        expect(mockUpdate).not.toHaveBeenCalled();
    });
});
