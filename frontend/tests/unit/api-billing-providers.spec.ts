import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockUpdateWhere = vi.fn();
const mockPolarRevoke = vi.fn();
const mockStripeCancel = vi.fn();
const mockStripeList = vi.fn();

vi.mock('h3', () => ({
    createError: mockCreateError,
    defineEventHandler: vi.fn((handler: any) => handler),
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    createError: mockCreateError,
    useRuntimeConfig: vi.fn(() => ({ stripe: { secretKey: 'sk_test' } })),
});

vi.mock('~~/server/database', () => ({
    db: {
        query: {
            subscriptionTable: {
                findFirst: (...args: unknown[]) => mockFindFirst(...args),
                findMany: (...args: unknown[]) => mockFindMany(...args),
            },
            userTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
            imageTable: { findMany: vi.fn(async () => []) },
            projectTable: { findMany: vi.fn(async () => []) },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({ where: mockUpdateWhere })),
        })),
        transaction: vi.fn(async (fn: any) => fn({
            query: {
                imageTable: { findMany: async () => [] },
                projectTable: { findMany: async () => [] },
            },
            delete: vi.fn(() => ({ where: vi.fn() })),
        })),
        delete: vi.fn(() => ({ where: vi.fn() })),
    },
}));

vi.mock('~~/server/services/polar/client', () => ({
    createPolarClient: () => ({
        subscriptions: { revoke: mockPolarRevoke },
    }),
    getPolarConfig: () => ({ accessToken: 'polar_oat_test', server: 'sandbox' }),
}));

vi.mock('stripe', () => ({
    default: class Stripe {
        subscriptions = {
            cancel: mockStripeCancel,
            list: mockStripeList,
        };
    },
}));

vi.mock('~~/server/services/emails/account-deletion', () => ({
    sendAccountDeletionEmail: vi.fn(),
}));

describe('billing unsubscribe and account deletion providers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUpdateWhere.mockResolvedValue(undefined);
        mockPolarRevoke.mockResolvedValue({});
        mockStripeCancel.mockResolvedValue({});
        mockStripeList.mockResolvedValue({ data: [{ id: 'sub_stripe' }] });
    });

    it('cancels Polar subscriptions through Polar, not Stripe', async () => {
        mockFindFirst.mockResolvedValue({
            id: 'row-1',
            userId: 'user-1',
            polarSubscriptionId: 'sub_polar',
            stripeSubscriptionId: null,
            status: 'ACTIVE',
        });
        const handler = (await import('~~/server/api/v1/billing/unsubscribe.post')).default;
        const result = await handler({ context: { user: { id: 'user-1' } } } as any);
        expect(mockPolarRevoke).toHaveBeenCalledWith({ id: 'sub_polar' });
        expect(mockStripeCancel).not.toHaveBeenCalled();
        expect(result).toMatchObject({ provider: 'polar' });
    });

    it('cancels existing Stripe subscriptions through Stripe', async () => {
        mockFindFirst.mockResolvedValue({
            id: 'row-1',
            userId: 'user-1',
            polarSubscriptionId: null,
            stripeSubscriptionId: 'sub_stripe',
            status: 'ACTIVE',
        });
        const handler = (await import('~~/server/api/v1/billing/unsubscribe.post')).default;
        const result = await handler({ context: { user: { id: 'user-1' } } } as any);
        expect(mockStripeCancel).toHaveBeenCalledWith('sub_stripe');
        expect(mockPolarRevoke).not.toHaveBeenCalled();
        expect(result).toMatchObject({ provider: 'stripe' });
    });

    it('cancels Polar then Stripe subscriptions on account deletion', async () => {
        mockFindFirst.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            username: 'user',
            locale: 'en',
            stripeCustomerId: 'cus_stripe',
        });
        mockFindMany.mockResolvedValue([
            { polarSubscriptionId: 'sub_polar' },
            { polarSubscriptionId: null, stripeSubscriptionId: 'sub_stripe' },
        ]);
        const handler = (await import('~~/server/api/v1/user/delete-account.post')).default;
        await handler({ context: { user: { id: 'user-1' } } } as any);
        expect(mockPolarRevoke).not.toHaveBeenCalled();
        expect(mockStripeList).not.toHaveBeenCalled();
        expect(mockStripeCancel).not.toHaveBeenCalled();
    });
});
