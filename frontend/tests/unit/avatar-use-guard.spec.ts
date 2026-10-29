// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AvatarCard from '~~/app/components/Avatars/AvatarCard.vue';
import AvatarSelector from '~~/app/components/Base/AvatarSelector.vue';

Object.assign(globalThis, {
    useI18n: () => ({
        t: (key: string) => key,
    }),
});

const mockFindFirstAvatar = vi.fn();
const mockRunChargedWork = vi.fn(async (_userId: string, _cost: number, work: () => Promise<unknown>) => work());
const mockGeneratePresignedUrl = vi.fn();

vi.mock('~~/server/database', () => ({
    db: {
        query: {
            avatarTable: {
                findFirst: (...args: unknown[]) => mockFindFirstAvatar(...args),
            },
        },
    },
}));

vi.mock('~~/server/services/user/credits', () => ({
    runChargedWork: (...args: [string, number, () => Promise<unknown>]) => mockRunChargedWork(...args),
}));

vi.mock('~~/server/storage', () => ({
    storage: {
        generatePresignedUrl: (...args: unknown[]) => mockGeneratePresignedUrl(...args),
        put: vi.fn(),
    },
}));

vi.mock('~~/server/services/fal/generate-photoshoot', () => ({
    generatePhotoshootImages: vi.fn(),
    FLUX_KONTEXT_LORA_PARAMS: {},
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

Object.assign(globalThis, {
    defineEventHandler: (fn: unknown) => fn,
    readBody: vi.fn(),
    createError: (opts: { statusCode: number; statusMessage: string }) => {
        const err = new Error(opts.statusMessage);
        (err as any).statusCode = opts.statusCode;
        (err as any).statusMessage = opts.statusMessage;
        return err;
    },
});

describe('AvatarCard and AvatarSelector UI guards', () => {
    const trainingAvatar = {
        id: '54f8a6c4-ac9b-4b18-90e0-55ae1cbd8b3e',
        userId: 'e4146bb7-5856-4caa-80a2-8e3c0462a5b5',
        name: 'Khanwaiz',
        status: 'TRAINING',
        gender: 'MALE',
        createdAt: '2026-10-29T09:29:28.669Z',
        trainingMetadata: { trainingSteps: 2000 },
    };

    const trainedAvatar = {
        ...trainingAvatar,
        id: '11111111-2222-3333-4444-555555555555',
        status: 'TRAINED',
    };

    it('disables the Use buttons and does not emit use when avatar is TRAINING or FAILED', async () => {
        const wrapper = mount(AvatarCard, {
            props: {
                avatar: trainingAvatar,
            },
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
                stubs: {
                    BaseKiThumbsImage: true,
                    Icon: true,
                },
            },
        });

        const useButtons = wrapper.findAll('button').filter((btn) => btn.text().includes('avatars.use'));
        expect(useButtons.length).toBeGreaterThanOrEqual(2);
        for (const btn of useButtons) {
            expect(btn.attributes('disabled')).toBeDefined();
            await btn.trigger('click');
        }
        expect(wrapper.emitted('use')).toBeUndefined();
    });

    it('enables the Use buttons and emits use when avatar is TRAINED', async () => {
        const wrapper = mount(AvatarCard, {
            props: {
                avatar: trainedAvatar,
            },
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
                stubs: {
                    BaseKiThumbsImage: true,
                    Icon: true,
                },
            },
        });

        const useButtons = wrapper.findAll('button').filter((btn) => btn.text().includes('avatars.use'));
        expect(useButtons.length).toBeGreaterThanOrEqual(2);
        expect(useButtons[1].attributes('disabled')).toBeUndefined();
        await useButtons[1].trigger('click');
        expect(wrapper.emitted('use')?.[0]).toEqual([trainedAvatar]);
    });

    it('marks non-TRAINED options as disabled in AvatarSelector', () => {
        const wrapper = mount(AvatarSelector, {
            props: {
                avatars: [trainingAvatar, trainedAvatar],
                avatarId: null,
            },
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
                stubs: {
                    BaseKiThumbsImage: true,
                    Icon: true,
                },
            },
        });

        const options = wrapper.findAll('option');
        const trainingOption = options.find((opt) => opt.attributes('value') === trainingAvatar.id);
        const trainedOption = options.find((opt) => opt.attributes('value') === trainedAvatar.id);

        expect(trainingOption?.attributes('disabled')).toBeDefined();
        expect(trainedOption?.attributes('disabled')).toBeUndefined();
    });
});

describe('Photoshoot API trained avatar guard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects Photoshoot generation with HTTP 400 when avatar status is not TRAINED', async () => {
        const photoshootHandler = (await import('~~/server/api/v1/generation/photoshoot.post')).default as any;
        (globalThis as any).readBody = vi.fn().mockResolvedValue({
            avatarId: '54f8a6c4-ac9b-4b18-90e0-55ae1cbd8b3e',
            description: 'Sitting at desk',
            expression: 'Neutral',
            cameraAngle: 'Frontal',
            background: 'none',
            variations: 1,
        });

        mockFindFirstAvatar.mockResolvedValue({
            id: '54f8a6c4-ac9b-4b18-90e0-55ae1cbd8b3e',
            userId: 'e4146bb7-5856-4caa-80a2-8e3c0462a5b5',
            status: 'TRAINING',
            storageKey: 'e4146bb7-5856-4caa-80a2-8e3c0462a5b5/avatars/production/54f8a6c4-ac9b-4b18-90e0-55ae1cbd8b3e',
            gender: 'MALE',
        });

        await expect(
            photoshootHandler({
                context: {
                    user: { id: 'e4146bb7-5856-4caa-80a2-8e3c0462a5b5' },
                },
            })
        ).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Avatar training is not complete',
        });

        expect(mockRunChargedWork).not.toHaveBeenCalled();
        expect(mockGeneratePresignedUrl).not.toHaveBeenCalled();
    });
});
