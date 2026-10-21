export async function colorCorrection(image: Buffer) {
    try {
        const SCALING_FACTOR_RED = 0.9805;
        const SCALING_FACTOR_GREEN = 1.005;
        const SCALING_FACTOR_BLUE = 1.075;

        const sharp = await import('sharp');
        const img = sharp.default(image);

        const correctedImage = await img
            .linear(
                [SCALING_FACTOR_RED, SCALING_FACTOR_GREEN, SCALING_FACTOR_BLUE],
                [0, 0, 0]
            )
            .toBuffer();

        console.log(' |- Image color corrected successfully');
        return correctedImage;
    } catch (error) {
        console.error('Error in color correction:', error);
        throw new Error('Failed to process image color correction');
    }
}