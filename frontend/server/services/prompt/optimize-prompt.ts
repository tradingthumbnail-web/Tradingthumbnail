import { inferenceClient } from "~~/server/inference/openrouter";

const MODEL = "google/gemini-2.5-flash-lite";
const ASSETS_OPTIMIZATION_PROMPT = `
    You are a helpful assistant that optimizes prompts for image generation of assets. You will be given a prompt and you will need to optimize it so we can generate an interesting and engaging asset (an element that will be used in a thumbnail). This asset will be used as element in the generation of a thumbnail and will get the background removed.

    The prompt to optimize is: {{prompt}}
    
    Give just the optimized prompt, no other text.
`;

const BACKGROUNDS_OPTIMIZATION_PROMPT = `
    You are a helpful assistant that optimizes prompts for image generation of backgrounds. You will be given a prompt and you will need to optimize it so we can generate an interesting and engaging background (a scene that will be used as a background in a thumbnail).

    The prompt to optimize is: {{prompt}}
    
    Give just the optimized prompt, no other text.
`;

/**
 * Optimizes the prompt for an image generation
 * @param prompt - The prompt to optimize
 * @param imageType - The type of image to generate
 * @param model - The model to use, it defaults to the one defined in the application
 * @returns The optimized prompt
 */
export const optimizePrompt = async (prompt: string, imageType: 'assets' | 'background', model: string = MODEL) => {
    try {
        console.log(" |– Optimizing prompt for generation...")
        let basePrompt = imageType === 'assets' ? ASSETS_OPTIMIZATION_PROMPT : BACKGROUNDS_OPTIMIZATION_PROMPT;

        const response = await inferenceClient.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: basePrompt.replace("{{prompt}}", prompt) }],
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error optimizing prompt", error);
        throw error;
    }
};

const PHOTOSHOOT_OPTIMIZATION_PROMPT = `
    You optimize prompts for generating character thumbnails using Flux 1 and a LoRA model.
    Your job is to rewrite the given prompt so that the character is clear, appealing, and consistent with the character description.
    Keep all character details (appearance, clothing, traits), and integrate the provided expression, camera angle, background, and gender.
    Enhance clarity, style, and visual interest without adding new traits or changing the character.
    Output only the final optimized prompt—no explanations.

    Base prompt to optimize:
    {{prompt}}

    Expression:
    {{expression}}

    Camera angle:
    {{cameraAngle}}

    Background:
    {{background}}

    Gender:
    {{gender}}
`

/**
 * Optimizes the prompt for a photoshoot generation
 * @param prompt - The prompt to optimize
 * @param expression - The expression to use
 * @param cameraAngle - The camera angle to use
 * @param background - The background to use
 * @param gender - The gender of the character
 * @param model - The model to use, it defaults to the one defined in the application
 * @returns The optimized prompt
 */
export const optimizePhotoshootPrompt = async (prompt: string, expression: string, cameraAngle: string, background: string, gender: string, model: string = MODEL) => {
    try {
        console.log(" |– Optimizing prompt for photoshoot generation...")
        if (background === 'none') {
            background = 'Generate a background that is consistent with the character description';
        };
        const fullPrompt = PHOTOSHOOT_OPTIMIZATION_PROMPT
            .replace("{{prompt}}", prompt)
            .replace("{{expression}}", expression)
            .replace("{{cameraAngle}}", cameraAngle)
            .replace("{{background}}", background)
            .replace("{{gender}}", gender);

        const response = await inferenceClient.chat.completions.create({
            model: model, messages: [{ role: "user", content: fullPrompt }],
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error optimizing prompt for photoshoot generation", error);
        throw error;
    }
};

const FINE_GRAINED_EDITION_OPTIMIZATION_PROMPT = `
    You are a helpful assistant that optimizes prompts for fine-grained edition of an image. You will be given a prompt to optimize and the image to edit, and your job is to optimize the prompt for the fine-grained edition of the image by re-writing it better and more specific and tailored to the image

    The prompt to optimize is: {{prompt}}

    The image to edit is: {{imageURL}}

    Give just the optimized prompt, no other text.
`

/**
 * Optimizes the prompt for a fine-grained edition
 * @param prompt - The prompt to optimize
 * @param imageURL - The URL of the image to edit
 * @param model - The model to use, it defaults to the one defined in the application
 * @returns The optimized prompt
 */
export const optimizeFineGrainedEditionPrompt = async (prompt: string, imageURL: string, model: string = MODEL) => {
    try {
        console.log(" |- Optimizing fine-grained edition prompt...");

        const response = await inferenceClient.chat.completions.create({
            model: model,
            messages: [
                { role: "user", content: FINE_GRAINED_EDITION_OPTIMIZATION_PROMPT
                    .replace("{{prompt}}", prompt)
                    .replace("{{imageURL}}", imageURL) },
                { role: "user", content: [
                    { type: "image_url", "image_url": { "url": imageURL } }
                ]}
            ],
        });

        return response.choices[0]?.message?.content ?? null;
    } catch (error) {
        console.warn(" |- Fine-grained edition prompt optimization failed; using original user prompt", error);
        return null;
    }
};