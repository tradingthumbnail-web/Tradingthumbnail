import sharp from 'sharp';

/**
 * Converts a base64 string of a path to a buffer of a mask using sharp
 * @param path - The base64 string of the path
 * @param width - The width of the mask
 * @param height - The height of the mask
 */
export const convertPathToMask = async (path: string, width: number, height: number) => {
    try {
        const buffer = Buffer.from(path, 'base64');
        console.log(" |- Processing image with Sharp to target dimensions");
        let processedMask = await sharp(buffer)
            .resize(width, height, {
                fit: 'fill',
                kernel: sharp.kernel.nearest,
            })
            .greyscale()
            .png()
            .toBuffer();

        return processedMask;
    } catch (error) {
        console.error("-x- Error converting path to mask", error);
        throw error;
    }
};

interface GenerateMaskFromRectanglePositionParams {
    position: { x: number; y: number; };
    rectangleDimensions: { width: number; height: number; };
    canvasDimensions: { width: number; height: number; };
    background: 'white' | 'black';
}

/**
 * Generate a black or white mask from a rectangle width, height and position in a general canvas, in a white or black background
 * @param params - The parameters for the mask
 * @param params.position - The position of the rectangle
 * @param params.position.x - The x position of the rectangle
 * @param params.position.y - The y position of the rectangle
 * @param params.rectangleDimensions - The dimensions of the rectangle
 * @param params.rectangleDimensions.width - The width of the rectangle
 * @param params.rectangleDimensions.height - The height of the rectangle
 * @param params.canvasDimensions - The dimensions of the canvas
 * @param params.canvasDimensions.width - The width of the canvas
 * @param params.canvasDimensions.height - The height of the canvas
 * @param params.background - The background of the mask
 * @returns The Buffer<ArrayBuffer> of the mask
 */
export const generateMaskFromRectanglePosition = async (params: GenerateMaskFromRectanglePositionParams) => {
    try {
        const { position, rectangleDimensions, canvasDimensions, background } = params;
        const { width, height } = rectangleDimensions;
        const { width: canvasWidth, height: canvasHeight } = canvasDimensions;
        const { x, y } = position;
        
        // Create the base canvas with the background color
        const backgroundImage = await sharp({
            create: {
                width: canvasWidth,
                height: canvasHeight,
                channels: 3,
                background: { r: background === 'white' ? 255 : 0, g: background === 'white' ? 255 : 0, b: background === 'white' ? 255 : 0 },
            },
        }).png().toBuffer();

        // Create the rectangle overlay with the opposite color
        const rectangleColor = background === 'white' ? 0 : 255;
        const rectangleOverlay = await sharp({
            create: {
                width: width,
                height: height,
                channels: 3,
                background: { r: rectangleColor, g: rectangleColor, b: rectangleColor },
            },
        }).png().toBuffer();

        // Composite the rectangle onto the background at the specified position
        const mask = await sharp(backgroundImage)
            .composite([{
                input: rectangleOverlay,
                top: y,
                left: x,
            }])
            .png()
            .toBuffer();

        return mask;
    } catch (error) {
        console.error("-x- Error generating mask from rectangle position", error);
        throw error;
    }
};