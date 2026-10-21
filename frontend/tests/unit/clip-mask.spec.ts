import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sharp', () => {
  const sharp = (input?: any) => ({
    resize: vi.fn().mockReturnThis(),
    greyscale: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    composite: vi.fn().mockReturnThis(),
    toBuffer: vi.fn(async () => Buffer.from('ok')),
  });
  sharp.kernel = { nearest: 'nearest' } as any;
  return { default: sharp };
});

import { convertPathToMask, generateMaskFromRectanglePosition } from '../../server/utils/clip-mask';

const base64Dummy = Buffer.from('dummy').toString('base64');

describe('utils/clip-mask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('convertPathToMask returns a buffer', async () => {
    const buf = await convertPathToMask(base64Dummy, 64, 64);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('generateMaskFromRectanglePosition returns a buffer', async () => {
    const buf = await generateMaskFromRectanglePosition({
      position: { x: 10, y: 5 },
      rectangleDimensions: { width: 20, height: 10 },
      canvasDimensions: { width: 100, height: 50 },
      background: 'white',
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
  });
});