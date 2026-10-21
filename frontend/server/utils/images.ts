import Sharp from 'sharp';

const MAX_INPUT_DIMENSION = 8192;
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

export const cropImageToSquareBuffer = async (buffer: Buffer): Promise<Buffer> => {
    if (buffer.length > MAX_INPUT_BYTES) {
        throw new Error('Image file too large');
    }

    const image = Sharp(buffer, { limitInputPixels: MAX_INPUT_DIMENSION * MAX_INPUT_DIMENSION });

    const rotatedImage = image.rotate();

    const metadata = await rotatedImage.metadata();
    if (!metadata.width || !metadata.height || metadata.width > MAX_INPUT_DIMENSION || metadata.height > MAX_INPUT_DIMENSION) {
        throw new Error('Image dimensions exceed maximum allowed');
    }

    const size = Math.min(metadata.width, metadata.height);

    return rotatedImage.resize(
        size,
        size,
        {
            fit: 'cover',
            position: Sharp.strategy.attention,
        }
    ).toBuffer();
}

export const cropImageToSquare = async (imageString: string): Promise<Buffer> => {
    return cropImageToSquareBuffer(Buffer.from(imageString, 'base64'));
}