import Sharp from "sharp";

import fal, { isFalConfigured } from "~~/server/inference/fal";
import { getOpenAIClient, isOpenAIConfigured } from "~~/server/inference/openai";
import { generateOpenRouterImage, OPENROUTER_SKETCH_IMAGE_MODEL } from "~~/server/inference/openrouter";

export const SKETCH_PROMPT = `
ACT AS A PROFESSIONAL YOUTUBE THUMBNAIL COMPOSITOR.

YOUR TASK:
Create a polished, high-contrast YouTube thumbnail based on a spatial layout guide (Image 1) and a face reference (Image 2).

STRICT SPATIAL RULES (CRITICAL):
1. THE SPATIAL GEOMETRY OF IMAGE 1 IS SACROSANCT. Match the placement, scale, and hierarchy of all elements EXACTLY as shown in the wireframe. Do not move subjects to the center if they are in a corner.
2. BLUE PILL-SHAPED BLOCKS = "GHOST INSTRUCTIONS":
   - These are instructions for you to read and follow, but THEY ARE INVISIBLE.
   - ACTION: Use the text inside them to build the scene, mood, and effects.
   - MANDATORY: NEVER render any text from a blue block in the final image. ZERO TRACE of this text should remain.
3. GRAY RECTANGULAR BLOCKS = "VISIBLE TEXT":
   - These are the only blocks that should be rendered as text.
   - Render exactly the text content with bold, high-contrast, impactful typography.
   - Make them more dramatic and eye-catching, add effects so the text stands out in the thumbnail. You can change the color, add shadows, gradients, outlines, etc.
4. PERSON PLACEHOLDER ICONS:
   - These mark the exact position and scale for the main character (using Image 2's facial identity).

SCENE BUILDING:
- Integrate text naturally with scene lighting.
- Follow provided style settings for palette and mood.
- Maintain professional depth-of-field and cinematic lighting.
`;

const MAX_REFERENCE_DIMENSION = 1536;
const JPEG_QUALITY = 75;

interface GenerateSketchParams {
    canvasDataURL: string;
    layoutMetadata?: any[];
    referenceType: string;
    avatarId: string;
    referenceImageBase64?: string;
    styleParams?: any
}

async function toJpegDataUrl(image: string | Buffer, maxDimension: number): Promise<string> {
    const buffer = typeof image === "string"
        ? Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), "base64")
        : image;

    const jpeg = await Sharp(buffer, { failOn: "none" })
        .rotate()
        .resize(maxDimension, maxDimension, {
            fit: "inside",
            withoutEnlargement: true,
        })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();

    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

function dataUrlToUploadFile(dataUrl: string, filename: string): File {
    const rawBase64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const bytes = Buffer.from(rawBase64, "base64");
    return new File([bytes], filename, { type: "image/jpeg" });
}

async function generateSketchWithOpenAIFallback(prompt: string, inputReferences: string[]): Promise<Buffer> {
    const client = getOpenAIClient();
    const files = inputReferences.map((ref, idx) =>
        dataUrlToUploadFile(ref, idx === 0 ? "canvas.jpg" : `reference-${idx}.jpg`),
    );

    let response: any;
    try {
        response = await client.images.edit({
            model: "gpt-image-1.5",
            image: files as any,
            prompt,
            n: 1,
            size: "1536x1024",
            quality: "medium",
            input_fidelity: "high",
        } as any);
    } catch (firstError: any) {
        const status = firstError?.status ?? firstError?.statusCode;
        if (status === 400 || status === 404) {
            response = await client.images.edit({
                model: "gpt-image-1",
                image: files as any,
                prompt,
                n: 1,
                size: "1536x1024",
                quality: "medium",
            } as any);
        } else {
            throw firstError;
        }
    }

    const b64 = response?.data?.[0]?.b64_json;
    if (!b64) {
        throw createError({
            statusCode: 500,
            statusMessage: "Image generation failed",
        });
    }
    return Buffer.from(b64, "base64");
}

async function generateSketchWithFalFallback(prompt: string, inputReferences: string[]): Promise<Buffer> {
    let response: any;
    try {
        response = await fal.subscribe("openai/gpt-image-2/edit", {
            input: {
                prompt,
                image_urls: inputReferences,
                num_images: 1,
                image_size: "auto",
                quality: "medium",
                output_format: "png",
            } as any,
        });
    } catch {
        response = await fal.subscribe("fal-ai/gpt-image-1.5/edit", {
            input: {
                prompt,
                image_urls: inputReferences,
                num_images: 1,
                image_size: "1536x1024",
                quality: "medium",
                input_fidelity: "high",
                output_format: "png",
            } as any,
        });
    }

    const imageUrl = response?.data?.images?.[0]?.url;
    if (!imageUrl) {
        throw createError({
            statusCode: 500,
            statusMessage: "Image generation failed",
        });
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        throw createError({
            statusCode: 500,
            statusMessage: "Failed to download generated image",
        });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

export const generateSketch = async (params: GenerateSketchParams) => {
    if (!params?.canvasDataURL || typeof params.canvasDataURL !== "string" || !params.canvasDataURL.trim()) {
        throw createError({
            statusCode: 400,
            statusMessage: "Canvas is required",
        });
    }

    try {
        console.log(" |– Generating sketch with OpenRouter...")

        let prompt = SKETCH_PROMPT;

        if (params.layoutMetadata) {
            const instructions = params.layoutMetadata
                .filter(m => m.role === 'INSTRUCTION')
                .map(m => `At position [${m.left},${m.top}]: Instruction: "${m.content}"`)
                .join('\n');

            const visibleText = params.layoutMetadata
                .filter(m => m.role === 'TEXT')
                .map(m => `At position [${m.left},${m.top}]: RENDER TEXT: "${m.content}"`)
                .join('\n');

            const subject = params.layoutMetadata.find(m => m.role === 'PERSON_PLACE_HOLDER' || m.role === 'PERSON_PLACEHOLDER');

            prompt += `\n\n--- EXACT LAYOUT SPECIFICATIONS (DO NOT DEVIATE) ---\n`;
            if (visibleText) prompt += `TEXT TO DISPLAY:\n${visibleText}\n`;
            if (instructions) prompt += `INSTRUCTIONS TO FOLLOW (DO NOT WRITE THESE WORDS):\n${instructions}\n`;
            if (subject && subject.width && subject.height) prompt += `SUBJECT POSITION: Center character at coordinate [${Math.round(subject.left + subject.width/2)}, ${Math.round(subject.top + subject.height/2)}].\n`;
        }

        if (params.styleParams) {
            prompt += `\n\nStyle settings:\n${JSON.stringify(params.styleParams, null, 2)}`;
        };

        const inputReferences = [await toJpegDataUrl(params.canvasDataURL, MAX_REFERENCE_DIMENSION)];
        if (params.referenceImageBase64) {
            inputReferences.push(await toJpegDataUrl(params.referenceImageBase64, MAX_REFERENCE_DIMENSION));
        }

        try {
            const resultBuffer = await generateOpenRouterImage({
                model: OPENROUTER_SKETCH_IMAGE_MODEL,
                prompt,
                inputReferences,
                aspectRatio: "3:2",
                quality: "medium",
                outputFormat: "png",
            });

            console.log(' |- Sketch generated nicely with OpenRouter');
            return resultBuffer;
        } catch (openRouterError: any) {
            const providerStatus = openRouterError?.providerStatus ?? openRouterError?.statusCode ?? "unknown";
            console.warn(" |- OpenRouter sketch generation failed; checking fallback providers", { status: providerStatus });

            if (isOpenAIConfigured()) {
                try {
                    console.log(" |– Generating sketch with OpenAI fallback...");
                    const openAiBuffer = await generateSketchWithOpenAIFallback(prompt, inputReferences);
                    console.log(" |- Sketch generated nicely with OpenAI fallback");
                    return openAiBuffer;
                } catch (openAiError: any) {
                    console.warn(" |- OpenAI sketch fallback failed", {
                        status: openAiError?.status ?? openAiError?.statusCode ?? "unknown",
                    });
                }
            }

            if (isFalConfigured()) {
                try {
                    console.log(" |– Generating sketch with FAL fallback...");
                    const falBuffer = await generateSketchWithFalFallback(prompt, inputReferences);
                    console.log(" |- Sketch generated nicely with FAL fallback");
                    return falBuffer;
                } catch (falError: any) {
                    console.warn(" |- FAL sketch fallback failed", {
                        status: falError?.status ?? falError?.statusCode ?? "unknown",
                    });
                }
            }

            throw openRouterError;
        }
    } catch (error: any) {
        console.error("-x- Error generating sketch", {
            statusCode: error?.statusCode ?? error?.status ?? 500,
            message: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
    }
};
