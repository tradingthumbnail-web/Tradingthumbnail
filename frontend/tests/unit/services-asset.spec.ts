import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveAssetToDB } from '../../server/services/asset';

vi.mock('../../server/database', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(async () => [{ id: 'asset1', name: 'file' }]),
  },
}));

vi.mock('../../server/database/schemas/assets.schema', () => ({
  assetTable: {},
}));

describe('services/asset.saveAssetToDB', () => {
  beforeEach(() => vi.clearAllMocks());

  it('inserts and returns asset', async () => {
    const asset = await saveAssetToDB({ userId: 'u', name: 'n', type: 'IMAGE' as any, storageKey: 'k' });
    expect(asset).toBeDefined();
  });
});