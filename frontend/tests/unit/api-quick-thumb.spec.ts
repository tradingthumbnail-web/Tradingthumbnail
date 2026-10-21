import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadBody = vi.fn();
const mockCreateError = vi.fn((options: any) => {
    const error = new Error(options.statusMessage);
    (error as any).statusCode = options.statusCode;
    return error;
});

const mockDefineEventHandler = vi.fn((handler: any) => handler);

vi.mock('h3', () => ({
    createError: mockCreateError,
    readBody: mockReadBody,
    defineEventHandler: mockDefineEventHandler,
    default: {
        createError: mockCreateError,
        readBody: mockReadBody,
        defineEventHandler: mockDefineEventHandler,
    },
}));

Object.assign(globalThis, {
    defineEventHandler: mockDefineEventHandler,
    readBody: mockReadBody,
    createError: mockCreateError,
});

vi.mock('../../server/services/user/credits', () => ({
    runChargedWork: vi.fn(async (_userId: string, _amount: number, work: () => Promise<unknown>) => work()),
    deductUserCredits: vi.fn(async () => ({ amount: 1, refund: vi.fn() })),
}));
vi.mock('~~/server/services/user/credits', () => ({
    runChargedWork: vi.fn(async (_userId: string, _amount: number, work: () => Promise<unknown>) => work()),
    deductUserCredits: vi.fn(async () => ({ amount: 1, refund: vi.fn() })),
}));
vi.mock('../../server/services/avatar/owned-avatar', () => ({
    getOwnedAvatarOrThrow: vi.fn(async () => ({ id: 'avatar-1', userId: 'user-123' })),
}));
vi.mock('~~/server/services/avatar/owned-avatar', () => ({
    getOwnedAvatarOrThrow: vi.fn(async () => ({ id: 'avatar-1', userId: 'user-123' })),
}));

vi.mock('../../server/database', () => ({
    db: {
        query: {
            avatarTable: {
                findFirst: vi.fn(),
            },
        },
    },
}));

vi.mock('../../server/storage', () => ({
    storage: {
        get: vi.fn(),
        put: vi.fn(),
        generatePresignedUrl: vi.fn(),
    },
}));

vi.mock('../../server/services/openai/generate-quick-thumb', () => ({
    generateQuickThumbImageWithOpenAI: vi.fn(),
}));

vi.mock('../../server/services/prompt/quick-thumb-description-prompt', () => ({
    generateQuickThumbDescriptionPrompt: vi.fn(),
}));

vi.mock('../../server/services/image/generate-image-description', () => ({
    generateImageDescriptionForInpainting: vi.fn(() => Promise.resolve('test image description')),
}));

vi.mock('../../server/services/prompt/text-description-prompt', () => ({
    generateTextDescriptionPrompt: vi.fn(),
}));

vi.mock('../../server/services/fal/inpainting-face-change', () => ({
    generateInpaintingFaceChange: vi.fn(() => Promise.resolve(Buffer.from('fake-avatar-image'))),
}));

vi.mock('../../server/services/fal/add-text-ideogram', () => ({
    addTextIdeogram: vi.fn(() => Promise.resolve(Buffer.from('fake-final-image'))),
}));

vi.mock('~~/server/services/image.service', () => ({
    saveImageToDB: vi.fn(),
}));

vi.mock('../../server/services/activity/save-activity', () => ({
    saveActivity: vi.fn(),
}));

vi.mock('../../server/utils/clip-mask', () => ({
    generateMaskFromRectanglePosition: vi.fn(() => Promise.resolve(Buffer.from('mask'))),
}));

vi.mock('sharp', () => ({
    default: vi.fn(() => ({
        metadata: vi.fn(() => Promise.resolve({ width: 1536, height: 1024 })),
    })),
}));

vi.mock('crypto', () => ({
    randomUUID: vi.fn(() => 'test-uuid'),
}));

globalThis.fetch = vi.fn(() => Promise.resolve({
    arrayBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(8))),
} as any));

import { storage } from '../../server/storage';
import { generateQuickThumbImageWithOpenAI } from '../../server/services/openai/generate-quick-thumb';
import { generateQuickThumbDescriptionPrompt } from '../../server/services/prompt/quick-thumb-description-prompt';
import { saveImageToDB } from '~~/server/services/image.service';

describe('API: /api/v1/generation/quick-thumb.post - Logic Tests', () => {
    const mockPayload = {
        title: 'Test Video',
        sceneDescription: 'A test scene',
        emotions: 'happy',
        typeOfVideo: 'tutorial',
        thumbnailStyle: 'cinematic',
        includeText: false,
        textHeadline: '',
        layout: 'centered-face',
        includeAvatar: false,
        avatarId: '',
        avatarEmotion: 'surprised',
        avatarPosition: 'center' as const,
        backgroundType: 'custom',
        textPosition: 'center' as const,
        canvasDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };

    it('returns 401 when user is not authenticated', async () => {
        mockReadBody.mockResolvedValue(mockPayload);
        const handler = await import('../../server/api/v1/generation/quick-thumb.post');
        await expect(handler.default({ context: {} } as any)).rejects.toMatchObject({
            message: 'Unauthorized',
            statusCode: 401,
        });
    });

    it('validates that avatar image is only fetched when includeAvatar is true', async () => {
        mockReadBody.mockResolvedValue({
            ...mockPayload,
            includeAvatar: false,
        });

        const mockImageBuffer = Buffer.from('fake-image-data');
        vi.mocked(generateQuickThumbImageWithOpenAI).mockResolvedValue(mockImageBuffer);
        vi.mocked(generateQuickThumbDescriptionPrompt).mockResolvedValue('test prompt');
        vi.mocked(saveImageToDB).mockResolvedValue({ id: 'img-123' } as any);
        vi.mocked(storage.put).mockResolvedValue();
        vi.mocked(storage.generatePresignedUrl).mockResolvedValue('https://example.com/image.png');

        const handler = await import('../../server/api/v1/generation/quick-thumb.post');
        const event = {
            context: { user: { id: 'user-123' } },
        } as any;

        await handler.default(event);

        expect(storage.get).not.toHaveBeenCalled();
        expect(generateQuickThumbImageWithOpenAI).toHaveBeenCalledWith(
            expect.objectContaining({
                avatarImage: '',
            })
        );
    });

    it('fetches avatar image when includeAvatar is true', async () => {
        mockReadBody.mockResolvedValue({
            ...mockPayload,
            includeAvatar: true,
            avatarId: 'avatar-123',
        });

        const mockImageBuffer = Buffer.from('fake-image-data');
        const mockAvatarBuffer = Buffer.from('fake-avatar-data');
        
        vi.mocked(storage.get).mockResolvedValue(mockAvatarBuffer);
        vi.mocked(generateQuickThumbImageWithOpenAI).mockResolvedValue(mockImageBuffer);
        vi.mocked(generateQuickThumbDescriptionPrompt).mockResolvedValue('test prompt');
        vi.mocked(saveImageToDB).mockResolvedValue({ id: 'img-123' } as any);
        vi.mocked(storage.put).mockResolvedValue();
        vi.mocked(storage.generatePresignedUrl).mockResolvedValue('https://example.com/image.png');

        const handler = await import('../../server/api/v1/generation/quick-thumb.post');
        const event = {
            context: { user: { id: 'user-123' } },
        } as any;

        await handler.default(event);

        expect(storage.get).toHaveBeenCalledWith(
            expect.stringContaining('avatar-123')
        );
        expect(generateQuickThumbImageWithOpenAI).toHaveBeenCalledWith(
            expect.objectContaining({
                avatarImage: expect.any(String),
            })
        );
    });

    it('throws error when avatar image is not found', async () => {
        mockReadBody.mockResolvedValue({
            ...mockPayload,
            includeAvatar: true,
            avatarId: 'avatar-123',
        });

        vi.mocked(storage.get).mockResolvedValue(null);

        const handler = await import('../../server/api/v1/generation/quick-thumb.post');
        const event = {
            context: { user: { id: 'user-123' } },
        } as any;

        await expect(handler.default(event)).rejects.toMatchObject({
            statusCode: 500,
        });
    });

    it('calculates positions correctly for different anchors', async () => {
        mockReadBody.mockResolvedValue({
            ...mockPayload,
            avatarPosition: 'top-left' as const,
            textPosition: 'bottom-right' as const,
        });

        const mockImageBuffer = Buffer.from('fake-image-data');
        vi.mocked(generateQuickThumbImageWithOpenAI).mockResolvedValue(mockImageBuffer);
        vi.mocked(generateQuickThumbDescriptionPrompt).mockResolvedValue('test prompt');
        vi.mocked(saveImageToDB).mockResolvedValue({ id: 'img-123' } as any);
        vi.mocked(storage.put).mockResolvedValue();
        vi.mocked(storage.generatePresignedUrl).mockResolvedValue('https://example.com/image.png');

        const handler = await import('../../server/api/v1/generation/quick-thumb.post');
        const event = {
            context: { user: { id: 'user-123' } },
        } as any;

        await handler.default(event);

        expect(generateQuickThumbDescriptionPrompt).toHaveBeenCalledWith(
            expect.objectContaining({
                positions: expect.objectContaining({
                    avatar: expect.objectContaining({
                        anchor: 'top-left',
                    }),
                    text: expect.objectContaining({
                        anchor: 'bottom-right',
                    }),
                }),
            })
        );
    });
});