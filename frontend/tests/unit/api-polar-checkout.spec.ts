import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadBody = vi.fn();
const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});
const mockUseRuntimeConfig = vi.fn();
const mockCheckoutsCreate = vi.fn();
const mockFindFirst = vi.fn();

vi.mock('h3', () => ({
    createError: mockCreateError,
    readBody: mockReadBody,
    defineEventHandler: vi.fn((handler: any) => handler),
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    readBody: mockReadBody,
    createError: mockCreateError,
    useRuntimeConfig: mockUseRuntimeConfig,
});

vi.mock('~~/server/database', () => ({
    db: {
        query: {
            tierTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
            productTable: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
        },
    },
}));

vi.mock('~~/server/services/polar/client', () => ({
    createPolarClient: () => ({
        checkouts: { create: mockCheckoutsCreate },
    }),
    getPolarConfig: () => ({ accessToken: 'polar_oat_test', webhookSecret: 'whsec', server: 'sandbox' }),
}));

describe('API: Polar checkout', () => {
    const user = { id: 'user-1', email: 'user@example.com', name: 'User' };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseRuntimeConfig.mockReturnValue({
            public: { appUrl: 'https://app.kithumbs.com' },
            polar: { accessToken: 'polar_oat_test', server: 'sandbox' },
        });
        mockCheckoutsCreate.mockResolvedValue({ url: 'https://polar.sh/checkout/abc' });
    });

    it('creates a Polar subscription checkout for the selected interval', async () => {
        mockReadBody.mockResolvedValue({ tierId: 7, interval: 'month' });
        mockFindFirst.mockResolvedValue({
            id: 7,
            name: 'KiThumbs Plus',
            polarProductId: 'polar_plus_month',
            polarYearlyProductId: 'polar_plus_year',
        });
        const handler = (await import('~~/server/api/v1/polar/checkout-session.post')).default;
        const result = await handler({ context: { user } } as any);

        expect(mockCheckoutsCreate).toHaveBeenCalledWith(expect.objectContaining({
            products: ['polar_plus_month'],
            externalCustomerId: 'user-1',
            customerEmail: 'user@example.com',
            metadata: expect.objectContaining({
                userId: 'user-1',
                tierId: '7',
                interval: 'month',
            }),
        }));
        expect(result).toEqual({ checkoutUrl: 'https://polar.sh/checkout/abc' });
    });

    it('creates a Polar one-time checkout from the product Polar ID, not the name', async () => {
        mockReadBody.mockResolvedValue({ productId: '3f9cfba6-8ea7-4ac3-afaf-1087806ebb98' });
        mockFindFirst.mockResolvedValue({
            id: '3f9cfba6-8ea7-4ac3-afaf-1087806ebb98',
            name: 'KiThumbs Avatar',
            polarProductId: 'polar_avatar',
            metadata: { avatarCredits: 1 },
        });
        const handler = (await import('~~/server/api/v1/polar/product-checkout-session.post')).default;
        const result = await handler({ context: { user } } as any);

        expect(mockCheckoutsCreate).toHaveBeenCalledWith(expect.objectContaining({
            products: ['polar_avatar'],
            metadata: expect.objectContaining({
                userId: 'user-1',
                productId: '3f9cfba6-8ea7-4ac3-afaf-1087806ebb98',
            }),
        }));
        expect(result).toEqual({ checkoutUrl: 'https://polar.sh/checkout/abc' });
    });

    it('does not create checkout when Polar product IDs are missing', async () => {
        mockReadBody.mockResolvedValue({ tierId: 7, interval: 'month' });
        mockFindFirst.mockResolvedValue({
            id: 7,
            polarProductId: null,
            polarYearlyProductId: null,
        });
        const handler = (await import('~~/server/api/v1/polar/checkout-session.post')).default;
        await expect(handler({ context: { user } } as any)).rejects.toMatchObject({
            statusCode: 503,
        });
        expect(mockCheckoutsCreate).not.toHaveBeenCalled();
    });
});
