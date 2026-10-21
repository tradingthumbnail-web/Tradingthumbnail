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

const mockRunChargedWork = vi.fn(async (_userId: string, _amount: number, work: () => Promise<unknown>) => work());
vi.mock('~~/server/services/user/credits', () => ({
    runChargedWork: (...args: unknown[]) => mockRunChargedWork(...args as [string, number, () => Promise<unknown>]),
    deductUserCredits: vi.fn(),
}));

vi.mock('~~/server/database', () => ({
    db: {
        query: {
            stylesTable: {
                findFirst: vi.fn(),
            },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn().mockResolvedValue([{ id: 'sketch-img-1', type: 'SKETCH' }]),
            })),
        })),
    },
}));

vi.mock('~~/server/storage', () => ({
    storage: {
        get: vi.fn(),
        put: vi.fn(),
    },
}));

vi.mock('~~/server/services/openai/generate-sketch', () => ({
    generateSketch: vi.fn(),
    SKETCH_PROMPT: 'SKETCH_PROMPT',
}));

vi.mock('~~/server/utils/color/color-correction', () => ({
    colorCorrection: vi.fn(async (buffer: Buffer) => buffer),
}));

vi.mock('~~/server/services/avatar/owned-avatar', () => ({
    getOwnedAvatarOrThrow: vi.fn(async () => ({ id: 'avatar-1', userId: 'user-123' })),
}));

vi.mock('crypto', () => ({
    randomUUID: vi.fn(() => 'test-uuid'),
}));

vi.mock('node:crypto', () => ({
    randomUUID: vi.fn(() => 'test-uuid'),
}));

import { storage } from '~~/server/storage';
import { generateSketch } from '~~/server/services/openai/generate-sketch';
import { db } from '~~/server/database';
import { FIXED_GENERATION_COSTS } from '~~/server/services/generation/generation-cost';

describe('API: /api/v1/generation/sketch.post', () => {
    const mockUser = { id: 'user-123' };

    beforeEach(() => {
        vi.clearAllMocks();
        mockRunChargedWork.mockImplementation(async (_userId, _amount, work) => work());
        vi.mocked(generateSketch).mockResolvedValue(Buffer.from('sketch-png'));
        vi.mocked(storage.put).mockResolvedValue();
        mockReadBody.mockResolvedValue({
            canvasDataURL: 'data:image/jpeg;base64,Y2FudmFz',
            layoutMetadata: [],
            styleId: null,
            referenceType: 'image',
            avatarId: null,
            reference: undefined,
        });
    });

    it('returns 401 when the user is not authenticated', async () => {
        const handler = (await import('~~/server/api/v1/generation/sketch.post')).default;
        await expect(handler({ context: {} } as any)).rejects.toMatchObject({
            message: 'Unauthorized',
            statusCode: 401,
        });
        expect(generateSketch).not.toHaveBeenCalled();
    });

    it('charges sketch credits and calls generateSketch with the canvas', async () => {
        const handler = (await import('~~/server/api/v1/generation/sketch.post')).default;
        const result = await handler({ context: { user: mockUser } } as any);

        expect(mockRunChargedWork).toHaveBeenCalledWith(
            'user-123',
            FIXED_GENERATION_COSTS.sketch,
            expect.any(Function),
        );
        expect(generateSketch).toHaveBeenCalledWith(expect.objectContaining({
            canvasDataURL: 'data:image/jpeg;base64,Y2FudmFz',
            referenceType: 'image',
        }));
        expect(storage.put).toHaveBeenCalled();
        expect(result).toMatchObject({ id: 'sketch-img-1', type: 'SKETCH' });
    });

    it('returns 400 when an avatar reference is selected without an avatar id', async () => {
        mockReadBody.mockResolvedValue({
            canvasDataURL: 'data:image/jpeg;base64,Y2FudmFz',
            referenceType: 'avatar',
            avatarId: null,
        });

        const handler = (await import('~~/server/api/v1/generation/sketch.post')).default;
        await expect(handler({ context: { user: mockUser } } as any)).rejects.toMatchObject({
            message: 'Avatar is required',
            statusCode: 400,
        });
    });

    it('returns 404 when the requested style does not exist', async () => {
        mockReadBody.mockResolvedValue({
            canvasDataURL: 'data:image/jpeg;base64,Y2FudmFz',
            styleId: 'missing-style',
            referenceType: 'image',
        });
        vi.mocked(db.query.stylesTable.findFirst).mockResolvedValue(undefined as any);

        const handler = (await import('~~/server/api/v1/generation/sketch.post')).default;
        await expect(handler({ context: { user: mockUser } } as any)).rejects.toMatchObject({
            message: 'Style not found',
            statusCode: 404,
        });
    });
});
