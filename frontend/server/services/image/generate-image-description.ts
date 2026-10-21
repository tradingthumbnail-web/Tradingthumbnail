import { inferenceClient } from "~~/server/inference/openrouter";

const MODEL = "google/gemini-2.5-flash-lite";
const DESCRIPTION_PROMPT = `
    You will see an image and an inpainting intent. Produce a SINGLE, concise prompt
    that *describes the full final image as if already edited*, and that *grounds* the
    edit spatially and visually so it blends seamlessly.

    MANDATORY:
    1) One-sentence scene summary (time/weather/mood).
    2) Inpainting intent: WHAT to add/replace and WHY (1 sentence), include the expressions of the subject if stated.
    3) Spatial grounding: WHERE it goes using normalized bbox
    (x={{x0}}..{{x1}}, y={{y0}}..{{y1}} relative to the whole image),
    refer to nearby anchors (e.g., "left of the actor's face", "upper-right quadrant").
    4) Visual match instructions:
    - camera/lens feel (wide/tele, perspective)
    - lighting direction/intensity and color temperature
    - contrast and grain/texture level to match the background
    - depth-of-field/background blur continuity
    - shadow/contact shadow notes if needed
    5) Thumbnail legibility: keep subject readable at small sizes.
    6) Expressions:
    - keep the expressions of the subject as close to the original as possible if not stated otherwise
    - if a new expression is stated, update the expression of the subject to the new one

    Write the final **single prompt** in natural prose (no lists), including the above context.
    Inpainting intent: "{{prompt}}".
`

/**
 * Generates an image description for the inpainting process
 * @param imageUrl - The URL of the image to describe
 * @param prompt - The inpainting prompt
 * @returns The image description
 */
export const generateImageDescriptionForInpainting = async (imageUrl: string, prompt: string) => {
    try {
        console.log(" |– Generating image description for inpainting...")

        const response = await inferenceClient.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "user", content: DESCRIPTION_PROMPT.replace("{{prompt}}", prompt) },
                { role: "user", content: [
                    { type: "image_url", image_url: { url: imageUrl } }
                ]}
            ],
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("-x- Error generating image description for inpainting", error);
        throw error;
    }
};