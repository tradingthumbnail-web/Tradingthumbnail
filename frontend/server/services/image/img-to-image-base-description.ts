import { inferenceClient } from "~~/server/inference/openrouter";

const MODEL = "google/gemini-2.5-flash-lite";
const DESCRIPTION_PROMPT = `
#Goal
Write a markdown code with the essential visual information.

## General Instruction

Please carefully observe the YouTube thumbnail provided and generate a complete description in Markdown format, structured into sections, that includes the most relevant visual elements needed to recreate the image. Do not include information that is not strictly visible or that does not contribute to its reconstruction.

Make sure to include at least the following sections in your description:

## Context or Background
Describe the environment or setting of the thumbnail (e.g., colors, lighting, type of background).

## Composition and Layout
- Indicate the position of each main element (text, person(s), objects, etc.) within the image.
- Specify relative sizes or proportions if they are notable.

## Text and Typography
- Transcribe the visible text exactly as it appears (including uppercase and lowercase letters).
- Describe the color of each text, the style of the typography (e.g., thick, thin, with shadow, etc.), and its position in the thumbnail.

## People or Other Subjects
- Describe visible features (clothing, hair color, general facial features, body position).
- Mention gestures or facial expressions only if they are evident and relevant (e.g., "big smile").
- Omit any attempt to personally identify the individual (real name) or details that cannot be deduced from the image.

## Key Objects
- List and describe objects present (e.g., an envelope, icons, geometric shapes, decorative elements), indicating shape, color, and approximate location.

## Color Palette
- Note the main colors present in the thumbnail (e.g., background, text, clothing, objects).

## Additional Relevant Details
- Any visual details that do not fit into the previous sections but are important for reconstructing the thumbnail.

# Response Structure:

# Thumbnail Description

## 1. Context or Background
- ...

## 2. Composition and Layout
- ...

## 3. Text and Typography
- ...

## 4. People or Other Subjects
- ...

## 5. Key Objects
- ...

## 6. Color Palette
- ...

## 7. Additional Relevant Details
- ...

# Example of Expected Output:

# Thumbnail Description

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

## 3. Text and Typography

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
- No additional graphic elements such as logos, icons, or decorations are evident.
`

/**
 * Generates an image description for the inpainting process
 * @param imageUrl - The URL of the image to describe
 * @param prompt - The inpainting prompt
 * @returns The image description
 */
export const generateImageDescriptionForImageToImage = async (imageUrl: string) => {
    try {
        console.log(" |– Generating image description for image to image...")

        const response = await inferenceClient.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "user", content: DESCRIPTION_PROMPT },
                { role: "user", content: [
                    { type: "image_url", image_url: { url: imageUrl } }
                ]}
            ],
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("-x- Error generating image description for image to image", error);
        throw error;
    }
};