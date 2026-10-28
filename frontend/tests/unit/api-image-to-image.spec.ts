import { beforeEach, describe, expect, it, vi } from 'vitest';

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
}));

vi.mock('~~/server/database', () => ({
  db: {
    query: {
      avatarTable: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('~~/server/storage', () => ({
  storage: {
    generatePresignedUrl: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('~~/server/services/image/img-to-image-base-description', () => ({
  generateImageDescriptionForImageToImage: vi.fn(),
}));

vi.mock('~~/server/services/image/generate-thumb-from-image-to-image-description', () => ({
  generateThumbPromptFromImageToImage: vi.fn(),
}));

vi.mock('~~/server/services/fal/generate-image-to-image', () => ({
  generateImageToImage: vi.fn(),
  FLUX_IMAGE_TO_IMAGE_PARAMS: { model: 'fal-ai/flux-lora/image-to-image' },
}));

vi.mock('~~/server/services/image.service', () => ({
  saveImageToDB: vi.fn(),
}));

vi.mock('~~/server/services/activity/save-activity', () => ({
  saveActivity: vi.fn(),
}));

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => 'image-123'),
}));

import { db } from '~~/server/database';
import { storage } from '~~/server/storage';
import { generateImageDescriptionForImageToImage } from '~~/server/services/image/img-to-image-base-description';
import { generateThumbPromptFromImageToImage } from '~~/server/services/image/generate-thumb-from-image-to-image-description';
import { generateImageToImage } from '~~/server/services/fal/generate-image-to-image';
import { saveImageToDB } from '~~/server/services/image.service';

describe('API: /api/v1/generation/image-to-image.post', () => {
  const mockUser = { id: 'user-1' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRunChargedWork.mockImplementation(async (_userId, _amount, work) => work());
    mockReadBody.mockResolvedValue({
      avatarId: 'avatar-1',
      keepBackground: true,
      matchLighting: true,
      referenceImageBase64: Buffer.from('reference').toString('base64'),
      creativityLevel: 2,
    });

    vi.mocked(db.query.avatarTable.findFirst).mockResolvedValue({ id: 'avatar-1', userId: 'user-1' } as any);
    vi.mocked(storage.generatePresignedUrl)
      .mockResolvedValueOnce('https://weights.example')
      .mockResolvedValueOnce('https://reference.example')
      .mockResolvedValueOnce('https://saved-image.example');
    vi.mocked(storage.put).mockResolvedValue();
    vi.mocked(generateImageDescriptionForImageToImage).mockResolvedValue('description');
    vi.mocked(generateThumbPromptFromImageToImage).mockResolvedValue('prompt');
    vi.mocked(generateImageToImage).mockResolvedValue(['https://generated-image.example/file.png']);
    vi.mocked(saveImageToDB).mockResolvedValue({ id: 'image-123', type: 'CHARACTER' } as any);

    vi.stubGlobal('fetch', vi.fn(async () => ({
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    })) as any);
  });

  it('returns 401 when unauthenticated', async () => {
    const handler = (await import('~~/server/api/v1/generation/image-to-image.post')).default;
    await expect(handler({ context: {} } as any)).rejects.toMatchObject({
      message: 'Unauthorized',
      statusCode: 401,
    });
  });

  it('returns 400 when required payload values are missing', async () => {
    mockReadBody.mockResolvedValue({
      avatarId: 'avatar-1',
      keepBackground: true,
      matchLighting: true,
      referenceImageBase64: null,
      creativityLevel: 2,
    });
    const handler = (await import('~~/server/api/v1/generation/image-to-image.post')).default;
    await expect(handler({ context: { user: mockUser } } as any)).rejects.toMatchObject({
      message: 'Bad Request',
      statusCode: 400,
    });
  });

  it('generates and stores a transformed image with mocked providers', async () => {
    const handler = (await import('~~/server/api/v1/generation/image-to-image.post')).default;
    const result = await handler({ context: { user: mockUser } } as any);

    expect(mockRunChargedWork).toHaveBeenCalled();
    expect(generateImageDescriptionForImageToImage).toHaveBeenCalledWith('https://reference.example');
    expect(generateThumbPromptFromImageToImage).toHaveBeenCalledWith('https://reference.example', 'description');
    expect(generateImageToImage).toHaveBeenCalledWith(expect.objectContaining({
      model: 'fal-ai/flux-lora/image-to-image',
      loraPresignedUrl: 'https://weights.example',
      referenceImageURL: 'https://reference.example',
    }));
    expect(saveImageToDB).toHaveBeenCalled();
    expect(result).toMatchObject({
      generatedImage: { id: 'image-123', type: 'CHARACTER' },
      newImageUrl: 'https://saved-image.example',
    });
  });
});
