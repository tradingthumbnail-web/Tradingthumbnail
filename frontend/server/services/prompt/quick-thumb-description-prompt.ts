import { inferenceClient } from "~~/server/inference/openrouter";

const MODEL = "google/gemini-2.5-flash-lite";

type Anchor =
    | 'top-left' | 'top-center' | 'top-right'
    | 'center-left' | 'center' | 'center-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';

type Rect = { width: number; height: number; top: number; left: number };

type Positions = {
    avatar: { anchor: Anchor; rect: Rect };
    text: { anchor: Anchor; rect: Rect };
};

type QuickThumbPromptInput = {
    // Core form
    title: string;
    description: string;
    emotions: string;
    typeOfVideo: string;
    thumbnailStyle: string;
    includeText: boolean;
    textHeadline: string;
    colorPalette?: string;
    layout: string;

    // Avatar options
    includeAvatar: boolean;
    avatarId?: string;
    avatarEmotion?: string;
    avatarAngle?: string;
    includeBodyPose?: boolean;
    bodyPose?: string;
    outfit?: string;
    customOutfit?: string;

    // Additional
    keywords?: string;
    backgroundType?: string;
    customBackground?: string;
    realism?: string;
    exclusions?: string;

    // Computed positions
    positions: Positions;

    // Optional canvas data URL (future use)
    canvasDataUrl?: string;
};

function buildMarkdownFromInput(input: QuickThumbPromptInput) {
    const { positions } = input;
    const lines: string[] = [];
    lines.push(`# Thumbnail Brief`);
    lines.push(`
## 1) Video Context
- Title: ${input.title || '—'}
- One-line description: ${input.description || '—'}
- Video type: ${input.typeOfVideo || '—'}
- Emotion/vibe to convey: ${input.emotions || '—'}`);

    lines.push(`
## 2) Visual Style
- Thumbnail style: ${input.thumbnailStyle || '—'}
- Color palette: ${input.colorPalette || '—'}
- Realism: ${input.realism || '—'}`);

    lines.push(`
## 3) Composition & Layout
- Layout preset: ${input.layout || '—'}
- Avatar placement anchor: ${positions.avatar.anchor}
- Avatar mask rect: { width: ${positions.avatar.rect.width}, height: ${positions.avatar.rect.height}, top: ${positions.avatar.rect.top}, left: ${positions.avatar.rect.left} }
- Text placement anchor: ${positions.text.anchor}
- Text mask rect: { width: ${positions.text.rect.width}, height: ${positions.text.rect.height}, top: ${positions.text.rect.top}, left: ${positions.text.rect.left} }`);

    if (input.includeAvatar) {
        lines.push(`
## 4) Avatar/Character
- Include avatar: Yes
- Emotion/Expression: ${input.avatarEmotion || 'neutral'}
- Angle: ${input.avatarAngle || 'front'}
- Include body pose/hands: ${input.includeBodyPose ? 'Yes' : 'No'}
- Pose specifics: ${input.bodyPose || '—'}
- Outfit: ${input.outfit === 'custom' ? (input.customOutfit || 'custom') : (input.outfit || '—')}`);
    } else {
        lines.push(`
## 4) Avatar/Character
- Include avatar: No`);
    }

    lines.push(`
## 5) Text
- Include text/headline: ${input.includeText ? 'Yes' : 'No'}`);
    if (input.includeText) {
        lines.push(`- Headline (keep language as-is): ${input.textHeadline || input.title || '—'}`);
    }

    lines.push(`
## 6) Background & Objects
- Background type: ${input.backgroundType || '—'}
- Custom background: ${input.customBackground || '—'}
- Must-include objects/keywords: ${input.keywords || '—'}
- Exclusions (avoid these): ${input.exclusions || '—'}`);

    return lines.join('\n');
}

const INSTRUCTION_PROMPT = `
You are helping create a single high-quality prompt to generate a YouTube thumbnail image.

Using ONLY the provided brief (Markdown), layout information, and optional sketch image, write ONE descriptive prompt (a single paragraph) that:
- Describes the overall scene, background, color mood, lighting, and composition.
- Uses the provided layout preset and the mask rectangles as hard constraints to position elements. Treat the avatar rect and text rect as the target regions for placement and balance. If an element is disabled (e.g., includeAvatar/includeText is false), compose the scene harmoniously using the remaining elements.
- If a sketch image is provided, treat it as a wireframe for composition (spatial arrangement only). Follow the spatial arrangement and relative sizes in the sketch while adhering to the brief.
- Places the avatar (if included) according to the avatar anchor and within the avatar mask rect (do not output coordinates; describe spatial placement consistent with the anchor using natural language).
- Places headline text (if included) according to the text anchor and within the text mask rect with typography suggestions (outline/shadow/contrast). Never invent new text; keep the headline text exactly as provided.
- Adheres closely to the provided scene description; do not introduce unrelated objects or themes beyond what would be reasonable to fulfill the description and style.
- Respects the specified style and layout preset.
- Avoids any non-visual instructions or implementation details.
- Avoids mentioning masks, anchors, or coordinates explicitly—use natural language like “top-left”, “center-right”, etc.

Output: Only the final single-paragraph prompt.`;

export const generateQuickThumbDescriptionPrompt = async (input: QuickThumbPromptInput) => {
    try {
        console.log(" |– Generating quick thumb prompts...");

        const brief = buildMarkdownFromInput(input);

        const messages: any[] = [
            { role: "system", content: INSTRUCTION_PROMPT },
            { role: "user", content: brief },
        ];

        if (input.canvasDataUrl) {
            messages.push({
                role: "user",
                content: [
                    { type: "image_url", image_url: { url: input.canvasDataUrl } }
                ]
            });
        }

        const response = await inferenceClient.chat.completions.create({
            model: MODEL,
            messages,
        });

        return response.choices?.[0]?.message?.content || '';
    } catch (error) {
        console.error("Error generating quick thumb prompts", error);
        throw error;
    }
};