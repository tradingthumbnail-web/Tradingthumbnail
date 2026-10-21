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

vi.mock('~~/server/database', () => ({
    db: {
        query: { imageTable: { findFirst: vi.fn() } },
    },
}));

vi.mock('~~/server/storage', () => ({
    storage: {
        put: vi.fn(),
    },
}));

vi.mock('~~/server/services/image.service', () => ({
    saveImageToDB: vi.fn(),
}));

vi.mock('crypto', () => ({
    randomUUID: vi.fn(() => 'test-uuid'),
}));

vi.mock('sharp', () => ({
    default: vi.fn(() => ({
        extract: vi.fn(() => ({
            toBuffer: vi.fn(() => Promise.resolve(Buffer.from('extracted'))),
        })),
    })),
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

import { storage } from '~~/server/storage';
import { saveImageToDB } from '~~/server/services/image.service';
import { db } from '~~/server/database';

describe('API: /api/v1/image/new-version.post', () => {
    const mockUser = { id: 'user-123' };
    const mockBaseImage = {
        id: 'img-1',
        storageKey: 'user-123/images/img1.png',
        userId: 'user-123',
        rootId: null,
        type: 'GENERATION',
        imageMetadata: {},
        generationMetadata: {},
    };

    const validBody = {
        canvasDataURL: 'data:image/png;base64,iVBORw0KGgo=',
        imageId: 'img-1',
        imageRectangle: { left: 0, top: 0, width: 100, height: 100 },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(storage.put).mockResolvedValue();
        vi.mocked(db.query.imageTable.findFirst).mockResolvedValue(mockBaseImage as any);
        vi.mocked(saveImageToDB).mockResolvedValue({ id: 'new-img-id' } as any);
        mockReadBody.mockResolvedValue(validBody);
        mockFetch.mockResolvedValue({
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        });
    });

    it('returns 401 when user is not authenticated', async () => {
        const handler = (await import('~~/server/api/v1/image/new-version.post')).default;
        const event = { context: {} } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Unauthorized',
            statusCode: 401,
        });
    });

    it('returns 400 when canvasDataURL is missing', async () => {
        mockReadBody.mockResolvedValue({
            imageId: 'img-1',
            imageRectangle: { left: 0, top: 0, width: 100, height: 100 },
        });

        const handler = (await import('~~/server/api/v1/image/new-version.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: expect.stringContaining('Canvas data URL'),
            statusCode: 400,
        });
    });

    it('returns 400 when imageRectangle has invalid format', async () => {
        mockReadBody.mockResolvedValue({
            ...validBody,
            imageRectangle: { left: 'invalid', top: 0, width: 100, height: 100 },
        });

        const handler = (await import('~~/server/api/v1/image/new-version.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Invalid imageRectangle format',
            statusCode: 400,
        });
    });

    it('returns 500 when base image not found', async () => {
        vi.mocked(db.query.imageTable.findFirst).mockResolvedValue(null);

        const handler = (await import('~~/server/api/v1/image/new-version.post')).default;
        const event = { context: { user: mockUser } } as any;

        await expect(handler(event)).rejects.toMatchObject({
            message: 'Internal server error',
            statusCode: 500,
        });
    });

    it('saves new version and returns it', async () => {
        const handler = (await import('~~/server/api/v1/image/new-version.post')).default;
        const event = { context: { user: mockUser } } as any;

        const result = await handler(event);

        expect(storage.put).toHaveBeenCalled();
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
