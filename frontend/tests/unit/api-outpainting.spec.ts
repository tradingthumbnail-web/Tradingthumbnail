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
        query: { imageTable: { findFirst: vi.fn() } },
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })) })),
    },
}));

vi.mock('~~/server/storage', () => ({
    storage: {
        put: vi.fn(),
        get: vi.fn(),
        generatePresignedUrl: vi.fn(),
    },
}));

vi.mock('~~/server/services/image.service', () => ({
    saveImageToDB: vi.fn(),
}));

vi.mock('~~/server/services/activity/save-activity', () => ({
    saveActivity: vi.fn(),
}));

vi.mock('~~/server/services/image/generate-outpainting-mask', () => ({
    generateOutpaintingMask: vi.fn(() => Promise.resolve(Buffer.from('mask'))),
}));

vi.mock('~~/server/services/fal/outpainting', () => ({
    generateOutpaintingImage: vi.fn(() => Promise.resolve(Buffer.from('outpainted'))),
    FLUX_LORA_FILL_PARAMS: {},
}));

const createSharpChain = (buf: Buffer) => {
    const chain = {
        resize: vi.fn(() => chain),
        extract: vi.fn(() => chain),
        composite: vi.fn(() => chain),
        png: vi.fn(() => chain),
        toBuffer: vi.fn(() => Promise.resolve(buf)),
    };
    return chain;
};
vi.mock('sharp', () => ({
    default: vi.fn((input: any) => {
        if (input && typeof input === 'object' && 'create' in input) {
            return createSharpChain(Buffer.from('canvas'));
        }
        return createSharpChain(Buffer.from('processed'));
    }),
}));

vi.mock('crypto', () => ({
    randomUUID: vi.fn(() => 'test-uuid'),
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

import { storage } from '~~/server/storage';
import { saveImageToDB } from '~~/server/services/image.service';
import { generateOutpaintingImage } from '~~/server/services/fal/outpainting';
import { db } from '~~/server/database';

describe('API: /api/v1/generation/outpainting.post', () => {
    const mockUser = { id: 'user-123' };
    const mockOriginalImage = {
        id: 'img-1',
        storageKey: 'user-123/images/img1.png',
        userId: 'user-123',
        rootId: null,
        projectId: null,
        branchId: null,
        toolId: null,
    };

    const validBody = {
        originalImageId: 'img-1',
        dimensions: { width: 1270, height: 720 },
        position: { x: 635, y: 360 },
        image: { width: 1270, height: 720 },
        scale: 1,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(storage.put).mockResolvedValue();
        vi.mocked(storage.get).mockResolvedValue(Buffer.from('image-data'));
        vi.mocked(storage.generatePresignedUrl).mockResolvedValue('https://presigned.example.com/img.png');
        vi.mocked(db.query.imageTable.findFirst).mockResolvedValue(mockOriginalImage as any);
        vi.mocked(saveImageToDB).mockResolvedValue({ id: 'new-img-id' } as any);
        mockReadBody.mockResolvedValue(validBody);
    });

    it('returns 401 when user is not authenticated', async () => {
        const handler = (await import('~~/server/api/v1/generation/outpainting.post')).default;
        const event = { context: {} } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Unauthorized',
            statusCode: 401,
        });
    });

    it('returns 400 when originalImageId is missing', async () => {
        mockReadBody.mockResolvedValue({
            ...validBody,
            originalImageId: null,
        });

        const handler = (await import('~~/server/api/v1/generation/outpainting.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Bad Request',
            statusCode: 400,
        });
    });

    it('returns 400 when scale is out of bounds', async () => {
        mockReadBody.mockResolvedValue({
            ...validBody,
            scale: 0.01,
        });

        const handler = (await import('~~/server/api/v1/generation/outpainting.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Bad Request',
            statusCode: 400,
        });
    });

    it('returns 404 when image is not owned by the user', async () => {
        vi.mocked(db.query.imageTable.findFirst).mockResolvedValue(null);

        const handler = (await import('~~/server/api/v1/generation/outpainting.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Image not found',
            statusCode: 404,
        });
    });

    it('calls generateOutpaintingImage and saves result', async () => {
        const handler = (await import('~~/server/api/v1/generation/outpainting.post')).default;
        const event = { context: { user: mockUser } } as any;

        const result = await handler(event);

        expect(generateOutpaintingImage).toHaveBeenCalledWith(
            expect.objectContaining({
                model: 'fal-ai/flux-lora-fill',
                prompt: 'Extend the image naturally, maintain consistency',
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
});
