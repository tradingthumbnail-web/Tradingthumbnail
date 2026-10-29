import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUpdateReturning = vi.fn();
const mockUpdateWhere = vi.fn(() => ({ returning: mockUpdateReturning }));
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockFindFirstUser = vi.fn();
const mockFindFirstAvatar = vi.fn();

const mockStoragePut = vi.fn();
const mockGeneratePresignedUrl = vi.fn();

const mockFalConfig = vi.fn();
const mockFalQueueStatus = vi.fn();
const mockFalQueueResult = vi.fn();

const mockSendEmail = vi.fn();

vi.mock('~~/server/database', () => ({
    db: {
        update: vi.fn(() => ({
            set: mockUpdateSet,
        })),
        query: {
            userTable: {
                findFirst: (...args: unknown[]) => mockFindFirstUser(...args),
            },
            avatarTable: {
                findFirst: (...args: unknown[]) => mockFindFirstAvatar(...args),
            },
        },
    },
}));

vi.mock('~~/server/storage', () => ({
    storage: {
        put: (...args: unknown[]) => mockStoragePut(...args),
        generatePresignedUrl: (...args: unknown[]) => mockGeneratePresignedUrl(...args),
    },
}));

vi.mock('@fal-ai/client', () => ({
    fal: {
        config: (...args: unknown[]) => mockFalConfig(...args),
        queue: {
            status: (...args: unknown[]) => mockFalQueueStatus(...args),
            result: (...args: unknown[]) => mockFalQueueResult(...args),
        },
    },
}));

vi.mock('~~/server/services/emails/avatar-training-complete', () => ({
    sendAvatarTrainingCompleteEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock('~~/server/utils/logger', () => ({
    log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

Object.assign(globalThis, {
    useRuntimeConfig: () => ({
        falApiKey: 'test-fal-key',
        public: {
            appUrl: 'https://tradingthumbnail.vercel.app',
        },
    }),
    createError: (opts: { statusCode: number; statusMessage: string }) => {
        const err = new Error(opts.statusMessage);
        (err as any).statusCode = opts.statusCode;
        (err as any).statusMessage = opts.statusMessage;
        return err;
    },
});

import {
    buildFalAvatarTrainingWebhookUrl,
    resolvePublicWebhookBaseUrl,
} from '~~/server/utils/public-webhook-url';
import { generateAvatarWeightsKey } from '~~/server/storage/keys';
import {
    persistCompletedAvatarWeights,
    reconcileTrainingAvatar,
    reconcileTrainingAvatars,
} from '~~/server/services/avatar/reconcile-avatar-training';
import type { Avatar } from '~~/server/database/schemas/avatar.schema';

const SAMPLE_AVATAR: Avatar = {
    id: '54f8a6c4-ac9b-4b18-90e0-55ae1cbd8b3e',
    userId: 'e4146bb7-5856-4caa-80a2-8e3c0462a5b5',
    ownerId: 'e4146bb7-5856-4caa-80a2-8e3c0462a5b5',
    name: 'Khanwaiz',
    storageKey: 'e4146bb7-5856-4caa-80a2-8e3c0462a5b5/avatars/production/54f8a6c4-ac9b-4b18-90e0-55ae1cbd8b3e',
    trainingMetadata: {
        baseModel: 'fal-ai/flux-lora-portrait-trainer',
        requestId: '01a186fe-32ca-7280-a4d1-a022b82db0d0',
        startedAt: '2026-10-29T09:29:28.560Z',
        trainingSteps: 2000,
        triggerPhrase: 'kamusari',
        trainingImages: 15,
    },
    status: 'TRAINING',
    gender: 'MALE',
    createdAt: new Date('2026-10-29T09:29:28.669Z'),
    trainedAt: new Date('2026-10-29T09:29:28.560Z'),
    deletedAt: null,
};

describe('Avatar training webhook URL resolution', () => {
    it('normalizes the Vercel SSO-protected team alias to the public production alias', () => {
        expect(
            resolvePublicWebhookBaseUrl('https://tradingthumbnail-tradingthumbnail-8441.vercel.app')
        ).toBe('https://tradingthumbnail.vercel.app');

        expect(
            buildFalAvatarTrainingWebhookUrl('https://tradingthumbnail-tradingthumbnail-8441.vercel.app/')
        ).toBe('https://tradingthumbnail.vercel.app/api/webhook/fal/avatar-training-finish');
    });

    it('preserves explicit public URLs and strips trailing slashes', () => {
        expect(
            buildFalAvatarTrainingWebhookUrl('https://tradingthumbnail.vercel.app/')
        ).toBe('https://tradingthumbnail.vercel.app/api/webhook/fal/avatar-training-finish');
    });
});

describe('Avatar weights storage key resolution', () => {
    it('prefers the persisted avatar storageKey when provided so production paths resolve consistently', () => {
        const key = generateAvatarWeightsKey(
            SAMPLE_AVATAR.userId,
            SAMPLE_AVATAR.id,
            SAMPLE_AVATAR.storageKey
        );
        expect(key).toBe(
            'e4146bb7-5856-4caa-80a2-8e3c0462a5b5/avatars/production/54f8a6c4-ac9b-4b18-90e0-55ae1cbd8b3e/model.safetensors'
        );
    });
});

describe('Avatar training status reconciliation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFindFirstUser.mockResolvedValue({
            id: SAMPLE_AVATAR.userId,
            email: 'user@example.com',
            username: 'khanwaiz',
            locale: 'en',
        });
    });

    it('uploads weights to R2 first and updates DB to TRAINED when FAL status is COMPLETED', async () => {
        const fakeBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                arrayBuffer: async () => fakeBytes.buffer,
            })
        );

        mockFalQueueStatus.mockResolvedValue({ status: 'COMPLETED' });
        mockFalQueueResult.mockResolvedValue({
            data: {
                diffusers_lora_file: {
                    url: 'https://v3b.fal.media/files/b/0ab04ec7/test_weights.safetensors',
                    content_type: 'application/x-safetensors',
                },
            },
        });
        mockStoragePut.mockResolvedValue(undefined);
        mockUpdateReturning.mockResolvedValue([
            {
                ...SAMPLE_AVATAR,
                status: 'TRAINED',
                trainingMetadata: {
                    ...SAMPLE_AVATAR.trainingMetadata,
                    loraFileUrl: `${SAMPLE_AVATAR.storageKey}/model.safetensors`,
                },
            },
        ]);

        const reconciled = await reconcileTrainingAvatar(SAMPLE_AVATAR);

        expect(mockFalQueueStatus).toHaveBeenCalledWith('fal-ai/flux-lora-portrait-trainer', {
            requestId: '01a186fe-32ca-7280-a4d1-a022b82db0d0',
        });
        expect(mockStoragePut).toHaveBeenCalledWith(
            'e4146bb7-5856-4caa-80a2-8e3c0462a5b5/avatars/production/54f8a6c4-ac9b-4b18-90e0-55ae1cbd8b3e/model.safetensors',
            expect.any(Buffer),
            'application/x-safetensors'
        );
        expect(mockUpdateSet).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'TRAINED',
                trainingMetadata: expect.objectContaining({
                    requestId: '01a186fe-32ca-7280-a4d1-a022b82db0d0',
                    loraFileUrl:
                        'e4146bb7-5856-4caa-80a2-8e3c0462a5b5/avatars/production/54f8a6c4-ac9b-4b18-90e0-55ae1cbd8b3e/model.safetensors',
                }),
            })
        );
        expect(reconciled.status).toBe('TRAINED');
    });

    it('does not update DB to TRAINED if R2 upload fails', async () => {
        const fakeBytes = new Uint8Array([1, 2, 3, 4]);
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                arrayBuffer: async () => fakeBytes.buffer,
            })
        );

        mockStoragePut.mockRejectedValue(new Error('R2 PutObject failed'));

        await expect(
            persistCompletedAvatarWeights({
                avatar: SAMPLE_AVATAR,
                requestId: '01a186fe-32ca-7280-a4d1-a022b82db0d0',
                loraUrl: 'https://v3b.fal.media/files/b/0ab04ec7/test_weights.safetensors',
                contentType: 'application/x-safetensors',
            })
        ).rejects.toThrow('R2 PutObject failed');

        expect(mockUpdateSet).not.toHaveBeenCalled();
    });

    it('leaves avatar in TRAINING state when FAL reports IN_PROGRESS or IN_QUEUE', async () => {
        mockFalQueueStatus.mockResolvedValue({ status: 'IN_PROGRESS' });

        const reconciled = await reconcileTrainingAvatar(SAMPLE_AVATAR);

        expect(reconciled.status).toBe('TRAINING');
        expect(mockFalQueueResult).not.toHaveBeenCalled();
        expect(mockStoragePut).not.toHaveBeenCalled();
        expect(mockUpdateSet).not.toHaveBeenCalled();
    });

    it('returns original avatars without calling FAL when none are in TRAINING status', async () => {
        const trainedAvatar: Avatar = { ...SAMPLE_AVATAR, status: 'TRAINED' };
        const result = await reconcileTrainingAvatars([trainedAvatar]);

        expect(result).toEqual([trainedAvatar]);
        expect(mockFalQueueStatus).not.toHaveBeenCalled();
    });

    it('deduplicates concurrent in-flight reconciliation calls for the same avatar', async () => {
        let resolveStatus!: (value: { status: string }) => void;
        mockFalQueueStatus.mockImplementation(
            () =>
                new Promise<{ status: string }>((resolve) => {
                    resolveStatus = resolve;
                })
        );

        const firstCall = reconcileTrainingAvatar(SAMPLE_AVATAR);
        const secondCall = reconcileTrainingAvatar(SAMPLE_AVATAR);

        resolveStatus({ status: 'IN_PROGRESS' });
        const [firstResult, secondResult] = await Promise.all([firstCall, secondCall]);

        expect(mockFalQueueStatus).toHaveBeenCalledTimes(1);
        expect(firstResult.status).toBe('TRAINING');
        expect(secondResult.status).toBe('TRAINING');
    });

    it('does not send duplicate completion email if another writer already marked the avatar TRAINED', async () => {
        const fakeBytes = new Uint8Array([1, 2, 3, 4]);
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                arrayBuffer: async () => fakeBytes.buffer,
            })
        );
        mockStoragePut.mockResolvedValue(undefined);
        // Simulate conditional UPDATE matching 0 rows because another process already set status = TRAINED
        mockUpdateReturning.mockResolvedValue([]);

        const result = await persistCompletedAvatarWeights({
            avatar: SAMPLE_AVATAR,
            requestId: '01a186fe-32ca-7280-a4d1-a022b82db0d0',
            loraUrl: 'https://v3b.fal.media/files/b/0ab04ec7/test_weights.safetensors',
            contentType: 'application/x-safetensors',
        });

        expect(result.status).toBe('TRAINED');
        expect(mockSendEmail).not.toHaveBeenCalled();
    });
});
