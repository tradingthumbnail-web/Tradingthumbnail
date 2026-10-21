import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindFirst = vi.fn();
const mockInsertReturning = vi.fn();
const mockUpdateWhere = vi.fn();
const mockInsertValues = vi.fn();

vi.mock('~~/server/database', () => ({
    db: {
        query: {
            userTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
            paymentTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
            productTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
            tierTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
            subscriptionTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
        },
        insert: vi.fn(() => ({
            values: (...args: unknown[]) => {
                mockInsertValues(...args);
                return {
                    onConflictDoNothing: () => ({
                        returning: mockInsertReturning,
                    }),
                };
            },
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: mockUpdateWhere,
            })),
        })),
    },
}));

vi.mock('~~/server/services/emails/purchase-confirmation', () => ({
    sendPurchaseConfirmationEmail: vi.fn(),
}));
vi.mock('~~/server/services/emails/subscription-activation', () => ({
    sendSubscriptionActivationEmail: vi.fn(),
}));
vi.mock('~~/server/services/emails/successfull-billing-cycle', () => ({
    sendEmailForBillingCycle: vi.fn(),
}));

Object.assign(globalThis, {
    createError: (opts: { statusCode: number; statusMessage: string }) => {
        const err = new Error(opts.statusMessage);
        (err as any).statusCode = opts.statusCode;
        return err;
    },
});

import { applyPaidPolarOrder, applyPolarCancellation, applyPolarPastDue } from '~~/server/services/polar/apply-order';
import { getProductEntitlements } from '~~/server/services/polar/catalog';
import { sendEmailForBillingCycle } from '~~/server/services/emails/successfull-billing-cycle';
import { sendSubscriptionActivationEmail } from '~~/server/services/emails/subscription-activation';

const USER_ID = '901617ea-87ae-4b32-ab5c-8005ca73ee36';
const OTHER_USER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const PLUS_POLAR_PRODUCT = 'polar_prod_plus';
const AVATAR_POLAR_PRODUCT = 'polar_prod_avatar';

function paidOrder(overrides: Record<string, unknown> = {}) {
    return {
        id: 'order_1',
        billingReason: 'subscription_create',
        productId: PLUS_POLAR_PRODUCT,
        customerId: 'cus_polar',
        checkoutId: 'chk_1',
        subscriptionId: 'sub_polar',
        totalAmount: 1990,
        currency: 'eur',
        createdAt: new Date('2026-01-01'),
        metadata: { userId: USER_ID },
        customer: { id: 'cus_polar', externalId: USER_ID },
        product: { id: PLUS_POLAR_PRODUCT },
        ...overrides,
    } as any;
}

describe('Polar paid-order fulfillment', () => {
    const user = {
        id: USER_ID,
        email: 'user@example.com',
        username: 'user',
        locale: 'en',
        polarCustomerId: null,
        credit: 20,
        avatarCredit: 0,
    };
    const plusTier = {
        id: 7,
        name: 'KiThumbs Plus',
        polarProductId: PLUS_POLAR_PRODUCT,
        features: { maxCredits: 75 },
        avatarSlots: 3,
    };
    const avatarProduct = {
        id: '3f9cfba6-8ea7-4ac3-afaf-1087806ebb98',
        name: 'KiThumbs Avatar',
        polarProductId: AVATAR_POLAR_PRODUCT,
        metadata: { avatarCredits: 1 },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockFindFirst.mockReset();
        mockInsertReturning.mockResolvedValue([{ id: 1 }]);
        mockUpdateWhere.mockResolvedValue(undefined);
    });

    it('grants maxCredits + 1 avatar credit on initial subscription payment', async () => {
        mockFindFirst
            .mockResolvedValueOnce(user) // resolve user
            .mockResolvedValueOnce(undefined) // existing payment
            .mockResolvedValueOnce(undefined) // monthly tier miss first? findTier tries monthly then yearly
            .mockResolvedValueOnce(plusTier)
            .mockResolvedValueOnce(undefined); // existing subscription

        const result = await applyPaidPolarOrder(paidOrder());
        expect(result).toEqual({ granted: true, reason: 'subscription-create' });
        expect(sendSubscriptionActivationEmail).toHaveBeenCalled();
        expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({
            polarOrderId: 'order_1',
            userId: USER_ID,
        }));
    });

    it('resets generation credits on renewal and does not grant avatar credit', async () => {
        mockFindFirst
            .mockResolvedValueOnce(user)
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(plusTier)
            .mockResolvedValueOnce({ id: 'sub-row', userId: USER_ID });

        const result = await applyPaidPolarOrder(paidOrder({
            id: 'order_renew',
            billingReason: 'subscription_cycle',
        }));
        expect(result).toEqual({ granted: true, reason: 'subscription-cycle' });
        expect(sendEmailForBillingCycle).toHaveBeenCalled();
        expect(sendSubscriptionActivationEmail).not.toHaveBeenCalled();
    });

    it('does not grant credits twice for the same Polar order', async () => {
        mockFindFirst
            .mockResolvedValueOnce(user)
            .mockResolvedValueOnce({ id: 99, polarOrderId: 'order_1' });

        const result = await applyPaidPolarOrder(paidOrder());
        expect(result).toEqual({ granted: false, reason: 'duplicate-order' });
        expect(mockInsertValues).not.toHaveBeenCalled();
    });

    it('grants avatar credits from product metadata, not product name', async () => {
        mockFindFirst
            .mockResolvedValueOnce(user)
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(avatarProduct);

        const result = await applyPaidPolarOrder(paidOrder({
            billingReason: 'purchase',
            productId: AVATAR_POLAR_PRODUCT,
            subscriptionId: null,
            product: { id: AVATAR_POLAR_PRODUCT, name: 'Anything Else' },
        }));
        expect(result).toEqual({ granted: true, reason: 'one-time' });
        expect(getProductEntitlements(avatarProduct as any)).toEqual({ credits: 0, avatarCredits: 1 });
    });

    it('rejects a Polar customer mapped to a different user', async () => {
        await expect(applyPaidPolarOrder(paidOrder({
            metadata: { userId: USER_ID },
            customer: { id: 'cus_polar', externalId: OTHER_USER_ID },
        }))).rejects.toMatchObject({
            statusCode: 400,
            message: 'Polar customer does not match authenticated user',
        });
    });
});

describe('Polar subscription status transitions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('moves ACTIVE Polar subscriptions to PAST_DUE on payment failure', async () => {
        mockFindFirst.mockResolvedValue({
            id: 'sub-row',
            userId: USER_ID,
            polarSubscriptionId: 'sub_polar',
            status: 'ACTIVE',
        });
        const result = await applyPolarPastDue('sub_polar');
        expect(result).toEqual({ status: 'updated', userId: USER_ID });
        expect(mockUpdateWhere).toHaveBeenCalled();
    });

    it('does not claw back credits when cancelling a Polar subscription', async () => {
        mockFindFirst.mockResolvedValue({
            id: 'sub-row',
            userId: USER_ID,
            polarSubscriptionId: 'sub_polar',
            status: 'ACTIVE',
        });
        const result = await applyPolarCancellation('sub_polar');
        expect(result).toEqual({ status: 'updated', userId: USER_ID });
        expect(mockUpdateWhere).toHaveBeenCalled();
    });

    it('is idempotent when Polar cancellation is repeated', async () => {
        mockFindFirst.mockResolvedValue({
            id: 'sub-row',
            userId: USER_ID,
            polarSubscriptionId: 'sub_polar',
            status: 'CANCELLED',
        });
        const result = await applyPolarCancellation('sub_polar');
        expect(result).toEqual({ status: 'already-cancelled', userId: USER_ID });
        expect(mockUpdateWhere).not.toHaveBeenCalled();
    });
});
