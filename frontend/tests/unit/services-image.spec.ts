import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../server/database', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(async () => [{ id: 'img1', storageKey: 's/key' }]),
  },
}));

vi.mock('../../server/database/schemas/image.schema', () => ({
  imageTable: {},
  ImageState: { READY: 'READY' },
}));

import { saveImageToDB } from '~~/server/services/image.service';

describe('services/image.saveImageToDB', () => {
  beforeEach(() => vi.clearAllMocks());

  it('inserts and returns image', async () => {
    const img = await saveImageToDB({
      imageId: 'img1',
      userId: 'user1',
      storageKey: 's/key',
      type: 'THUMBNAIL' as any,
      state: 'READY' as any,
      isPublic: false,
      imageMetadata: { w: 1, h: 1 },
    });
    expect(img?.id).toBe('img1');
  });
});