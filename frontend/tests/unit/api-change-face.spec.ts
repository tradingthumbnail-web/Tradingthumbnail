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
            avatarTable: { findFirst: vi.fn() },
            imageTable: { findFirst: vi.fn() },
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
    saveImageToDB: vi.fn(),
}));

vi.mock('~~/server/services/image/generate-image-description', () => ({
    generateImageDescriptionForInpainting: vi.fn((_url: string, prompt: string) => Promise.resolve(prompt)),
}));

vi.mock('~~/server/services/fal/inpainting-face-change', () => ({
    generateInpaintingFaceChange: vi.fn(() => Promise.resolve(Buffer.from('face-changed'))),
    FLUX_INPAINTING_FACE_CHANGE_PARAMS: {},
}));

vi.mock('~~/server/utils/clip-mask', () => ({
    convertPathToMask: vi.fn(() => Promise.resolve(Buffer.from('mask'))),
}));

vi.mock('crypto', () => ({
    randomUUID: vi.fn(() => 'test-uuid'),
}));

import { storage } from '~~/server/storage';
import { saveImageToDB } from '~~/server/services/image.service';
import { generateInpaintingFaceChange } from '~~/server/services/fal/inpainting-face-change';
import { db } from '~~/server/database';

describe('API: /api/v1/generation/change-face.post', () => {
    const mockUser = { id: 'user-123' };
    const mockAvatar = { id: 'avatar-1', userId: 'user-123', deletedAt: null };
    const mockOriginalImage = {
        id: 'img-1',
        storageKey: 'user-123/images/img1.png',
        userId: 'user-123',
        rootId: null,
        projectId: null,
        branchId: null,
        toolId: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(storage.put).mockResolvedValue();
        vi.mocked(storage.generatePresignedUrl).mockResolvedValue('https://presigned.example.com/img.png');
        vi.mocked(db.query.avatarTable.findFirst).mockResolvedValue(mockAvatar as any);
        vi.mocked(db.query.imageTable.findFirst).mockResolvedValue(mockOriginalImage as any);
        vi.mocked(saveImageToDB).mockResolvedValue({ id: 'new-img-id' } as any);
        mockReadBody.mockResolvedValue({
            avatarId: 'avatar-1',
            prompt: 'human face',
            pathMask: 'data:image/png;base64,iVBORw0KGgo=',
            originalImageId: 'img-1',
        });
    });

    it('returns 401 when user is not authenticated', async () => {
        const handler = (await import('~~/server/api/v1/generation/change-face.post')).default;
        const event = { context: {} } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Unauthorized',
            statusCode: 401,
        });
    });

    it('returns 400 when avatarId is missing', async () => {
        mockReadBody.mockResolvedValue({
            prompt: 'human face',
            pathMask: 'data:image/png;base64,abc',
            originalImageId: 'img-1',
        });

        const handler = (await import('~~/server/api/v1/generation/change-face.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Bad Request',
            statusCode: 400,
        });
    });

    it('returns 404 when avatar is not owned by the user', async () => {
        vi.mocked(db.query.avatarTable.findFirst).mockResolvedValue(null);

        const handler = (await import('~~/server/api/v1/generation/change-face.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Avatar not found',
            statusCode: 404,
        });
    });

    it('returns 404 when image is not owned by the user', async () => {
        vi.mocked(db.query.imageTable.findFirst).mockResolvedValue(null);

        const handler = (await import('~~/server/api/v1/generation/change-face.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Image not found',
            statusCode: 404,
        });
    });

    it('calls generateInpaintingFaceChange and saves result', async () => {
        const handler = (await import('~~/server/api/v1/generation/change-face.post')).default;
        const event = { context: { user: mockUser } } as any;

        const result = await handler(event);

        expect(generateInpaintingFaceChange).toHaveBeenCalledWith(
            expect.objectContaining({
                model: 'fal-ai/flux-lora/inpainting',
                prompt: 'human face',
                imageUrl: 'https://presigned.example.com/img.png',
            })
        );
        expect(saveImageToDB).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'user-123',
                imageId: 'test-uuid',
                parentId: 'img-1',
                type: 'CHARACTER',
                state: 'GENERATED',
            })
        );
        expect(result).toEqual({ id: 'new-img-id' });
    });
});
