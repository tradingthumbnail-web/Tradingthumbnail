import { inferenceClient } from "~~/server/inference/openrouter";

const MODEL = "google/gemini-2.5-flash-lite";

const TEXT_DESCRIPTION_PROMPT = `
    You are a helpful assistant that creates prompts for adding text to thumbnail images using the Ideogram model. You will be given information about text that needs to be added to a thumbnail and the image itself, and you need to create a detailed prompt that focuses specifically on the text styling, placement, and visual characteristics.

    The text information provided is: {{prompt}}
    
    Create a prompt that describes:
    - The text content and how it should appear
    - Typography style (bold, modern, eye-catching, etc.)
    - Text effects (shadows, outlines, gradients, etc.)
    - Color scheme for the text
    - How the text should integrate with the thumbnail design
    - Any visual emphasis or styling that makes the text stand out
    
    Focus entirely on the text elements and their visual presentation. Consider the image where the text will be added so you can create the most amount of contrast and readability, maintaining it engaging and with a good visual hierarchy. Give just the optimized text-focused prompt, no other text.
`;

/**
 * @description Use gpt-image-1.5 instead
 * Generates a text description prompt
 * @param prompt - The original prompt with information about the text in the thumb image
 * @param imageUrl - The URL of the image where the text will be added
 * @param model - The model to use, it defaults to the one defined in the application
 * @returns The optimized prompt
 */
export const generateTextDescriptionPrompt = async (prompt: string, imageUrl: string, model: string = MODEL) => {
    try {
        console.log(" |– Generating text description prompt...")
        let basePrompt = TEXT_DESCRIPTION_PROMPT;

        const response = await inferenceClient.chat.completions.create({
            model: model,
            messages: [
                { 
                    role: "user", 
                    content: [
                        { type: "text", text: basePrompt.replace("{{prompt}}", prompt) },
                        { type: "image_url", image_url: { url: imageUrl } }
                    ]
                }
            ],
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error generating text description prompt", error);
        throw error;
    }
};