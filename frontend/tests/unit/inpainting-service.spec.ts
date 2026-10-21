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
import { generateInpaintingImage } from '~~/server/services/fal/inpainting';

describe('generateInpaintingImage', () => {
    const validParams = {
        model: 'fal-ai/flux-lora/inpainting' as any,
        prompt: 'add a red hat',
        imageUrl: 'https://example.com/image.png',
        maskUrl: 'https://example.com/mask.png',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fal.subscribe).mockResolvedValue({
            data: { images: [{ url: 'https://fal.media/generated.png' }] },
        });
        mockFetch.mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        });
    });

    it('calls fal.subscribe with correct input', async () => {
        await generateInpaintingImage(validParams);

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
        const result = await generateInpaintingImage(validParams);

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBe(8);
    });

    it('throws when response has no images', async () => {
        vi.mocked(fal.subscribe).mockResolvedValue({ data: { images: [] } });

        await expect(generateInpaintingImage(validParams)).rejects.toMatchObject({
            message: 'Failed to generate image',
            statusCode: 500,
        });
    });

    it('throws when fetch fails', async () => {
        mockFetch.mockResolvedValue({ ok: false });

        await expect(generateInpaintingImage(validParams)).rejects.toMatchObject({
            message: 'Failed to download generated image',
            statusCode: 500,
        });
    });
});
