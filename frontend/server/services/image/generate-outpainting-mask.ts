import sharp from 'sharp';

interface GenerateOutpaintingMaskParams {
    dimensions: { width: number; height: number; };
    position: { x: number; y: number; };
    scale: number;
    image: { width: number; height: number; };
}

/**
 * Generates an outpainting mask based on the canvas data URL, dimensions, position, and scale
 * @param params - The parameters for the outpainting mask
 * @param params.dimensions - The dimensions of the canvas
 * @param params.dimensions.width - The width of the canvas
 * @param params.dimensions.height - The height of the canvas
 *
 * @param params.position - The position of the image on the canvas
 * @param params.position.x - The x position of the image on the canvas
 * @param params.position.y - The y position of the image on the canvas
 *
 * @param params.scale - The scale of the image on the canvas
 *
 * @param params.image - The image to generate the mask for
 * @param params.image.width - The width of the image
 * @param params.image.height - The height of the image
 *
 * @returns The buffer of the outpainting mask
 */
export const generateOutpaintingMask = async (params: GenerateOutpaintingMaskParams) => {
    const { dimensions, position, scale, image } = params;

    const canvasWidth = Math.max(1, Math.round(dimensions.width));
    const canvasHeight = Math.max(1, Math.round(dimensions.height));

    // Base mask: white background, single channel (grayscale)
    const base = sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
    } as any);

    // Compute scaled image size on canvas (Fabric origin is center)
    const scaledWidth = Math.max(0, Math.round(image.width * scale));
    const scaledHeight = Math.max(0, Math.round(image.height * scale));

    // Add offset to make the black area slightly smaller than the actual image
    // This prevents hard edges in the outpainting result
    const offset = Math.max(2, Math.round(Math.min(scaledWidth, scaledHeight) * 0.02)); // 2% of the smaller dimension, minimum 2px

    // Top-left coordinates of the image on canvas with offset applied
    const rectLeft = Math.round(position.x - scaledWidth / 2 + offset);
    const rectTop = Math.round(position.y - scaledHeight / 2 + offset);

    // Adjust dimensions to account for offset on both sides
    const adjustedWidth = Math.max(0, scaledWidth - (offset * 2));
    const adjustedHeight = Math.max(0, scaledHeight - (offset * 2));

    // Clip rectangle to canvas bounds
    const destLeft = Math.min(canvasWidth, Math.max(0, rectLeft));
    const destTop = Math.min(canvasHeight, Math.max(0, rectTop));
    const destRight = Math.min(canvasWidth, Math.max(0, rectLeft + adjustedWidth));
    const destBottom = Math.min(canvasHeight, Math.max(0, rectTop + adjustedHeight));

    const destWidth = Math.max(0, destRight - destLeft);
    const destHeight = Math.max(0, destBottom - destTop);

    // If the image is completely outside the canvas, return an all-white mask
    if (destWidth === 0 || destHeight === 0) {
        return await base.png().toBuffer();
    }

    // Black rectangle patch matching the visible portion of the image on canvas (with offset)
    const blackPatch = await sharp({
        create: {
            width: destWidth,
            height: destHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 },
        },
    } as any).png().toBuffer();

    // Composite the black rectangle onto the white base at the clipped position
    const mask = await base
        .composite([{ input: blackPatch, left: destLeft, top: destTop }])
        .greyscale()
        .png()
        .toBuffer();

    return mask;
};