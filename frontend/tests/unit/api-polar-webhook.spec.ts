import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadRawBody = vi.fn();
const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});
const mockUseRuntimeConfig = vi.fn();
const mockValidateEvent = vi.fn();
const mockApplyPaidPolarOrder = vi.fn();
const mockApplyPolarCancellation = vi.fn();
const mockApplyPolarPastDue = vi.fn();
const mockApplyPolarSubscriptionSnapshot = vi.fn();
const mockResolveUserFromPolarSubscription = vi.fn();
const mockFindTierByPolarProductId = vi.fn();

vi.mock('h3', () => ({
    createError: mockCreateError,
    readRawBody: mockReadRawBody,
    defineEventHandler: vi.fn((handler: any) => handler),
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    readRawBody: mockReadRawBody,
    createError: mockCreateError,
    useRuntimeConfig: mockUseRuntimeConfig,
});

class FakeWebhookVerificationError extends Error {}

vi.mock('@polar-sh/sdk/webhooks', () => ({
    validateEvent: (...args: unknown[]) => mockValidateEvent(...args),
    WebhookVerificationError: FakeWebhookVerificationError,
}));

vi.mock('~~/server/services/polar/client', () => ({
    getPolarConfig: () => ({ webhookSecret: 'polar_whsec', accessToken: 'token', server: 'sandbox' }),
}));

vi.mock('~~/server/services/polar/apply-order', () => ({
    applyPaidPolarOrder: (...args: unknown[]) => mockApplyPaidPolarOrder(...args),
    applyPolarCancellation: (...args: unknown[]) => mockApplyPolarCancellation(...args),
    applyPolarPastDue: (...args: unknown[]) => mockApplyPolarPastDue(...args),
    applyPolarSubscriptionSnapshot: (...args: unknown[]) => mockApplyPolarSubscriptionSnapshot(...args),
    resolveUserFromPolarSubscription: (...args: unknown[]) => mockResolveUserFromPolarSubscription(...args),
}));

vi.mock('~~/server/services/polar/catalog', () => ({
    findTierByPolarProductId: (...args: unknown[]) => mockFindTierByPolarProductId(...args),
}));

vi.mock('~~/server/database', () => ({
    db: {
        query: {
            userTable: { findFirst: vi.fn() },
        },
    },
}));

vi.mock('~~/server/services/emails/payment-failed-to-due', () => ({
    sendPaymentFailedToDueEmail: vi.fn(),
}));
vi.mock('~~/server/services/emails/subscription-cancellation', () => ({
    sendSubscriptionCancellationEmail: vi.fn(),
}));

describe('API: Polar webhook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockReadRawBody.mockResolvedValue('{"type":"order.paid"}');
        mockUseRuntimeConfig.mockReturnValue({
            polar: { webhookSecret: 'polar_whsec' },
        });
        mockApplyPaidPolarOrder.mockResolvedValue({ granted: true, reason: 'subscription-create' });
        mockApplyPolarCancellation.mockResolvedValue({ status: 'updated', userId: 'user-1' });
        mockApplyPolarPastDue.mockResolvedValue({ status: 'updated', userId: 'user-1' });
        mockFindTierByPolarProductId.mockResolvedValue({ id: 7, features: { maxCredits: 75 } });
        mockResolveUserFromPolarSubscription.mockResolvedValue({ id: 'user-1' });
    });

    function event() {
        return {
            headers: {
                get: (name: string) => {
                    if (name === 'webhook-id') return 'wh_1';
                    if (name === 'webhook-timestamp') return '1';
                    if (name === 'webhook-signature') return 'sig';
                    return null;
                },
            },
            node: { res: { statusCode: 200 } },
        } as any;
    }

    it('rejects an invalid Polar webhook signature', async () => {
        mockValidateEvent.mockImplementation(() => {
            throw new FakeWebhookVerificationError('bad');
        });
        const handler = (await import('~~/server/api/webhook/polar.post')).default;
        await expect(handler(event())).rejects.toMatchObject({ statusCode: 403 });
        expect(mockApplyPaidPolarOrder).not.toHaveBeenCalled();
    });

    it('fulfills checkout completion on order.paid', async () => {
        mockValidateEvent.mockReturnValue({
            type: 'order.paid',
            data: { id: 'order_1', billingReason: 'subscription_create' },
        });
        const handler = (await import('~~/server/api/webhook/polar.post')).default;
        const result = await handler(event());
        expect(mockApplyPaidPolarOrder).toHaveBeenCalled();
        expect(result).toEqual({ received: true });
    });

    it('does not fulfill credits on subscription.cycled (renewal credits wait for order.paid)', async () => {
        mockValidateEvent.mockReturnValue({
            type: 'subscription.cycled',
            data: { id: 'sub_1', productId: 'polar_plus', currentPeriodStart: new Date(), currentPeriodEnd: new Date() },
        });
        const handler = (await import('~~/server/api/webhook/polar.post')).default;
        await handler(event());
        expect(mockApplyPaidPolarOrder).not.toHaveBeenCalled();
        expect(mockApplyPolarSubscriptionSnapshot).toHaveBeenCalled();
    });

    it('cancels on subscription.revoked without granting credits', async () => {
        mockValidateEvent.mockReturnValue({
            type: 'subscription.revoked',
            data: { id: 'sub_1' },
        });
        const handler = (await import('~~/server/api/webhook/polar.post')).default;
        await handler(event());
        expect(mockApplyPolarCancellation).toHaveBeenCalledWith('sub_1');
        expect(mockApplyPaidPolarOrder).not.toHaveBeenCalled();
    });
});
