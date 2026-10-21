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

vi.mock('~~/server/database', () => ({
    db: {
        query: {
            assetTable: {
                findFirst: vi.fn(),
            },
        },
    },
}));

vi.mock('~~/server/storage', () => ({
    storage: {
        put: vi.fn(),
        generatePresignedUrl: vi.fn(),
    },
}));

vi.mock('~~/server/services/image.service', () => ({
    getImageById: vi.fn(),
    getOwnedImageOrThrow: vi.fn(),
    saveImageToDB: vi.fn(),
}));

vi.mock('~~/server/services/user/credits', () => ({
    runChargedWork: vi.fn(async (_userId: string, _amount: number, work: () => Promise<unknown>) => work()),
    deductUserCredits: vi.fn(async () => ({ amount: 1, refund: vi.fn() })),
}));

vi.mock('~~/server/services/fal/face-swap', () => ({
    generateFaceSwap: vi.fn(() => Promise.resolve(Buffer.from('generated-image'))),
}));

vi.mock('crypto', () => ({
    randomUUID: vi.fn(() => 'test-uuid'),
}));

import { storage } from '~~/server/storage';
import { getOwnedImageOrThrow, saveImageToDB } from '~~/server/services/image.service';
import { generateFaceSwap } from '~~/server/services/fal/face-swap';

describe('API: /api/v1/generation/face-swap.post', () => {
    const mockUser = { id: 'user-123' };
    const mockTargetImage = {
        id: 'target-img-1',
        storageKey: 'user-123/images/dev/GENERATION/target.png',
        type: 'GENERATION',
        rootId: null,
        projectId: null,
        branchId: null,
        toolId: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(storage.put).mockResolvedValue();
        vi.mocked(storage.generatePresignedUrl).mockResolvedValue('https://presigned.example.com/img.png');
        vi.mocked(getOwnedImageOrThrow).mockResolvedValue(mockTargetImage as any);
        vi.mocked(saveImageToDB).mockResolvedValue({ id: 'new-img-id' } as any);
        mockReadBody.mockResolvedValue({
            sourceAssetId: 'asset-123',
            targetImageId: 'target-img-1',
        });
    });

    it('returns 401 when user is not authenticated', async () => {
        const handler = (await import('~~/server/api/v1/generation/face-swap.post')).default;
        const event = { context: {} } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Unauthorized',
            statusCode: 401,
        });
        expect(getOwnedImageOrThrow).not.toHaveBeenCalled();
    });

    it('returns 400 when targetImageId is missing', async () => {
        mockReadBody.mockResolvedValue({
            sourceAssetId: 'asset-123',
            targetImageId: null,
        });

        const handler = (await import('~~/server/api/v1/generation/face-swap.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Bad Request',
            statusCode: 400,
        });
    });

    it('returns 400 when neither sourceAssetId nor sourceImageBase64 provided', async () => {
        mockReadBody.mockResolvedValue({
            targetImageId: 'target-img-1',
        });

        const handler = (await import('~~/server/api/v1/generation/face-swap.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Bad Request',
            statusCode: 400,
        });
    });

    it('returns 404 when target image is not owned by the user', async () => {
        vi.mocked(getOwnedImageOrThrow).mockRejectedValue(Object.assign(new Error('Image not found'), { statusCode: 404 }));

        const handler = (await import('~~/server/api/v1/generation/face-swap.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Image not found',
            statusCode: 404,
        });
    });

    it('uses sourceAssetId and resolves asset URL when provided', async () => {
        vi.mocked(storage.generatePresignedUrl).mockImplementation((key: string) =>
            Promise.resolve(key.includes('asset') ? 'https://source.example.com/asset.png' : 'https://target.example.com/img.png')
        );

        const handler = (await import('~~/server/api/v1/generation/face-swap.post')).default;
        const event = { context: { user: mockUser } } as any;
        const { db } = await import('~~/server/database');
        vi.mocked(db.query.assetTable.findFirst).mockResolvedValue({
            id: 'asset-123',
            storageKey: 'user-123/asset.png',
        } as any);

        await handler(event);

        expect(generateFaceSwap).toHaveBeenCalledWith(
            expect.objectContaining({
                sourceFaceUrl: 'https://source.example.com/asset.png',
                targetImageUrl: 'https://target.example.com/img.png',
                enableOcclusionPrevention: false,
            })
        );
    });

    it('uses sourceImageBase64 and uploads to storage', async () => {
        mockReadBody.mockResolvedValue({
            sourceImageBase64: 'data:image/jpeg;base64,/9j/4AAQ',
            targetImageId: 'target-img-1',
        });

        const handler = (await import('~~/server/api/v1/generation/face-swap.post')).default;
        const event = { context: { user: mockUser } } as any;

        await handler(event);

        expect(storage.put).toHaveBeenCalledWith(
            expect.stringMatching(/user-123\/face-swap-source-/),
            expect.any(Buffer),
            'image/jpeg'
        );
    });

    it('passes enableOcclusionPrevention when true', async () => {
        mockReadBody.mockResolvedValue({
            sourceAssetId: 'asset-123',
            targetImageId: 'target-img-1',
            enableOcclusionPrevention: true,
        });

        const { db } = await import('~~/server/database');
        vi.mocked(db.query.assetTable.findFirst).mockResolvedValue({
            id: 'asset-123',
            storageKey: 'user-123/asset.png',
        } as any);

        const handler = (await import('~~/server/api/v1/generation/face-swap.post')).default;
        const event = { context: { user: mockUser } } as any;

        await handler(event);

        expect(generateFaceSwap).toHaveBeenCalledWith(
            expect.objectContaining({
                enableOcclusionPrevention: true,
            })
        );
    });

    it('saves image and returns it on success', async () => {
        const { db } = await import('~~/server/database');
        vi.mocked(db.query.assetTable.findFirst).mockResolvedValue({
            id: 'asset-123',
            storageKey: 'user-123/asset.png',
        } as any);

        const savedImage = { id: 'new-img-id', storageKey: 'user-123/images/dev/GENERATION/test-uuid.png' };
        vi.mocked(saveImageToDB).mockResolvedValue(savedImage as any);

        const handler = (await import('~~/server/api/v1/generation/face-swap.post')).default;
        const event = { context: { user: mockUser } } as any;

        const result = await handler(event);

        expect(saveImageToDB).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'user-123',
                imageId: 'test-uuid',
                parentId: 'target-img-1',
                type: 'GENERATION',
                state: 'GENERATED',
                generationMetadata: expect.objectContaining({
                    model: 'half-moon-ai/ai-face-swap/faceswapimage',
                    sourceAssetId: 'asset-123',
                }),
            })
        );
        expect(result).toEqual(savedImage);
    });
});
