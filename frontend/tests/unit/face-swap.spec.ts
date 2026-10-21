import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('~~/server/inference/fal', () => ({
    default: {
        subscribe: vi.fn(),
    },
}));

const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});

vi.mock('h3', () => ({
    createError: mockCreateError,
}));

Object.assign(globalThis, { createError: mockCreateError });

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

import fal from '~~/server/inference/fal';
import { generateFaceSwap } from '~~/server/services/fal/face-swap';

describe('generateFaceSwap', () => {
    const validParams = {
        model: 'half-moon-ai/ai-face-swap/faceswapimage' as any,
        sourceFaceUrl: 'https://example.com/source.jpg',
        targetImageUrl: 'https://example.com/target.jpg',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fal.subscribe).mockResolvedValue({
            data: { image: { url: 'https://fal.media/generated.png' } },
        });
        mockFetch.mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        } as Response);
    });

    it('calls fal.subscribe with correct input', async () => {
        await generateFaceSwap(validParams);

        expect(fal.subscribe).toHaveBeenCalledWith(validParams.model, {
            input: {
                source_face_url: validParams.sourceFaceUrl,
                target_image_url: validParams.targetImageUrl,
                enable_occlusion_prevention: false,
            },
            logs: true,
            onQueueUpdate: expect.any(Function),
        });
    });

    it('passes enableOcclusionPrevention when true', async () => {
        await generateFaceSwap({
            ...validParams,
            enableOcclusionPrevention: true,
        });

        expect(fal.subscribe).toHaveBeenCalledWith(
            validParams.model,
            expect.objectContaining({
                input: expect.objectContaining({
                    enable_occlusion_prevention: true,
                }),
            })
        );
    });

    it('falls back to images[0].url when image.url is missing', async () => {
        vi.mocked(fal.subscribe).mockResolvedValue({
            data: { images: [{ url: 'https://fal.media/alt.png' }] },
        });

        const result = await generateFaceSwap(validParams);

        expect(mockFetch).toHaveBeenCalledWith('https://fal.media/alt.png');
        expect(result).toBeInstanceOf(Buffer);
    });

    it('returns buffer from fetched image', async () => {
        const result = await generateFaceSwap(validParams);

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBe(8);
    });

    it('throws when response has no image url', async () => {
        vi.mocked(fal.subscribe).mockResolvedValue({ data: {} });

        await expect(generateFaceSwap(validParams)).rejects.toMatchObject({
            message: 'Failed to generate image',
            statusCode: 500,
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws when fetch fails', async () => {
        mockFetch.mockResolvedValue({ ok: false });

        await expect(generateFaceSwap(validParams)).rejects.toMatchObject({
            message: 'Failed to download generated image',
            statusCode: 500,
        });
    });

    it('rethrows fal.subscribe errors', async () => {
        const falError = new Error('FAL API error');
        vi.mocked(fal.subscribe).mockRejectedValue(falError);

        await expect(generateFaceSwap(validParams)).rejects.toThrow('FAL API error');
    });
});
