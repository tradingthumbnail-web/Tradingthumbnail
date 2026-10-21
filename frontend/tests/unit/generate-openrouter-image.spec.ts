import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubGlobal('useRuntimeConfig', () => ({
    openRouterApiKey: 'test-openrouter-key',
    openRouterBaseURL: 'https://openrouter.ai/api/v1',
    public: { appUrl: 'https://app.kithumbs.com' },
}));

vi.stubGlobal('createError', (opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage);
    Object.assign(err, opts);
    return err;
});

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('generateOpenRouterImage', () => {
    beforeEach(() => {
        vi.resetModules();
        fetchMock.mockReset();
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [{ b64_json: Buffer.from('png-bytes').toString('base64'), media_type: 'image/png' }],
            }),
        });
    });

    it('does not throw on import when the API key is missing', async () => {
        vi.stubGlobal('useRuntimeConfig', () => ({
            openRouterApiKey: '',
            openRouterBaseURL: 'https://openrouter.ai/api/v1',
            public: { appUrl: 'https://app.kithumbs.com' },
        }));

        await expect(import('~~/server/inference/openrouter')).resolves.toBeDefined();
    });

    it('returns 503 when generating without an API key', async () => {
        vi.stubGlobal('useRuntimeConfig', () => ({
            openRouterApiKey: '',
            openRouterBaseURL: 'https://openrouter.ai/api/v1',
            public: { appUrl: 'https://app.kithumbs.com' },
        }));

        const { generateOpenRouterImage, OPENROUTER_SKETCH_IMAGE_MODEL } = await import('~~/server/inference/openrouter');

        await expect(generateOpenRouterImage({
            model: OPENROUTER_SKETCH_IMAGE_MODEL,
            prompt: 'test',
        })).rejects.toMatchObject({
            statusCode: 503,
            message: 'OpenRouter API key is not configured',
        });
    });

    it('posts to OpenRouter /images with input_references data URLs', async () => {
        vi.stubGlobal('useRuntimeConfig', () => ({
            openRouterApiKey: 'test-openrouter-key',
            openRouterBaseURL: 'https://openrouter.ai/api/v1',
            public: { appUrl: 'https://app.kithumbs.com' },
        }));

        const { generateOpenRouterImage, OPENROUTER_SKETCH_IMAGE_MODEL } = await import('~~/server/inference/openrouter');

        const result = await generateOpenRouterImage({
            model: OPENROUTER_SKETCH_IMAGE_MODEL,
            prompt: 'compose a thumbnail',
            inputReferences: ['data:image/jpeg;base64,Y2FudmFz', 'data:image/jpeg;base64,cmVm'],
            aspectRatio: '3:2',
            quality: 'medium',
            outputFormat: 'png',
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('https://openrouter.ai/api/v1/images');
        expect(options.method).toBe('POST');
        expect(options.headers.Authorization).toBe('Bearer test-openrouter-key');

        const body = JSON.parse(options.body);
        expect(body.model).toBe('openai/gpt-image-2');
        expect(body.aspect_ratio).toBe('3:2');
        expect(body.quality).toBe('medium');
        expect(body.output_format).toBe('png');
        expect(body.input_references).toEqual([
            { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,Y2FudmFz' } },
            { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,cmVm' } },
        ]);
        expect(result).toEqual(Buffer.from('png-bytes'));
    });

    it('throws a 500 when OpenRouter returns no image', async () => {
        vi.stubGlobal('useRuntimeConfig', () => ({
            openRouterApiKey: 'test-openrouter-key',
            openRouterBaseURL: 'https://openrouter.ai/api/v1',
            public: { appUrl: 'https://app.kithumbs.com' },
        }));

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ data: [] }),
        });

        const { generateOpenRouterImage, OPENROUTER_SKETCH_IMAGE_MODEL } = await import('~~/server/inference/openrouter');

        await expect(generateOpenRouterImage({
            model: OPENROUTER_SKETCH_IMAGE_MODEL,
            prompt: 'compose a thumbnail',
        })).rejects.toMatchObject({
            statusCode: 500,
            message: 'Image generation failed',
        });
    });
});
