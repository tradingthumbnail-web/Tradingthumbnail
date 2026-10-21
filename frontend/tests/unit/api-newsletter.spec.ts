import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadBody = vi.fn();
const mockUseRuntimeConfig = vi.fn();
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
    useRuntimeConfig: mockUseRuntimeConfig,
});

describe('API: newsletter subscribe', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllGlobals();
        mockUseRuntimeConfig.mockReturnValue({
            beehiiv: {
                apiKey: 'test-key',
                publicationId: 'pub_123',
            },
        });
    });

    it('rejects invalid email', async () => {
        mockReadBody.mockResolvedValue({ email: 'not-an-email' });
        const handler = (await import('~~/server/api/v1/newsletter/subscribe.post')).default;
        await expect(handler({} as any)).rejects.toMatchObject({
            message: 'Invalid email',
            statusCode: 400,
        });
    });

    it('returns 503 when Beehiiv is not configured', async () => {
        mockReadBody.mockResolvedValue({ email: 'user@example.com' });
        mockUseRuntimeConfig.mockReturnValue({ beehiiv: {} });
        const handler = (await import('~~/server/api/v1/newsletter/subscribe.post')).default;
        await expect(handler({} as any)).rejects.toMatchObject({
            message: 'Newsletter is not configured',
            statusCode: 503,
        });
    });

    it('subscribes through Beehiiv and treats duplicates as success', async () => {
        mockReadBody.mockResolvedValue({ email: 'user@example.com' });
        const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 409 });
        vi.stubGlobal('fetch', fetchMock);

        const handler = (await import('~~/server/api/v1/newsletter/subscribe.post')).default;
        const result = await handler({} as any);

        expect(result).toEqual({ success: true });
        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.beehiiv.com/v2/publications/pub_123/subscriptions',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-key',
                }),
            }),
        );
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.email).toBe('user@example.com');
        expect(body.reactivate_existing).toBe(true);
    });
});
