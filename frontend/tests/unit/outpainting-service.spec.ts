import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('~~/server/inference/fal', () => ({
    default: { subscribe: vi.fn() },
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});
vi.mock('h3', () => ({ createError: mockCreateError }));
Object.assign(globalThis, { createError: mockCreateError });

import fal from '~~/server/inference/fal';
import { generateOutpaintingImage } from '~~/server/services/fal/outpainting';

describe('generateOutpaintingImage', () => {
    const validParams = {
        model: 'fal-ai/flux-lora-fill' as any,
        prompt: 'Extend the image naturally',
        imageUrl: 'https://example.com/canvas.png',
        maskUrl: 'https://example.com/mask.png',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fal.subscribe).mockResolvedValue({
            data: { images: [{ url: 'https://fal.media/outpainted.png' }] },
        });
        mockFetch.mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        });
    });

    it('calls fal.subscribe with correct input', async () => {
        await generateOutpaintingImage(validParams);

        expect(fal.subscribe).toHaveBeenCalledWith(
            validParams.model,
            expect.objectContaining({
                input: expect.objectContaining({
                    prompt: validParams.prompt,
                    image_url: validParams.imageUrl,
                    mask_url: validParams.maskUrl,
                }),
            })
        );
    });

    it('returns buffer from fetched image', async () => {
        const result = await generateOutpaintingImage(validParams);

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBe(8);
    });

    it('throws when response has no images', async () => {
        vi.mocked(fal.subscribe).mockResolvedValue({ data: { images: [] } });

        await expect(generateOutpaintingImage(validParams)).rejects.toMatchObject({
            message: 'Failed to generate image',
            statusCode: 500,
        });
    });

    it('throws when fetch fails', async () => {
        mockFetch.mockResolvedValue({ ok: false });

        await expect(generateOutpaintingImage(validParams)).rejects.toMatchObject({
            message: 'Failed to download generated image',
            statusCode: 500,
        });
    });
});
