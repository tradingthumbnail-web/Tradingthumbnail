export const taskTypes = [
    "GENERATE_BACKGROUND",
    "GENERATE_CHARACTER_IMAGE",
    "QUICK_GENERATION",
    "TRAIN_AVATAR",
    "CHANGE_EXPRESSION",
    "REMOVE_BG",
    "RELIGHTING",
    "IMG2IMG_CONVERTION",
    "INPAINTING",
    "ADD_TEXT_TO_IMAGE",
    "OUTPAINTING",
    "FACESWAP",
    "FINE_DETAIL_EDITION",
] as const;

export type TaskType = typeof taskTypes[number];

export interface StructuredPromptSubject {
    type: string;
    description: string;
    pose?: string;
    position?: string;
}

export interface StructuredPromptCamera {
    angle: string;
    lens?: string;
    f_number?: string;
    iso?: string;
}

export interface StructuredPrompt {
    scene: string;
    subjects: StructuredPromptSubject[];
    style: string;
    color_palette?: string[];
    lighting?: string;
    camera?: StructuredPromptCamera;
}

export function createEmptyStructuredPrompt(): StructuredPrompt {
    return {
        scene: '',
        subjects: [],
        style: 'photorealistic',
        color_palette: [],
        lighting: 'natural daylight',
        camera: {
            angle: 'eye level',
        },
    };
}