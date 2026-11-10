import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateOpenRouterImage = vi.fn();
const mockIsOpenAIConfigured = vi.fn(() => false);
const mockOpenAIImagesEdit = vi.fn();
const mockGetOpenAIClient = vi.fn(() => ({
    images: {
        edit: (...args: unknown[]) => mockOpenAIImagesEdit(...args),
    },
}));
const mockIsFalConfigured = vi.fn(() => false);
const mockFalSubscribe = vi.fn();

vi.stubGlobal('createError', (opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    Object.assign(err, opts);
    return err;
});

vi.mock('~~/server/inference/openrouter', () => ({
    inferenceClient: {},
    OPENROUTER_SKETCH_IMAGE_MODEL: 'openai/gpt-image-2',
    generateOpenRouterImage: (...args: unknown[]) => mockGenerateOpenRouterImage(...args),
}));

vi.mock('~~/server/inference/openai', () => ({
    isOpenAIConfigured: () => mockIsOpenAIConfigured(),
    getOpenAIClient: () => mockGetOpenAIClient(),
}));

vi.mock('~~/server/inference/fal', () => ({
    default: {
        subscribe: (...args: unknown[]) => mockFalSubscribe(...args),
    },
    isFalConfigured: () => mockIsFalConfigured(),
}));

vi.mock('sharp', () => {
    const chain = {
        rotate: vi.fn().mockReturnThis(),
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('jpeg-bytes')),
    };
    return {
        default: vi.fn(() => chain),
    };
});

import { generateSketch, SKETCH_PROMPT } from '~~/server/services/openai/generate-sketch';
import { OPENROUTER_SKETCH_IMAGE_MODEL } from '~~/server/inference/openrouter';

describe('generateSketch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsOpenAIConfigured.mockReturnValue(false);
        mockIsFalConfigured.mockReturnValue(false);
        mockGenerateOpenRouterImage.mockResolvedValue(Buffer.from('generated-png'));
    });

    it('sends the canvas as the first OpenRouter input reference', async () => {
        const result = await generateSketch({
            canvasDataURL: 'data:image/jpeg;base64,Y2FudmFz',
            layoutMetadata: [],
            referenceType: 'image',
            avatarId: '',
        });

        expect(result).toEqual(Buffer.from('generated-png'));
        expect(mockGenerateOpenRouterImage).toHaveBeenCalledWith(expect.objectContaining({
            model: OPENROUTER_SKETCH_IMAGE_MODEL,
            aspectRatio: '3:2',
            quality: 'medium',
            outputFormat: 'png',
            prompt: expect.stringContaining('YOUTUBE THUMBNAIL COMPOSITOR'),
        }));

        const call = mockGenerateOpenRouterImage.mock.calls[0][0];
        expect(call.inputReferences).toHaveLength(1);
        expect(call.inputReferences[0]).toMatch(/^data:image\/jpeg;base64,/);
        expect(call.prompt).toContain(SKETCH_PROMPT.slice(0, 40));
    });

    it('appends a face reference as the second input image', async () => {
        await generateSketch({
            canvasDataURL: 'data:image/jpeg;base64,Y2FudmFz',
            layoutMetadata: [
                { role: 'TEXT', left: 10, top: 20, content: 'HELLO', width: 100, height: 40 },
                { role: 'PERSON_PLACEHOLDER', left: 100, top: 80, width: 200, height: 200 },
            ],
            referenceType: 'image',
            avatarId: '',
            referenceImageBase64: 'cmVmZXJlbmNl',
            styleParams: { mood: 'cinematic' },
        });

        const call = mockGenerateOpenRouterImage.mock.calls[0][0];
        expect(call.inputReferences).toHaveLength(2);
        expect(call.prompt).toContain('RENDER TEXT: "HELLO"');
        expect(call.prompt).toContain('SUBJECT POSITION');
        expect(call.prompt).toContain('cinematic');
    });

    it('does not import or call the direct OpenAI client', async () => {
        await generateSketch({
            canvasDataURL: 'data:image/png;base64,Y2FudmFz',
            referenceType: 'image',
            avatarId: '',
        });

        expect(mockGenerateOpenRouterImage).toHaveBeenCalledTimes(1);
        expect(mockGetOpenAIClient).not.toHaveBeenCalled();
    });

    it('returns 400 when canvasDataURL is empty', async () => {
        await expect(generateSketch({
            canvasDataURL: '   ',
            referenceType: 'image',
            avatarId: '',
        })).rejects.toMatchObject({
            statusCode: 400,
            message: 'Canvas is required',
        });
        expect(mockGenerateOpenRouterImage).not.toHaveBeenCalled();
    });

    it('falls back to OpenAI images.edit when OpenRouter fails with 402/500 and OpenAI is configured', async () => {
        mockGenerateOpenRouterImage.mockRejectedValueOnce(
            Object.assign(new Error('Image generation failed'), { statusCode: 500, providerStatus: 402 }),
        );
        mockIsOpenAIConfigured.mockReturnValue(true);
        mockOpenAIImagesEdit.mockResolvedValueOnce({
            data: [{ b64_json: Buffer.from('openai-fallback-png').toString('base64') }],
        });

        const result = await generateSketch({
            canvasDataURL: 'data:image/jpeg;base64,Y2FudmFz',
            referenceType: 'image',
            avatarId: '',
            referenceImageBase64: 'cmVmZXJlbmNl',
        });

        expect(mockGenerateOpenRouterImage).toHaveBeenCalledTimes(1);
        expect(mockOpenAIImagesEdit).toHaveBeenCalledTimes(1);
        expect(result).toEqual(Buffer.from('openai-fallback-png'));
    });

    it('falls back to FAL when OpenRouter and OpenAI fail and FAL is configured', async () => {
        mockGenerateOpenRouterImage.mockRejectedValueOnce(
            Object.assign(new Error('Image generation failed'), { statusCode: 500, providerStatus: 402 }),
        );
        mockIsOpenAIConfigured.mockReturnValue(false);
        mockIsFalConfigured.mockReturnValue(true);
        mockFalSubscribe.mockResolvedValueOnce({
            data: {
                images: [{ url: 'https://fal.media/generated-sketch.png' }],
            },
        });
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            arrayBuffer: async () => Buffer.from('fal-fallback-png'),
        })) as any);

        const result = await generateSketch({
            canvasDataURL: 'data:image/jpeg;base64,Y2FudmFz',
            referenceType: 'image',
            avatarId: '',
        });

        expect(mockGenerateOpenRouterImage).toHaveBeenCalledTimes(1);
        expect(mockFalSubscribe).toHaveBeenCalledWith(
            'openai/gpt-image-2/edit',
            expect.objectContaining({
                input: expect.objectContaining({
                    image_urls: [expect.stringMatching(/^data:image\/jpeg;base64,/)],
                }),
            }),
        );
        expect(result).toEqual(Buffer.from('fal-fallback-png'));
    });
});
