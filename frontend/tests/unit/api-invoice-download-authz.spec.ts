import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetRouterParams = vi.fn();
const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});
const mockUseRuntimeConfig = vi.fn();
const mockStripeRetrieve = vi.fn();

vi.mock("h3", () => ({
    createError: mockCreateError,
    getRouterParams: mockGetRouterParams,
    defineEventHandler: vi.fn((handler: any) => handler),
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    createError: mockCreateError,
    getRouterParams: mockGetRouterParams,
    useRuntimeConfig: mockUseRuntimeConfig,
});

vi.mock("stripe", () => ({
    default: class Stripe {
        invoices = {
            retrieve: mockStripeRetrieve,
        };
    }
}));

describe("API: invoice download authorization", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetRouterParams.mockReturnValue({ invoiceId: "in_1" });
        mockUseRuntimeConfig.mockReturnValue({
            stripe: { secretKey: "sk_test" },
        });
    });

    it("rejects access when invoice does not belong to current user", async () => {
        mockStripeRetrieve.mockResolvedValue({
            id: "in_1",
            customer: "cus_other",
            hosted_invoice_url: "https://stripe.test/in_1",
        });
        const handler = (await import("~~/server/api/v1/stripe/invoice/[invoiceId]/download.get")).default;
        await expect(handler({ context: { user: { id: "u1", stripeCustomerId: "cus_user" } } } as any)).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    it("returns invoice URL when invoice belongs to current user", async () => {
        mockStripeRetrieve.mockResolvedValue({
            id: "in_1",
            customer: "cus_user",
            hosted_invoice_url: "https://stripe.test/in_1",
        });
        const handler = (await import("~~/server/api/v1/stripe/invoice/[invoiceId]/download.get")).default;
        const result = await handler({ context: { user: { id: "u1", stripeCustomerId: "cus_user" } } } as any);
        expect(result).toEqual({ invoiceUrl: "https://stripe.test/in_1" });
    });
});
