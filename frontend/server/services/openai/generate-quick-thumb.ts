import { ModelName } from "~~/server/constants/models-db";
import { openai } from "~~/server/inference/openai";

const normalizeBase64 = (base64String: string): string => {
    return base64String.replace(/^data:image\/\w+;base64,/, '');
};

export const SKETCH_PROMPT = `
Goal: Polished YouTube thumbnail, horizontal 3:2 (1536×1024), ready for publishing.

Multi-image inputs:
- Image 1 (wireframe): Layout reference for composition, placement, and scene structure. Use gray blocks and layout elements to understand spatial arrangement and scene composition.
- Character reference images (if present): Face/identity references for characters in the thumbnail. Use ONLY for facial identity (features, proportions, skin tone). Ignore pose, clothing, lighting, background from these images.
- Reference image (if present): A previously generated thumbnail to use as a style and composition reference. If provided, replicate its overall aesthetic, lighting, color palette, and visual style as closely as possible while only changing the configurable elements specified in the prompt.

Reading Image 1 blocks (CRITICAL):
- YELLOW background (#fde68a) = CONFIGURABLE/DYNAMIC thumbnail text to render. Render this text with bold, impactful typography that matches the overall thumbnail aesthetic. Make it legible and with a good visual hierarchy based on the thumbnail and the text itself. Make it impactful.
- GRAY background (#cccccc) = STATIC/FIXED thumbnail text to render. This text is permanent and should be rendered with BOLD, eye-catching, dramatic typography. Use 3D effects, strong drop shadows, vibrant contrasting colors, thick outlines, gradient fills, or metallic/glossy effects. Make it POP and stand out dramatically - this is key branding text that should be memorable and impactful.
- Avatar/Person placeholder (SVG icon): Indicates where a character should be positioned. Place the character matching the corresponding face reference at this exact location, matching the scale and position indicated.

Background/Scene:
- Base the background on the information provided in the scene description, the title and the thumbnail style.
- Derive the overall structure from the wireframe, making sure it will match the final layout of the thumbnail.
- Photorealistic rendering with cinematic quality.
- Create a compelling background that matches the background type and enhances the overall thumbnail.
- Make it engaging and interesting, with a good visual hierarchy.

Subject:
- Position subjects per Image 1 layout geometry, placing them in the exact position indicated by the person icons in the wireframe.
- Apply the corresponding face reference identity to each character at their placeholder location.
- Match placement, scale, and hierarchy from wireframe exactly.
- Follow any additional instructions provided for each character (expression, pose, emotion, etc.).

Composition:
- Horizontal framing, eye-catching thumbnail composition
- Natural depth, cinematic lighting, shallow depth-of-field feel
- High visual contrast to draw attention
- Use layout guides to create balanced, professional composition

Text rendering:
- Render ALL text blocks from the wireframe (both yellow and gray) as bold thumbnail typography.
- GRAY text should be MORE dramatic and eye-catching than yellow text - use 3D effects, strong shadows, vibrant colors.
- YELLOW text should be bold and legible but can be slightly more subtle than gray text.
- Make all text highly legible with strong contrast against background.
- Use appealing typography styles (bold, modern, eye-catching) that match the thumbnail's overall aesthetic.
- Apply visual effects like drop shadows, outlines, gradients, or glows for maximum impact.
- Integrate text naturally with scene lighting, colors, and composition.
- Ensure text is positioned exactly where the blocks indicate in the wireframe.

Constraints (preserve/exclude):
- Preserve: layout geometry from Image 1, all text blocks (render as styled text), facial identity from character references.
- Layout placeholders.
- No text beyond the defined text blocks.
`;

export interface CharacterImage {
    base64: string;
    label?: string;
    instructions?: string;
}

interface GenerateQuickThumbImageWithOpenAIParams {
    canvasDataURL: string;
    thumbDescriptionPrompt: string;
    avatarImage?: string;
    referenceImage?: string;
    characterImages?: CharacterImage[];
}

/**
 * Generates a sketch with OpenAI
 * @param params - The parameters for the sketch
 * @param model 
 */
export const generateQuickThumbImageWithOpenAI = async (params: GenerateQuickThumbImageWithOpenAIParams, model: ModelName = "gpt-image-1.5") => {
    try {
        console.log(" |– Generating quick thumb image with OpenAI...")
        
        const base64Data = normalizeBase64(params.canvasDataURL);
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Create a File object from the buffer for OpenAI
        let uploadableFiles: File[] = [];
        const file = new File([imageBuffer], 'canvas.png', { type: 'image/png' });
        uploadableFiles.push(file);

        if (params.avatarImage) {
            const normalizedAvatarBase64 = normalizeBase64(params.avatarImage);
            const avatarImageBuffer = Buffer.from(normalizedAvatarBase64, 'base64');
            const avatarImageFile = new File([avatarImageBuffer], 'avatar.png', { type: 'image/png' });
            uploadableFiles.push(avatarImageFile);
        }

        if (params.characterImages && params.characterImages.length > 0) {
            for (let i = 0; i < params.characterImages.length; i++) {
                const charImg = params.characterImages[i];
                const normalizedCharBase64 = normalizeBase64(charImg.base64);
                const charImageBuffer = Buffer.from(normalizedCharBase64, 'base64');
                const charImageFile = new File([charImageBuffer], `character-${i + 1}.png`, { type: 'image/png' });
                uploadableFiles.push(charImageFile);
            }
        }

        if (params.referenceImage) {
            const normalizedReferenceBase64 = normalizeBase64(params.referenceImage);
            const referenceImageBuffer = Buffer.from(normalizedReferenceBase64, 'base64');
            const referenceImageFile = new File([referenceImageBuffer], 'reference.png', { type: 'image/png' });
            uploadableFiles.push(referenceImageFile);
        }

        const response = await openai.images.edit({
            model: model,
            image: uploadableFiles,
            prompt: `${SKETCH_PROMPT}\n\n${params.thumbDescriptionPrompt}`,
            size: "1536x1024",
            quality: "medium",
            input_fidelity: "high",
        })

        if (!response.data || response.data.length === 0) {
            console.error('-x- No data returned from OpenAI API for quick thumb image');
            return null;
        }

        const base64Image = response.data[0].b64_json;
        if (!base64Image) {
            console.error('-x- No image data returned from OpenAI API for quick thumb image');
            return null;
        }

        const resultBuffer = Buffer.from(base64Image, 'base64');
        console.log(' |- Quick thumb image generated nicely with OpenAI');
        return resultBuffer;

    } catch (error) {
        console.error("-x- Error generating quick thumb image with OpenAI", error);
        throw error;
    }
}