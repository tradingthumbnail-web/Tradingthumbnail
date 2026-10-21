import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadBody = vi.fn();
const mockCreateError = vi.fn((options: { statusCode: number; statusMessage: string }) => {
    const error = new Error(options.statusMessage);
    (error as any).statusCode = options.statusCode;
    return error;
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
});

vi.mock('~~/server/services/user/credits', () => ({
    runChargedWork: vi.fn(async (_userId: string, _amount: number, work: () => Promise<unknown>) => work()),
    deductUserCredits: vi.fn(async () => ({ amount: 1, refund: vi.fn() })),
}));

vi.mock('~~/server/posthog', () => ({
    capturePosthogServerEvent: vi.fn(),
}));

vi.mock('~~/server/storage', () => ({
    storage: {
        put: vi.fn().mockResolvedValue(undefined),
        generatePresignedUrl: vi.fn().mockResolvedValue('https://presigned.example.com/img.png'),
    },
}));

vi.mock('~~/server/services/image.service', () => ({
    saveImageToDB: vi.fn().mockResolvedValue({ id: 'new-img-id', storageKey: 'test-key' }),
}));

vi.mock('~~/server/services/asset', () => ({
    saveAssetToDB: vi.fn().mockResolvedValue({ id: 'asset-id' }),
}));

vi.mock('~~/server/services/prompt/optimize-prompt', () => ({
    optimizePrompt: vi.fn((prompt: string) => Promise.resolve(prompt + ' (optimized)')),
}));

vi.mock('~~/server/services/activity/save-activity', () => ({
    saveActivity: vi.fn().mockResolvedValue(undefined),
}));

const mockGenerateNanoBanana2Image = vi.fn().mockResolvedValue(['https://example.com/generated.png']);
const mockGenerateNanoBanana2ImageToImage = vi.fn().mockResolvedValue(['https://example.com/generated.png']);

vi.mock('~~/server/services/fal/generate-nano-banana-2', () => ({
    generateNanoBanana2Image: mockGenerateNanoBanana2Image,
    generateNanoBanana2ImageToImage: mockGenerateNanoBanana2ImageToImage,
    mapImageSizeToAspectRatio: vi.fn((size: string) => size === '16:9' ? '16:9' : 'auto'),
    NANO_BANANA_2_PARAMS: {
        output_format: 'png',
        safety_tolerance: '4',
        limit_generations: true,
    },
}));

vi.mock('~~/server/services/fal/generate-quick-image', () => ({
    generateQuickImage: vi.fn().mockResolvedValue(['https://example.com/generated.png']),
    generateQuickImageToImage: vi.fn().mockResolvedValue(['https://example.com/generated.png']),
    FLUX_IMAGE_TO_IMAGE_PARAMS: {},
    FLUX_IMAGE_PARAMS: {},
}));

vi.mock('~~/server/services/fal/generate-flux-2', () => ({
    generateFlux2Image: vi.fn().mockResolvedValue(['https://example.com/generated.png']),
    generateFlux2ImageToImage: vi.fn().mockResolvedValue(['https://example.com/generated.png']),
    FLUX_2_PARAMS: {},
    FLUX_2_EDIT_PARAMS: {},
}));

vi.mock('~~/server/storage/keys', () => ({
    generateAssetStorageKey: vi.fn(() => 'asset-storage-key'),
    generateImageStorageKey: vi.fn(() => 'image-storage-key'),
}));

vi.mock('crypto', () => ({
    randomUUID: vi.fn(() => 'test-uuid'),
}));

global.fetch = vi.fn().mockResolvedValue({
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
});

describe('API: /api/v1/generation/quick-generation.post - Nano Banana 2', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('uses generateNanoBanana2Image when model is fal-ai/nano-banana-2', async () => {
        mockReadBody.mockResolvedValue({
            prompt: 'A beautiful sunset',
            imageQuality: 'high',
            numberOfImages: 2,
            model: 'fal-ai/nano-banana-2',
            advanced: {
                promptImprovement: true,
                imageSize: '16:9',
            },
            referenceImageBase64: null,
            imageType: 'background',
            modelOptions: {
                resolution: '2K',
                enableWebSearch: true,
            },
        });

        const handler = (await import('~~/server/api/v1/generation/quick-generation.post')).default;
        const event = { context: { user: mockUser } } as any;

        await handler(event);

        expect(mockGenerateNanoBanana2Image).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining('sunset'),
                numberOfImages: 2,
                resolution: '2K',
                enableWebSearch: true,
            })
        );
    });

    it('uses default resolution 1K when modelOptions.resolution not provided', async () => {
        mockReadBody.mockResolvedValue({
            prompt: 'A beautiful sunset',
            imageQuality: 'medium',
            numberOfImages: 1,
            model: 'fal-ai/nano-banana-2',
            advanced: {
                promptImprovement: false,
                imageSize: '1:1',
            },
            referenceImageBase64: null,
            imageType: 'assets',
            modelOptions: {},
        });

        const handler = (await import('~~/server/api/v1/generation/quick-generation.post')).default;
        const event = { context: { user: mockUser } } as any;

        await handler(event);

        expect(mockGenerateNanoBanana2Image).toHaveBeenCalledWith(
            expect.objectContaining({
                resolution: '1K',
                enableWebSearch: false,
            })
        );
    });

    it('uses generateNanoBanana2ImageToImage when reference image is provided', async () => {
        mockReadBody.mockResolvedValue({
            prompt: 'Make it more colorful',
            imageQuality: 'high',
            numberOfImages: 1,
            model: 'fal-ai/nano-banana-2',
            advanced: {
                promptImprovement: false,
                imageSize: '16:9',
            },
            referenceImageBase64: 'base64EncodedImage==',
            imageType: 'background',
            modelOptions: {
                resolution: '4K',
                enableWebSearch: false,
            },
        });

        const handler = (await import('~~/server/api/v1/generation/quick-generation.post')).default;
        const event = { context: { user: mockUser } } as any;

        await handler(event);

        expect(mockGenerateNanoBanana2ImageToImage).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: 'Make it more colorful',
                numberOfImages: 1,
                resolution: '4K',
                enableWebSearch: false,
                referenceImageURLs: expect.arrayContaining([expect.any(String)]),
            })
        );
    });

    it('returns 401 when user is not authenticated', async () => {
        mockReadBody.mockResolvedValue({
            prompt: 'Test',
            imageQuality: 'high',
            numberOfImages: 1,
            model: 'fal-ai/nano-banana-2',
            advanced: {
                promptImprovement: false,
                imageSize: '16:9',
            },
            referenceImageBase64: null,
            imageType: 'background',
        });

        const handler = (await import('~~/server/api/v1/generation/quick-generation.post')).default;
        const event = { context: {} } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Unauthorized',
            statusCode: 401,
        });
    });

    it('charges and generates with the server-clamped image count instead of a client-supplied 99', async () => {
        const { runChargedWork } = await import('~~/server/services/user/credits');
        mockReadBody.mockResolvedValue({
            prompt: 'A beautiful sunset',
            imageQuality: 'low',
            numberOfImages: 99,
            model: 'fal-ai/nano-banana-2',
            advanced: {
                promptImprovement: false,
                imageSize: '16:9',
            },
            referenceImageBase64: null,
            imageType: 'background',
            modelOptions: {
                resolution: '1K',
                enableWebSearch: false,
            },
        });

        const handler = (await import('~~/server/api/v1/generation/quick-generation.post')).default;
        await handler({ context: { user: mockUser } } as any);

        expect(runChargedWork).toHaveBeenCalledWith('user-123', 16, expect.any(Function));
        expect(mockGenerateNanoBanana2Image).toHaveBeenCalledWith(
            expect.objectContaining({ numberOfImages: 4 })
        );
    });

    it('does not use Nano Banana 2 service for other models', async () => {
        mockReadBody.mockResolvedValue({
            prompt: 'A beautiful sunset',
            imageQuality: 'high',
            numberOfImages: 1,
            model: 'fal-ai/flux-2',
            advanced: {
                promptImprovement: false,
                imageSize: '16:9',
            },
            referenceImageBase64: null,
            imageType: 'background',
        });

        const { generateQuickImage } = await import('~~/server/services/fal/generate-quick-image');
        const handler = (await import('~~/server/api/v1/generation/quick-generation.post')).default;
        const event = { context: { user: mockUser } } as any;

        await handler(event);

        expect(mockGenerateNanoBanana2Image).not.toHaveBeenCalled();
        expect(generateQuickImage).toHaveBeenCalled();
    });
});