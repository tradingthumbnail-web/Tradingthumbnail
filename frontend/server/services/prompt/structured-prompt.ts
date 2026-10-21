import { type StructuredPrompt, type StructuredPromptSubject } from "~~/shared/generation/types";

export function buildStructuredPromptJson(prompt: StructuredPrompt): string {
    const cleanPrompt: Record<string, unknown> = {
        scene: prompt.scene,
        subjects: prompt.subjects.filter(s => s.description.trim() !== ''),
        style: prompt.style,
    };

    if (prompt.color_palette && prompt.color_palette.length > 0) {
        cleanPrompt.color_palette = prompt.color_palette;
    }

    if (prompt.lighting) {
        cleanPrompt.lighting = prompt.lighting;
    }

    if (prompt.camera && prompt.camera.angle) {
        const camera: Record<string, string> = { angle: prompt.camera.angle };
        if (prompt.camera.lens) camera.lens = prompt.camera.lens;
        if (prompt.camera.f_number) camera.f_number = prompt.camera.f_number;
        if (prompt.camera.iso) camera.iso = prompt.camera.iso;
        cleanPrompt.camera = camera;
    }

    return JSON.stringify(cleanPrompt);
}

export function structuredPromptToString(prompt: StructuredPrompt): string {
    const parts: string[] = [];

    if (prompt.scene) {
        parts.push(prompt.scene);
    }

    if (prompt.subjects.length > 0) {
        const subjectDescriptions = prompt.subjects
            .filter(s => s.description.trim() !== '')
            .map(s => {
                let desc = s.description;
                if (s.pose) desc += `, ${s.pose}`;
                if (s.position) desc += ` positioned ${s.position}`;
                return desc;
            });
        if (subjectDescriptions.length > 0) {
            parts.push(subjectDescriptions.join('. '));
        }
    }

    if (prompt.style) {
        parts.push(`${prompt.style} style`);
    }

    if (prompt.lighting) {
        parts.push(`${prompt.lighting} lighting`);
    }

    if (prompt.camera?.angle) {
        parts.push(`${prompt.camera.angle} camera angle`);
        if (prompt.camera.lens) {
            parts.push(`shot with ${prompt.camera.lens} lens`);
        }
    }

    if (prompt.color_palette && prompt.color_palette.length > 0) {
        parts.push(`color palette: ${prompt.color_palette.join(', ')}`);
    }

    return parts.join('. ');
}

export function createSubject(
    type: string = 'person',
    description: string = '',
    pose?: string,
    position?: string
): StructuredPromptSubject {
    return { type, description, pose, position };
}

export function mergePhotoshootDataWithStructuredPrompt(
    basePrompt: StructuredPrompt,
    expression: string,
    cameraAngle: string,
    background: string,
    description: string
): StructuredPrompt {
    const merged = { ...basePrompt };

    if (description && (!merged.scene || merged.scene.trim() === '')) {
        merged.scene = description;
    }

    if (expression && merged.subjects.length > 0) {
        merged.subjects = merged.subjects.map(s => ({
            ...s,
            pose: s.pose || expression,
        }));
    }

    if (cameraAngle && merged.camera) {
        merged.camera = {
            ...merged.camera,
            angle: cameraAngle,
        };
    } else if (cameraAngle) {
        merged.camera = { angle: cameraAngle };
    }

    if (background && background !== 'none') {
        merged.scene = `${merged.scene}. ${background} background`;
    }

    return merged;
}