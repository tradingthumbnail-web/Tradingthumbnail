import { cropImageToSquare } from '../../server/utils/images';

const tinyPngB64Image = "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"

test('cropImageToSquare returns a buffer', async () => {
    const buf = await cropImageToSquare(tinyPngB64Image);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.byteLength).toBeGreaterThan(0);
});