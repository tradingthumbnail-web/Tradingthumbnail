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

const mockFindFirstAvatar = vi.fn();
vi.mock('~~/server/database', () => ({
    db: {
        query: {
            avatarTable: {
                findFirst: (...args: unknown[]) => mockFindFirstAvatar(...args),
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

vi.mock('~~/server/services/fal/generate-photoshoot', () => ({
    generatePhotoshootImages: vi.fn(),
    FLUX_KONTEXT_LORA_PARAMS: { num_inference_steps: 30, guidance_scale: 2.5 },
}));

vi.mock('~~/server/services/prompt/optimize-prompt', () => ({
    optimizePhotoshootPrompt: vi.fn(),
}));

vi.mock('~~/server/services/image.service', () => ({
    saveImageToDB: vi.fn(),
}));

vi.mock('~~/server/services/activity/save-activity', () => ({
    saveActivity: vi.fn(),
}));

vi.mock('crypto', () => ({
    randomUUID: vi.fn(() => '11111111-1111-4111-8111-111111111111'),
}));

import { storage } from '~~/server/storage';
import { generatePhotoshootImages } from '~~/server/services/fal/generate-photoshoot';
import { optimizePhotoshootPrompt } from '~~/server/services/prompt/optimize-prompt';
import { saveImageToDB } from '~~/server/services/image.service';
import { computePhotoshootCost } from '~~/server/services/generation/generation-cost';

const OWNED_AVATAR_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_AVATAR_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const USER_ID = '901617ea-87ae-4b32-ab5c-8005ca73ee36';

const validBody = {
    avatarId: OWNED_AVATAR_ID,
    description: 'A young woman with dark brown hair',
    expression: 'Neutral',
    cameraAngle: 'Frontal',
    background: 'none',
    variations: 1,
};

describe('API: /api/v1/generation/photoshoot.post', () => {
    const mockUser = { id: USER_ID };
    const ownedAvatar = {
        id: OWNED_AVATAR_ID,
        userId: USER_ID,
        gender: 'FEMALE',
        deletedAt: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockRunChargedWork.mockImplementation(async (_userId, _amount, work) => work());
        mockFindFirstAvatar.mockResolvedValue(ownedAvatar);
        vi.mocked(storage.generatePresignedUrl).mockResolvedValue('https://example.com/weights.safetensors');
        vi.mocked(storage.put).mockResolvedValue();
        vi.mocked(optimizePhotoshootPrompt).mockResolvedValue('optimized photoshoot prompt');
        vi.mocked(generatePhotoshootImages).mockResolvedValue(['https://example.com/generated.png']);
        vi.mocked(saveImageToDB).mockResolvedValue({ id: 'image-1', type: 'CHARACTER' } as any);
        globalThis.fetch = vi.fn(async () => ({
            arrayBuffer: async () => new ArrayBuffer(8),
        })) as any;
        mockReadBody.mockResolvedValue({ ...validBody });
    });

    async function loadHandler() {
        return (await import('~~/server/api/v1/generation/photoshoot.post')).default;
    }

    it('returns 401 when the user is not authenticated', async () => {
        const handler = await loadHandler();
        await expect(handler({ context: {} } as any)).rejects.toMatchObject({
            message: 'Unauthorized',
            statusCode: 401,
        });
        expect(mockRunChargedWork).not.toHaveBeenCalled();
        expect(mockFindFirstAvatar).not.toHaveBeenCalled();
    });

    it('returns 400 and does not charge when avatarId is missing', async () => {
        mockReadBody.mockResolvedValue({ ...validBody, avatarId: undefined });
        const handler = await loadHandler();

        await expect(handler({ context: { user: mockUser } } as any)).rejects.toMatchObject({
            message: 'A valid avatar is required',
            statusCode: 400,
        });
        expect(mockRunChargedWork).not.toHaveBeenCalled();
        expect(mockFindFirstAvatar).not.toHaveBeenCalled();
    });

    it('returns 400 and does not charge when avatarId is null', async () => {
        mockReadBody.mockResolvedValue({ ...validBody, avatarId: null });
        const handler = await loadHandler();

        await expect(handler({ context: { user: mockUser } } as any)).rejects.toMatchObject({
            message: 'A valid avatar is required',
            statusCode: 400,
        });
        expect(mockRunChargedWork).not.toHaveBeenCalled();
        expect(mockFindFirstAvatar).not.toHaveBeenCalled();
    });

    it('returns 400 and does not charge when avatarId is empty', async () => {
        mockReadBody.mockResolvedValue({ ...validBody, avatarId: '' });
        const handler = await loadHandler();

        await expect(handler({ context: { user: mockUser } } as any)).rejects.toMatchObject({
            message: 'A valid avatar is required',
            statusCode: 400,
        });
        expect(mockRunChargedWork).not.toHaveBeenCalled();
        expect(mockFindFirstAvatar).not.toHaveBeenCalled();
    });

    it('returns 400 and does not charge when avatarId is not a UUID', async () => {
        mockReadBody.mockResolvedValue({ ...validBody, avatarId: 'not-a-uuid' });
        const handler = await loadHandler();

        await expect(handler({ context: { user: mockUser } } as any)).rejects.toMatchObject({
            message: 'A valid avatar is required',
            statusCode: 400,
        });
        expect(mockRunChargedWork).not.toHaveBeenCalled();
        expect(mockFindFirstAvatar).not.toHaveBeenCalled();
    });

    it('accepts a valid UUID and continues to the avatar lookup', async () => {
        mockFindFirstAvatar.mockResolvedValue(undefined);
        const handler = await loadHandler();

        await expect(handler({ context: { user: mockUser } } as any)).rejects.toMatchObject({
            message: 'Avatar not found',
            statusCode: 404,
        });
        expect(mockRunChargedWork).toHaveBeenCalled();
        expect(mockFindFirstAvatar).toHaveBeenCalled();
    });

    it('returns 404 for a valid UUID that is not owned by the user', async () => {
        mockReadBody.mockResolvedValue({ ...validBody, avatarId: OTHER_AVATAR_ID });
        mockFindFirstAvatar.mockResolvedValue(undefined);
        const handler = await loadHandler();

        await expect(handler({ context: { user: mockUser } } as any)).rejects.toMatchObject({
            message: 'Avatar not found',
            statusCode: 404,
        });
        expect(mockRunChargedWork).toHaveBeenCalled();
        expect(mockFindFirstAvatar).toHaveBeenCalled();
        expect(generatePhotoshootImages).not.toHaveBeenCalled();
    });

    it('charges credits and generates when the avatar UUID is owned', async () => {
        const handler = await loadHandler();
        const result = await handler({ context: { user: mockUser } } as any);

        expect(mockRunChargedWork).toHaveBeenCalledWith(
            USER_ID,
            computePhotoshootCost(1),
            expect.any(Function),
        );
        expect(optimizePhotoshootPrompt).toHaveBeenCalled();
        expect(generatePhotoshootImages).toHaveBeenCalledWith(expect.objectContaining({
            model: 'fal-ai/flux-lora',
            prompt: 'optimized photoshoot prompt',
            numberOfImages: 1,
        }));
        expect(result).toEqual([{ id: 'image-1', type: 'CHARACTER' }]);
    });
});
