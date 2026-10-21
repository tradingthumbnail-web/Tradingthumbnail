import { inferenceClient } from "~~/server/inference/openrouter";

const MODEL = "google/gemini-2.5-flash-lite";
const DESCRIPTION_PROMPT = `
    #Goal
    Your ultimate goal is writing just a single paragraph concise and complete prompt to generate a thumbnail youtube image in an AI image generator.

    #Instructions
    Carefully read the following Markdown information containing a detailed description of a YouTube thumbnail.  
    Using only the visual and structural information described in the Markdown, create a new prompt to recreate and improved version of the thumbnail that retains the essential elements (texts, main colors, basic composition, and theme) but with an improved and more engaging design.

    Ensure that you:

    - Maintain a recognizable element distribution but optimize their position or sizes to enhance readability and visual appeal.
    - In case there is text in the image:
    -- Keep the main text (in terms of content and hierarchy), adding suggestions for typographic styles and highlighting effects (e.g., outlines, shadows, gradients) to increase impact.
    -- Keep the original language for all texts, despite the rest of the prompt being writing in English, don’t translate any text in the thumbnail.
    !Important: If there isn’t any text described don’t add any text to the description.
    - Improve the background with details or accents that better highlight the text and figure.
    - Describe ideas for lighting adjustments, color refinements (while preserving the main tones), and possible icons or graphic elements that add professionalism and appeal.
    - Include proposals for potential poses or expressions of the person that maintain the original concept of holding an object but add a more dynamic and charismatic touch if appropriate.
    - Avoid speculative or irrelevant information; focus on visual recreation and improvement suggestions.
    - Avoid subjective or any non visual instruction that cannot be represented in an unique way

    # Example Input:

    ¨{# Thumbnail Description

    ## 1. Context or Background
    - A visual background related to a data center or servers.
    - Dark colors such as black, dark gray, and deep blue dominate, with intermittent red and white lights on panels and machines.
    - A perspective of a server hallway with lines and ceiling lights, suggesting depth toward the background.

    ## 2. Composition and Layout
    The thumbnail consists of two main elements:

    - **Left area** (approximately **55%** width): Large visible text occupying a significant portion of the vertical space.
    - **Right area** (approximately **45%** width): A smiling person holding a white envelope with both hands, positioned to the right of the viewer.
    - The text is left-aligned and takes up about **60%** of the thumbnail's width.
    - The person occupies the right half of the thumbnail, from the head down to slightly above the waist, centered vertically.

    ## 3. Text and Typography (Note: Add this block just if there is a described text, if there isn’t avoid it)

    ### Exact Visible Text: "Prueba Kithumbs Gratis"

    ### Typographic Features:
    - **"Prueba"**: White letters, bold sans-serif font.
    - **"Kithumbs"**: White letters, bold sans-serif font, placed over a deep violet rectangle as a background.
    - **"GRATIS"**: Bright yellow letters, bold sans-serif font, standing out especially due to the contrast with the dark background.
    - The text is left-aligned, occupying almost the entire left half vertically, with a large size for better readability.

    ## 4. People or Other Subjects
    - A young male with short dark hair and a short beard, smiling and showing teeth.
    - Wearing a simple red t-shirt with no visible graphics.
    - Holding a white rectangular envelope in a horizontal position with both hands in front of him.
    - The envelope occupies a considerable portion of the lower right half of the image.

    ## 5. Key Objects
    - A **white envelope**, rectangular, with no visible markings or text, clearly held with both hands by the person in the thumbnail.

    ## 6. Color Palette
    - **Background**: Black, deep blue, dark gray, and red and white details (server lights).
    - **Text**: White, deep violet (rectangle behind the word *"Kithumbs"*) and bright yellow (*"GRATIS"*).
    - **Person’s Clothing**: Solid red.
    - **Key Object (Envelope)**: White.

    ## 7. Additional Relevant Details
    - The overall lighting combines **cool tones** (technological background) with the **warm contrast** of the face, red clothing, and yellow text.
    - **Strong contrast** between white/yellow text and the dark background, improving visibility and visual appeal.
    - No additional graphic elements such as logos, icons, or decorations are evident.}

    # Expected Output:

    {"Generate an engaging YouTube thumbnail set in a modern data center with bright lights,  
    technological highlights, and a blurred background effect.  
    Depict a young man with dark hair and a short beard, smiling while holding  
    a white envelope in a slightly tilted position toward the camera.  
    The text should include the words ‘Prueba,’ ‘Kithumbs,’ and ‘GRATIS’  
    in vibrant colors (violet gradient, intense yellow, and white with shadows).  
    Position the text on the left with a bold sans-serif font and add outline  
    or shadow effects for better readability.  
    The subject's shirt should be a vibrant red, and the overall contrast of the scene should be high,  
    with blue lighting reflections to enhance the technological theme.  
    Add a subtle graphic element related to email or digital marketing near the text.  
    Keep the composition roughly 50% text and 50% figure,  
    aiming for a visually striking and clear image that grabs immediate attention."}

    #Goal reinforcement

    Remember, your unique output must be the text prompt.
`

/**
 * Generates a thumb prompt from the image to image process
 * @param imageUrl - The URL of the image to describe
 * @returns The image description
 */
export const generateThumbPromptFromImageToImage = async (imageUrl: string, imageDescription: string) => {
    try {
        console.log(" |– Generating thumb prompt from image to image...")

        const response = await inferenceClient.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "user", content: DESCRIPTION_PROMPT + imageDescription },
                { role: "user", content: [
                    { type: "image_url", image_url: { url: imageUrl } }
                ]}
            ],
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("-x- Error generating thumb prompt from image to image", error);
        throw error;
    }
};