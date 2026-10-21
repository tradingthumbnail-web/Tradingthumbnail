// @vitest-environment jsdom
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

vi.mock('~~/server/services/avatar/owned-avatar', () => ({
    getOwnedAvatarOrThrow: vi.fn(async () => ({ id: 'avatar-1', userId: 'user-123' })),
}));

const mockFindFirst = vi.fn();
const mockGenerateQuickThumb = vi.fn();

vi.mock('~~/server/database', () => ({
    db: {
        query: {
            pipelineTable: { findFirst: mockFindFirst },
            avatarTable: { findFirst: vi.fn() },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve(undefined)),
            })),
        })),
    },
}));

vi.mock('~~/server/storage', () => ({
    storage: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        generatePresignedUrl: vi.fn().mockResolvedValue('https://presigned.example.com/img.png'),
    },
}));

vi.mock('~~/server/storage/keys', () => ({
    generateImageStorageKey: vi.fn(() => 'user-123/images/THUMBNAIL/test-uuid'),
    generateAvatarWeightsKey: vi.fn(() => 'user-123/avatar/avatar-1/weights'),
    generateAvatarTrainingImageKey: vi.fn(() => 'user-123/avatar/avatar-1/training/1'),
}));

vi.mock('~~/server/services/image.service', () => ({
    saveImageToDB: vi.fn().mockResolvedValue({
        id: 'new-img-id',
        storageKey: 'test-key',
        type: 'THUMBNAIL',
    }),
}));

vi.mock('~~/server/services/openai/generate-quick-thumb', () => ({
    generateQuickThumbImageWithOpenAI: mockGenerateQuickThumb,
}));

vi.mock('~~/server/services/image/generate-image-description', () => ({
    generateImageDescriptionForInpainting: vi.fn().mockResolvedValue('test description'),
}));

vi.mock('~~/server/services/activity/save-activity', () => ({
    saveActivity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('~~/server/utils/clip-mask', () => ({
    generateMaskFromRectanglePosition: vi.fn().mockResolvedValue(Buffer.from('mask')),
}));

vi.mock('~~/server/services/fal/inpainting-face-change', () => ({
    generateInpaintingFaceChange: vi.fn().mockResolvedValue(Buffer.from('generated')),
}));

vi.mock('sharp', () => ({
    default: vi.fn(() => ({
        metadata: vi.fn().mockResolvedValue({ width: 1270, height: 720 }),
    })),
}));

vi.mock('crypto', () => {
    const randomUUID = vi.fn(() => 'test-uuid');
    return {
        randomUUID,
        default: { randomUUID },
    };
});

global.fetch = vi.fn().mockResolvedValue({
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
});

const mockPipeline = {
    id: 'pipeline-1',
    userId: 'user-123',
    name: 'Test Pipeline',
    description: 'Test',
    canvasData: {
        fabricJson: {},
        elements: [
            {
                id: 'elem-1',
                type: 'TEXT',
                label: 'Title',
                isConfigurable: true,
                position: { x: 100, y: 100, width: 200, height: 50 },
                textOptions: { defaultText: 'Hello' },
            },
        ],
    },
    config: {},
    executionCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
};

describe('API: /api/v1/generation/pipeline.post', () => {
    const mockUser = { id: 'user-123' };

    beforeEach(() => {
        vi.clearAllMocks();
        mockFindFirst.mockResolvedValue(mockPipeline);
        mockGenerateQuickThumb.mockResolvedValue(Buffer.from('generated-image'));
        mockReadBody.mockResolvedValue({
            pipelineId: 'pipeline-1',
            parameters: { 'elem-1': { text: 'Custom Title' } },
            canvasDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            useSimilarStyle: false,
        });
    });

    it('returns 401 when user is not authenticated', async () => {
        const handler = (await import('~~/server/api/v1/generation/pipeline.post')).default;
        const event = { context: {} } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Unauthorized',
            statusCode: 401,
        });
    });

    it('returns 400 when pipelineId is missing', async () => {
        mockReadBody.mockResolvedValue({
            parameters: {},
            canvasDataUrl: 'data:image/png;base64,xxx',
        });

        const handler = (await import('~~/server/api/v1/generation/pipeline.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('required'),
        });
    });

    it('returns 404 when pipeline not found', async () => {
        mockFindFirst.mockResolvedValue(null);

        const handler = (await import('~~/server/api/v1/generation/pipeline.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 404,
            message: 'Pipeline not found',
        });
    });

    it('generates image and returns saved image', async () => {
        const { storage } = await import('~~/server/storage');
        const { saveImageToDB } = await import('~~/server/services/image.service');
        vi.mocked(storage.put).mockResolvedValue();

        const handler = (await import('~~/server/api/v1/generation/pipeline.post')).default;
        const event = { context: { user: mockUser } } as any;

        const result = await handler(event);

        expect(mockGenerateQuickThumb).toHaveBeenCalled();
        expect(saveImageToDB).toHaveBeenCalled();
        expect(result).toMatchObject({ id: 'new-img-id', type: 'THUMBNAIL' });
    });
});