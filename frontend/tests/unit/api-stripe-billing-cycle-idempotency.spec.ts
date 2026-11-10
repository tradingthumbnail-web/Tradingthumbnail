import { beforeEach, describe, expect, it, vi } from "vitest";

const mockReadRawBody = vi.fn();
const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});
const mockUseRuntimeConfig = vi.fn();
const mockConstructEvent = vi.fn();
const mockSendBillingEmail = vi.fn();
const mockFindUser = vi.fn();
const mockTransaction = vi.fn();

vi.mock("h3", () => ({
    createError: mockCreateError,
    readRawBody: mockReadRawBody,
    defineEventHandler: vi.fn((handler: any) => handler),
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    createError: mockCreateError,
    readRawBody: mockReadRawBody,
    useRuntimeConfig: mockUseRuntimeConfig,
});

vi.mock("stripe", () => ({
    default: class Stripe {
        webhooks = {
            constructEvent: mockConstructEvent,
        };
    },
}));

vi.mock("~~/server/services/emails/successfull-billing-cycle", () => ({
    sendEmailForBillingCycle: (...args: unknown[]) => mockSendBillingEmail(...args),
}));

vi.mock("~~/server/database", () => ({
    db: {
        query: {
            userTable: {
                findFirst: (...args: unknown[]) => mockFindUser(...args),
            },
        },
        transaction: (...args: unknown[]) => mockTransaction(...args),
    },
}));

describe("API: stripe billing-cycle webhook idempotency", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockReadRawBody.mockResolvedValue("{}");
        mockUseRuntimeConfig.mockReturnValue({
            stripe: {
                secretKey: "sk_test",
                webhookSecret: { billingCycle: "whsec_test" },
            },
        });
        mockConstructEvent.mockReturnValue({
            type: "invoice.payment_succeeded",
            data: {
                object: {
                    id: "in_123",
                    billing_reason: "subscription_cycle",
                    customer_email: "user@example.com",
                    payments: {
                        data: [{ payment: { payment_intent: "pi_123" } }],
                    },
                    amount_paid: 1200,
                    currency: "usd",
                    period_start: 1000,
                    period_end: 2000,
                    hosted_invoice_url: "https://stripe.test/in_123",
                },
            },
        });
        mockFindUser.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            username: "user",
            locale: "en",
            subscriptions: [
                {
                    id: "sub-1",
                    status: "ACTIVE",
                    tier: {
                        id: 1,
                        name: "Pro",
                        stripePriceId: "price_1",
                        features: { maxCredits: 100 },
                    },
                },
            ],
        });
    });

    it("skips credit/subscription updates when invoice is already processed", async () => {
        const txUpdateUser = vi.fn();
        const txUpdateSub = vi.fn();
        const txInsertValues = vi.fn(() => ({
            onConflictDoNothing: vi.fn(() => ({
                returning: vi.fn(async () => []),
            })),
        }));
        mockTransaction.mockImplementation(async (callback: any) => {
            return callback({
                insert: vi.fn(() => ({ values: txInsertValues })),
                update: vi.fn((table: any) => ({
                    set: table?.name === "user" ? txUpdateUser : txUpdateSub,
                })),
            });
        });

        const handler = (await import("~~/server/api/webhook/stripe/subscription-billing-cycle")).default;
        const result = await handler({
            headers: new Headers({ "stripe-signature": "sig_test" }),
        } as any);

        expect(txUpdateUser).not.toHaveBeenCalled();
        expect(txUpdateSub).not.toHaveBeenCalled();
        expect(mockSendBillingEmail).not.toHaveBeenCalled();
        expect(result).toMatchObject({ statusCode: 200 });
    });
});
