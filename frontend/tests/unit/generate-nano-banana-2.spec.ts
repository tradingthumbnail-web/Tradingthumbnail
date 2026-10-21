import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreateError = vi.fn((options: { statusCode: number; statusMessage: string }) => {
    const error = new Error(options.statusMessage);
    (error as any).statusCode = options.statusCode;
    return error;
});

Object.assign(globalThis, {
    createError: mockCreateError,
});

vi.mock('~~/server/inference/fal', () => {
    const mockFn = vi.fn();
    return {
        default: {
            subscribe: mockFn,
        },
        __mockSubscribe: mockFn,
    };
});

import { 
    generateNanoBanana2Image, 
    generateNanoBanana2ImageToImage,
    mapImageSizeToAspectRatio,
    NANO_BANANA_2_PARAMS 
} from '../../server/services/fal/generate-nano-banana-2';
import fal from '~~/server/inference/fal';

describe('Nano Banana 2 Service', () => {
    const getMockedSubscribe = () => vi.mocked(fal.subscribe);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateNanoBanana2Image', () => {
        it('calls fal.subscribe with correct parameters', async () => {
            getMockedSubscribe().mockResolvedValue({
                data: {
                    images: [{ url: 'https://example.com/image1.png' }],
                },
            } as any);

            await generateNanoBanana2Image({
                prompt: 'A beautiful sunset',
                numberOfImages: 1,
                aspectRatio: '16:9',
                resolution: '2K',
                enableWebSearch: true,
            });

            expect(getMockedSubscribe()).toHaveBeenCalledWith(
                'fal-ai/nano-banana-2',
                expect.objectContaining({
                    input: {
                        prompt: 'A beautiful sunset',
                        num_images: 1,
                        aspect_ratio: '16:9',
                        resolution: '2K',
                        enable_web_search: true,
                        ...NANO_BANANA_2_PARAMS,
                    },
                    logs: true,
                })
            );
        });

        it('returns array of image URLs on success', async () => {
            getMockedSubscribe().mockResolvedValue({
                data: {
                    images: [
                        { url: 'https://example.com/image1.png' },
                        { url: 'https://example.com/image2.png' },
                    ],
                },
            } as any);

            const result = await generateNanoBanana2Image({
                prompt: 'A beautiful sunset',
                numberOfImages: 2,
            });

            expect(result).toEqual([
                'https://example.com/image1.png',
                'https://example.com/image2.png',
            ]);
        });

        it('uses default values when options not provided', async () => {
            getMockedSubscribe().mockResolvedValue({
                data: {
                    images: [{ url: 'https://example.com/image.png' }],
                },
            } as any);

            await generateNanoBanana2Image({
                prompt: 'Test prompt',
                numberOfImages: 1,
            });

            expect(getMockedSubscribe()).toHaveBeenCalledWith(
                'fal-ai/nano-banana-2',
                expect.objectContaining({
                    input: expect.objectContaining({
                        aspect_ratio: 'auto',
                        resolution: '1K',
                        enable_web_search: false,
                    }),
                })
            );
        });

        it('throws error when no images returned', async () => {
            getMockedSubscribe().mockResolvedValue({
                data: {
                    images: [],
                },
            } as any);

            await expect(generateNanoBanana2Image({
                prompt: 'Test prompt',
                numberOfImages: 1,
            })).rejects.toThrow();
        });

        it('throws error when images is undefined', async () => {
            getMockedSubscribe().mockResolvedValue({
                data: {},
            } as any);

            await expect(generateNanoBanana2Image({
                prompt: 'Test prompt',
                numberOfImages: 1,
            })).rejects.toThrow();
        });
    });

    describe('generateNanoBanana2ImageToImage', () => {
        it('calls fal.subscribe with image_urls for editing', async () => {
            getMockedSubscribe().mockResolvedValue({
                data: {
                    images: [{ url: 'https://example.com/edited.png' }],
                },
            } as any);

            await generateNanoBanana2ImageToImage({
                prompt: 'Make the sky purple',
                numberOfImages: 1,
                resolution: '1K',
                enableWebSearch: false,
                referenceImageURLs: ['https://example.com/original.png'],
            });

            expect(getMockedSubscribe()).toHaveBeenCalledWith(
                'fal-ai/nano-banana-2/edit',
                expect.objectContaining({
                    input: expect.objectContaining({
                        prompt: 'Make the sky purple',
                        image_urls: ['https://example.com/original.png'],
                        resolution: '1K',
                        enable_web_search: false,
                    }),
                })
            );
        });

        it('supports multiple reference images', async () => {
            getMockedSubscribe().mockResolvedValue({
                data: {
                    images: [{ url: 'https://example.com/edited.png' }],
                },
            } as any);

            await generateNanoBanana2ImageToImage({
                prompt: 'Combine these images',
                numberOfImages: 1,
                referenceImageURLs: [
                    'https://example.com/img1.png',
                    'https://example.com/img2.png',
                ],
            });

            expect(getMockedSubscribe()).toHaveBeenCalledWith(
                'fal-ai/nano-banana-2/edit',
                expect.objectContaining({
                    input: expect.objectContaining({
                        image_urls: [
                            'https://example.com/img1.png',
                            'https://example.com/img2.png',
                        ],
                    }),
                })
            );
        });
    });

    describe('mapImageSizeToAspectRatio', () => {
        it('maps 1:1 to 1:1', () => {
            expect(mapImageSizeToAspectRatio('1:1')).toBe('1:1');
        });

        it('maps 16:9 to 16:9', () => {
            expect(mapImageSizeToAspectRatio('16:9')).toBe('16:9');
        });

        it('maps 4:3 to 4:3', () => {
            expect(mapImageSizeToAspectRatio('4:3')).toBe('4:3');
        });

        it('maps 9:16 to 9:16', () => {
            expect(mapImageSizeToAspectRatio('9:16')).toBe('9:16');
        });

        it('returns auto for unknown sizes', () => {
            expect(mapImageSizeToAspectRatio('unknown')).toBe('auto');
            expect(mapImageSizeToAspectRatio(undefined)).toBe('auto');
        });
    });

    describe('NANO_BANANA_2_PARAMS', () => {
        it('has correct default parameters', () => {
            expect(NANO_BANANA_2_PARAMS).toEqual({
                output_format: 'png',
                safety_tolerance: '4',
                limit_generations: true,
            });
        });
    });
});