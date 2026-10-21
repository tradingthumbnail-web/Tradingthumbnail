import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadBody = vi.fn();
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
});

vi.mock('~~/server/services/user/credits', () => ({
    runChargedWork: vi.fn(async (_userId: string, _amount: number, work: () => Promise<unknown>) => work()),
    deductUserCredits: vi.fn(async () => ({ amount: 1, refund: vi.fn() })),
}));

vi.mock('~~/server/database', () => ({
    db: {
        query: {
            imageTable: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => Promise.resolve([{ id: 'branch-1' }])),
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve()),
            })),
        })),
    },
}));

vi.mock('~~/server/storage', () => ({
    storage: {
        put: vi.fn(),
        generatePresignedUrl: vi.fn(),
    },
}));

vi.mock('~~/server/services/image.service', () => ({
    saveImageToDB: vi.fn(),
}));

vi.mock('~~/server/services/activity/save-activity', () => ({
    saveActivity: vi.fn(),
}));

vi.mock('~~/server/services/prompt/optimize-prompt', () => ({
    optimizeFineGrainedEditionPrompt: vi.fn((_prompt: string) => Promise.resolve('optimized prompt')),
}));

vi.mock('~~/server/services/fal/kontext-fine-edit-generation', () => ({
    generateFineEditedImage: vi.fn(() => Promise.resolve(['https://fal.media/edited.png'])),
    FLUX_2_FINE_EDIT_PARAMS: {},
}));

vi.mock('~~/server/services/fal/generate-flux-2', () => ({
    generateFlux2ImageToImage: vi.fn(() => Promise.resolve(['https://fal.media/flux-edited.png'])),
    FLUX_2_EDIT_PARAMS: {},
}));

vi.mock('~~/server/services/fal/generate-nano-banana-2', () => ({
    generateNanoBanana2ImageToImage: vi.fn(() => Promise.resolve(['https://fal.media/nano-edited.png'])),
    NANO_BANANA_2_PARAMS: {},
}));

vi.mock('~~/server/services/fal/generate-quick-image', () => ({
    generateQuickImageToImage: vi.fn(() => Promise.resolve(['https://fal.media/gpt-edited.png'])),
}));

vi.mock('crypto', () => ({
    randomUUID: vi.fn(() => 'test-uuid'),
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

import { storage } from '~~/server/storage';
import { saveImageToDB } from '~~/server/services/image.service';
import { generateFineEditedImage } from '~~/server/services/fal/kontext-fine-edit-generation';
import { generateNanoBanana2ImageToImage } from '~~/server/services/fal/generate-nano-banana-2';
import { generateQuickImageToImage } from '~~/server/services/fal/generate-quick-image';
import { optimizeFineGrainedEditionPrompt } from '~~/server/services/prompt/optimize-prompt';
import { db } from '~~/server/database';

describe('API: /api/v1/generation/fine-edit.post', () => {
    const mockUser = { id: 'user-123' };
    const mockOriginalImage = {
        id: 'img-1',
        storageKey: 'user-123/images/img1.png',
        userId: 'user-123',
        rootId: null,
        branchId: null,
        projectId: null,
        toolId: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(optimizeFineGrainedEditionPrompt).mockResolvedValue('optimized prompt');
        vi.mocked(storage.put).mockResolvedValue();
        vi.mocked(storage.generatePresignedUrl).mockResolvedValue('https://presigned.example.com/img.png');
        vi.mocked(db.query.imageTable.findFirst).mockResolvedValue(mockOriginalImage as any);
        vi.mocked(db.query.imageTable.findMany).mockResolvedValue([]);
        vi.mocked(saveImageToDB).mockResolvedValue({ id: 'new-img-id' } as any);
        mockReadBody.mockResolvedValue({
            prompt: 'make it sunset',
            imageId: 'img-1',
        });
        mockFetch.mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        });
    });

    it('returns 401 when user is not authenticated', async () => {
        const handler = (await import('~~/server/api/v1/generation/fine-edit.post')).default;
        const event = { context: {} } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Unauthorized',
            statusCode: 401,
        });
    });

    it('returns 400 when imageId is missing', async () => {
        mockReadBody.mockResolvedValue({
            prompt: 'make it sunset',
        });

        const handler = (await import('~~/server/api/v1/generation/fine-edit.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Bad Request',
            statusCode: 400,
        });
    });

    it('returns 400 when prompt is missing and not Nano Banana 2', async () => {
        mockReadBody.mockResolvedValue({
            imageId: 'img-1',
            model: 'fal-ai/flux-2/edit',
        });

        const handler = (await import('~~/server/api/v1/generation/fine-edit.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Bad Request',
            statusCode: 400,
        });
    });

    it('rethrows when image not found', async () => {
        vi.mocked(db.query.imageTable.findFirst).mockResolvedValue(null);

        const handler = (await import('~~/server/api/v1/generation/fine-edit.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Image not found',
            statusCode: 404,
        });
    });

    it('uses generateFineEditedImage for default model and saves result', async () => {
        const handler = (await import('~~/server/api/v1/generation/fine-edit.post')).default;
        const event = { context: { user: mockUser } } as any;

        const result = await handler(event);

        expect(generateFineEditedImage).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: 'optimized prompt',
                numberOfImages: 1,
                referenceImageURL: 'https://presigned.example.com/img.png',
            })
        );
        expect(saveImageToDB).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'user-123',
                imageId: 'test-uuid',
                parentId: 'img-1',
                type: 'GENERATION',
                state: 'GENERATED',
            })
        );
        expect(result).toEqual({ id: 'new-img-id' });
    });

    it('uses the original prompt when prompt optimization fails', async () => {
        vi.mocked(optimizeFineGrainedEditionPrompt).mockResolvedValue(null);

        const handler = (await import('~~/server/api/v1/generation/fine-edit.post')).default;
        const event = { context: { user: mockUser } } as any;

        await handler(event);

        expect(generateFineEditedImage).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: 'make it sunset',
            })
        );
    });

    it('uses generateNanoBanana2ImageToImage when model is nano-banana-2', async () => {
        mockReadBody.mockResolvedValue({
            imageId: 'img-1',
            model: 'fal-ai/nano-banana-2',
        });

        const handler = (await import('~~/server/api/v1/generation/fine-edit.post')).default;
        const event = { context: { user: mockUser } } as any;

        await handler(event);

        expect(generateNanoBanana2ImageToImage).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: 'Edit and improve this image',
                numberOfImages: 1,
                referenceImageURLs: ['https://presigned.example.com/img.png'],
            })
        );
    });

    it('uses generateQuickImageToImage when model is gpt-image-2', async () => {
        mockReadBody.mockResolvedValue({
            prompt: 'make it sunset',
            imageId: 'img-1',
            model: 'gpt-image-2',
        });

        const handler = (await import('~~/server/api/v1/generation/fine-edit.post')).default;
        const event = { context: { user: mockUser } } as any;

        await handler(event);

        expect(generateQuickImageToImage).toHaveBeenCalledWith(
            expect.objectContaining({
                model: 'gpt-image-2',
                prompt: 'optimized prompt',
                numberOfImages: 1,
                referenceImageURL: 'https://presigned.example.com/img.png',
            })
        );
    });
});
