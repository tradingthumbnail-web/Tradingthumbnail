import { beforeEach, describe, expect, it, vi } from "vitest";

const mockIsPaymentsEnabled = vi.fn();
const mockSetResponseStatus = vi.fn();
const mockGetRequestURL = vi.fn();
const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    setResponseStatus: mockSetResponseStatus,
    getRequestURL: mockGetRequestURL,
    createError: mockCreateError,
});

vi.mock("~~/server/utils/payments", () => ({
    isPaymentsEnabled: (...args: unknown[]) => mockIsPaymentsEnabled(...args),
}));

describe("middleware: payments-disabled", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("blocks billing APIs when payments are disabled", async () => {
        mockIsPaymentsEnabled.mockReturnValue(false);
        mockGetRequestURL.mockReturnValue(new URL("https://example.com/api/v1/stripe/checkout-session"));

        const handler = (await import("~~/server/middleware/payments-disabled")).default;
        try {
            handler({} as any);
            throw new Error("expected handler to throw");
        } catch (error: any) {
            expect(error?.statusCode).toBe(503);
        }
    });

    it("returns webhook noop response when payments are disabled", async () => {
        mockIsPaymentsEnabled.mockReturnValue(false);
        mockGetRequestURL.mockReturnValue(new URL("https://example.com/api/webhook/polar"));

        const handler = (await import("~~/server/middleware/payments-disabled")).default;
        const result = await handler({} as any);

        expect(mockSetResponseStatus).toHaveBeenCalledWith(expect.anything(), 202);
        expect(result).toEqual({ received: true, paymentsDisabled: true });
    });

    it("does nothing when payments are enabled", async () => {
        mockIsPaymentsEnabled.mockReturnValue(true);
        mockGetRequestURL.mockReturnValue(new URL("https://example.com/api/v1/stripe/checkout-session"));

        const handler = (await import("~~/server/middleware/payments-disabled")).default;
        const result = handler({} as any);
        expect(result).toBeUndefined();
        expect(mockSetResponseStatus).not.toHaveBeenCalled();
    });

    it("allows catalog read routes when payments are disabled", async () => {
        mockIsPaymentsEnabled.mockReturnValue(false);
        mockGetRequestURL.mockReturnValue(new URL("https://example.com/api/v1/product"));

        const handler = (await import("~~/server/middleware/payments-disabled")).default;
        const result = handler({} as any);

        expect(result).toBeUndefined();
        expect(mockSetResponseStatus).not.toHaveBeenCalled();
    });
});
