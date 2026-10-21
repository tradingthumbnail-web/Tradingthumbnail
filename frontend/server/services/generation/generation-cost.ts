import {
    getModelConfig,
    getModelCreditsWithOptions,
    resolveModel,
    type ModelName,
    type ResolutionValue,
} from "~~/server/constants/models-db";

const QUALITY_CREDITS: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
};

function clampCount(value: unknown, fallback: number, max: number): number {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n < 1) return fallback;
    return Math.min(Math.floor(n), max);
}

export function clampQuickGenerationImageCount(value: unknown): number {
    return clampCount(value, 1, 4);
}

export function clampPhotoshootVariations(value: unknown): number {
    return clampCount(value, 1, 8);
}

export function computeQuickGenerationCost(input: {
    numberOfImages?: number;
    imageQuality?: string;
    model?: ModelName | string;
    advanced?: { useStructuredPrompt?: boolean };
    modelOptions?: { resolution?: ResolutionValue; enableWebSearch?: boolean };
}): number {
    const numberOfImages = clampQuickGenerationImageCount(input.numberOfImages);
    const model = resolveModel(input.model, "quickGeneration");
    const config = getModelConfig(model);
    if (config.resolutionOptions || config.supportsWebSearch) {
        return getModelCreditsWithOptions(model, {
            resolution: input.modelOptions?.resolution,
            webSearch: input.modelOptions?.enableWebSearch,
        }) * numberOfImages;
    }
    const quality = input.imageQuality && QUALITY_CREDITS[input.imageQuality]
        ? input.imageQuality
        : "medium";
    let cost = numberOfImages * QUALITY_CREDITS[quality];
    if (input.advanced?.useStructuredPrompt) cost += 1;
    return cost;
}

export function computeFineEditCost(input: {
    model?: ModelName | string;
    modelOptions?: { resolution?: ResolutionValue; enableWebSearch?: boolean };
}): number {
    const model = resolveModel(input.model, "fineEdit");
    return getModelCreditsWithOptions(model, {
        resolution: input.modelOptions?.resolution,
        webSearch: input.modelOptions?.enableWebSearch,
    });
}

export function computeQuickThumbCost(includeAvatar: boolean): number {
    return includeAvatar ? 3 : 1;
}

export function computePhotoshootCost(variations: unknown): number {
    return clampPhotoshootVariations(variations);
}

export const FIXED_GENERATION_COSTS = {
    sketch: 3,
    inpainting: 1,
    outpainting: 1,
    changeFace: 1,
    faceSwap: 1,
    imageToImage: 2,
    pipeline: 5,
} as const;
