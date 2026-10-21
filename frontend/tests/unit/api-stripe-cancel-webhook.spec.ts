import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadRawBody = vi.fn();
const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});
const mockUseRuntimeConfig = vi.fn();
const mockConstructEvent = vi.hoisted(() => vi.fn());
const mockFindFirst = vi.hoisted(() => vi.fn());
const mockUpdateWhere = vi.hoisted(() => vi.fn());
const mockSendEmail = vi.hoisted(() => vi.fn());

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

vi.mock('stripe', () => ({
    default: class Stripe {
        webhooks = { constructEvent: mockConstructEvent };
    },
}));

vi.mock('~~/server/database', () => ({
    db: {
        query: {
            subscriptionTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
            userTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: mockUpdateWhere,
            })),
        })),
    },
}));

vi.mock('~~/server/services/emails/subscription-cancellation', () => ({
    sendSubscriptionCancellationEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

function webhookEvent(signature: string | null) {
    return {
        headers: {
            get: (name: string) => (name === 'stripe-signature' ? signature : null),
        },
    } as any;
}

describe('API: Stripe cancellation webhook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockReadRawBody.mockResolvedValue('{"id":"evt_1"}');
        mockUseRuntimeConfig.mockReturnValue({
            stripe: {
                secretKey: 'sk_test',
                webhookSecret: { cancelSubscription: 'whsec_test' },
            },
        });
        mockUpdateWhere.mockResolvedValue(undefined);
        mockSendEmail.mockResolvedValue(undefined);
    });

    it('rejects a webhook with an invalid signature', async () => {
        mockConstructEvent.mockImplementation(() => {
            throw new Error('Invalid signature');
        });
        const handler = (await import('~~/server/api/webhook/stripe/cancel-subscription.post')).default;

        await expect(handler(webhookEvent('bad-sig'))).rejects.toMatchObject({
            statusCode: 400,
            message: 'Error verifying webhook',
        });
        expect(mockFindFirst).not.toHaveBeenCalled();
        expect(mockUpdateWhere).not.toHaveBeenCalled();
    });

    it('rejects a webhook with no signature', async () => {
        const handler = (await import('~~/server/api/webhook/stripe/cancel-subscription.post')).default;
        await expect(handler(webhookEvent(null))).rejects.toMatchObject({
            statusCode: 400,
            message: 'No signature',
        });
        expect(mockConstructEvent).not.toHaveBeenCalled();
    });

    it('maps a verified cancellation to the correct user and updates status', async () => {
        mockConstructEvent.mockReturnValue({
            type: 'customer.subscription.deleted',
            data: { object: { id: 'sub_abc' } },
        });
        mockFindFirst
            .mockResolvedValueOnce({
                id: 'row-1',
                userId: 'user-a',
                stripeSubscriptionId: 'sub_abc',
                status: 'ACTIVE',
            })
            .mockResolvedValueOnce({
                id: 'user-a',
                email: 'user@example.com',
                username: 'user-a',
                locale: 'en',
            });

        const handler = (await import('~~/server/api/webhook/stripe/cancel-subscription.post')).default;
        await expect(handler(webhookEvent('valid-sig'))).resolves.toMatchObject({
            statusCode: 200,
        });
        expect(mockConstructEvent).toHaveBeenCalledWith('{"id":"evt_1"}', 'valid-sig', 'whsec_test');
        expect(mockUpdateWhere).toHaveBeenCalled();
        expect(mockSendEmail).toHaveBeenCalledWith('user@example.com', 'user-a', 'en');
    });
});
