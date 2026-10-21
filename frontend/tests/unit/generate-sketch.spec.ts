import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateOpenRouterImage = vi.fn();

vi.mock('~~/server/inference/openrouter', () => ({
    inferenceClient: {},
    OPENROUTER_SKETCH_IMAGE_MODEL: 'openai/gpt-image-2',
    generateOpenRouterImage: (...args: unknown[]) => mockGenerateOpenRouterImage(...args),
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
    });
});
