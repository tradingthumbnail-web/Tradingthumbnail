import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadBody = vi.fn();
const mockGetRouterParams = vi.fn();
const mockCreateError = vi.fn((opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    (err as any).statusCode = opts.statusCode;
    return err;
});

vi.mock('h3', () => ({
    createError: mockCreateError,
    readBody: mockReadBody,
    getRouterParams: mockGetRouterParams,
    defineEventHandler: vi.fn((handler: any) => handler),
}));

Object.assign(globalThis, {
    defineEventHandler: vi.fn((handler: any) => handler),
    readBody: mockReadBody,
    getRouterParams: mockGetRouterParams,
    createError: mockCreateError,
});

const mockOwnedImage = vi.fn();
const mockOwnedAvatar = vi.fn();
const mockDbUpdateWhere = vi.fn();
const mockDbDeleteWhere = vi.fn();

vi.mock('~~/server/services/image.service', () => ({
    getOwnedImageOrThrow: (...args: unknown[]) => mockOwnedImage(...args),
}));

vi.mock('~~/server/services/avatar/owned-avatar', () => ({
    getOwnedAvatarOrThrow: (...args: unknown[]) => mockOwnedAvatar(...args),
}));

vi.mock('~~/server/database', () => ({
    db: {
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: mockDbUpdateWhere,
            })),
        })),
        delete: vi.fn(() => ({
            where: mockDbDeleteWhere,
        })),
        transaction: vi.fn(async (fn: any) => fn({
            delete: vi.fn(() => ({ where: mockDbDeleteWhere })),
        })),
    },
}));

vi.mock('~~/server/storage', () => ({
    storage: {
        delete: vi.fn(),
        deleteAllFilesInFolder: vi.fn(),
    },
}));

describe('API authorization: image delete', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetRouterParams.mockReturnValue({ imageId: 'img-1' });
        mockOwnedImage.mockResolvedValue({ id: 'img-1', userId: 'user-a', storageKey: 'user-a/img.png' });
        mockDbDeleteWhere.mockResolvedValue(undefined);
    });

    it('rejects unauthenticated delete', async () => {
        const handler = (await import('~~/server/api/v1/image/[imageId]/index.delete')).default;
        await expect(handler({ context: {} } as any)).rejects.toMatchObject({
            message: 'Unauthorized',
            statusCode: 401,
        });
        expect(mockOwnedImage).not.toHaveBeenCalled();
    });

    it('rejects deleting another user\'s image', async () => {
        mockOwnedImage.mockRejectedValue(Object.assign(new Error('Image not found'), { statusCode: 404 }));
        const handler = (await import('~~/server/api/v1/image/[imageId]/index.delete')).default;
        await expect(handler({ context: { user: { id: 'user-a' } } } as any)).rejects.toMatchObject({
            message: 'Image not found',
            statusCode: 404,
        });
        expect(mockOwnedImage).toHaveBeenCalledWith('img-1', 'user-a');
    });

    it('rejects a missing image id', async () => {
        mockGetRouterParams.mockReturnValue({ imageId: '' });
        const handler = (await import('~~/server/api/v1/image/[imageId]/index.delete')).default;
        await expect(handler({ context: { user: { id: 'user-a' } } } as any)).rejects.toMatchObject({
            statusCode: 400,
        });
    });
});

describe('API authorization: toggle favorite', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetRouterParams.mockReturnValue({ imageId: 'img-1' });
        mockOwnedImage.mockResolvedValue({
            id: 'img-1',
            userId: 'user-a',
            imageMetadata: { isFavorite: false },
        });
        mockDbUpdateWhere.mockResolvedValue(undefined);
    });

    it('rejects unauthenticated favorite toggle', async () => {
        const handler = (await import('~~/server/api/v1/image/[imageId]/toggle-favorite.post')).default;
        await expect(handler({ context: {} } as any)).rejects.toMatchObject({
            message: 'Unauthorized',
            statusCode: 401,
        });
        expect(mockOwnedImage).not.toHaveBeenCalled();
    });

    it('rejects toggling another user\'s image', async () => {
        mockOwnedImage.mockRejectedValue(Object.assign(new Error('Image not found'), { statusCode: 404 }));
        const handler = (await import('~~/server/api/v1/image/[imageId]/toggle-favorite.post')).default;
        await expect(handler({ context: { user: { id: 'user-a' } } } as any)).rejects.toMatchObject({
            message: 'Image not found',
            statusCode: 404,
        });
        expect(mockOwnedImage).toHaveBeenCalledWith('img-1', 'user-a');
    });
});

describe('API authorization: avatar archive', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetRouterParams.mockReturnValue({ avatarId: 'avatar-b' });
        mockDbUpdateWhere.mockResolvedValue(undefined);
    });

    it('rejects unauthenticated archive', async () => {
        const handler = (await import('~~/server/api/v1/avatar/[avatarId]/archive.post')).default;
        await expect(handler({ context: {} } as any)).rejects.toMatchObject({
            message: 'Unauthorized',
            statusCode: 401,
        });
        expect(mockOwnedAvatar).not.toHaveBeenCalled();
    });

    it('rejects archiving another user\'s avatar', async () => {
        mockOwnedAvatar.mockRejectedValue(Object.assign(new Error('Avatar not found'), { statusCode: 404 }));
        const handler = (await import('~~/server/api/v1/avatar/[avatarId]/archive.post')).default;
        await expect(handler({ context: { user: { id: 'user-a' } } } as any)).rejects.toMatchObject({
            message: 'Avatar not found',
            statusCode: 404,
        });
        expect(mockOwnedAvatar).toHaveBeenCalledWith('avatar-b', 'user-a');
        expect(mockDbUpdateWhere).not.toHaveBeenCalled();
    });
});

describe('API authorization: pay-for-generation no longer trusts client amounts', () => {
    it('requires authentication and ignores client-supplied amountToPay', async () => {
        mockReadBody.mockResolvedValue({ amountToPay: 0 });
        const handler = (await import('~~/server/api/v1/user/pay-for-generation.post')).default;

        await expect(handler({ context: {} } as any)).rejects.toMatchObject({
            statusCode: 401,
        });

        const result = await handler({
            context: { user: { id: 'user-a', credit: 42 } },
        } as any);

        expect(result.remainingCredits).toBe(42);
        expect(result.statusMessage).toContain('generation endpoints');
    });
});
