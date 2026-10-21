export type ModelProvider = 'fal' | 'openai' | 'ideogram' | 'google' | 'bytedance' | 'tongyi' | 'qwen' | 'flux';
export type SelectableFor = 'quickGeneration' | 'fineEdit';
export type Locale = 'en' | 'es' | 'ca';

const supportedModels = [
    "fal-ai/flux-1/srpo",
    "fal-ai/flux-pro/kontext",
    "fal-ai/flux-kontext-lora/text-to-image",
    "gpt-image-1.5",
    "gpt-image-2",
    "fal-ai/flux-kontext-lora/inpaint",
    "fal-ai/flux-lora/inpainting",
    "fal-ai/qwen-image-edit/inpaint",
    "fal-ai/flux-lora-fill",
    "fal-ai/flux-lora/image-to-image",
    "fal-ai/ideogram/v3/edit",
    "fal-ai/flux-lora",
    "fal-ai/flux-2",
    "fal-ai/flux-2/edit",
    "fal-ai/flux-2/lora",
    "fal-ai/nano-banana",
    "fal-ai/nano-banana-2",
    "fal-ai/qwen-image-2512",
    "fal-ai/bytedance/seedream/v5/lite/text-to-image",
    "fal-ai/z-image/turbo",
    "fal-ai/z-image/turbo/image-to-image",
    "fal-ai/bytedance/seedream/v5/lite/edit",
    "fal-ai/flux-2/flash/edit",
    "half-moon-ai/ai-face-swap/faceswapimage",
] as const;
export type ModelName = typeof supportedModels[number];

type LocalizedDescription = {
    en: string;
    es: string;
    ca: string;
};

export type ResolutionValue = '0.5K' | '1K' | '2K' | '4K';

export type ResolutionOption = {
    value: ResolutionValue;
    label: string;
    creditMultiplier: number;
};

type ModelConfig = {
    per_image_cents: number | null;
    credits: number;
    version?: string;
    in_use: boolean;
    displayName: string;
    description: LocalizedDescription;
    provider: ModelProvider;
    selectableFor: SelectableFor[];
    baseCredits?: number;
    resolutionOptions?: ResolutionOption[];
    supportsWebSearch?: boolean;
    webSearchCredits?: number;
};

type ModelCostsDictionary = {
    [K in ModelName]: ModelConfig;
};

export const PROVIDER_ICONS: Record<ModelProvider, string> = {
    fal: '/icons/fal.svg',
    openai: '/icons/openai.svg',
    ideogram: '/icons/ideogram.svg',
    google: '/icons/google.svg',
    bytedance: '/icons/bytedance.svg',
    tongyi: '/icons/tongyi.svg',
    qwen: '/icons/qwen.svg',
    flux: '/icons/flux.svg',
};

export const FAL_MODEL_COSTS: ModelCostsDictionary = {
    "fal-ai/flux-1/srpo": {
        per_image_cents: 3,
        credits: 1,
        version: "v1",
        in_use: true,
        displayName: "Flux SRPO",
        description: {
            en: "Fast generation with good quality. Balanced performance for general use.",
            es: "Generación rápida con buena calidad. Rendimiento equilibrado para uso general.",
            ca: "Generació ràpida amb bona qualitat. Rendiment equilibrat per a ús general.",
        },
        provider: "flux",
        selectableFor: [],
    },
    "fal-ai/flux-pro/kontext": {
        per_image_cents: 4,
        credits: 2,
        version: "v1",
        in_use: true,
        displayName: "Flux Pro Kontext",
        description: {
            en: "High-quality contextual generation. Best for complex scenes and compositions.",
            es: "Generación contextual de alta calidad. Ideal para escenas y composiciones complejas.",
            ca: "Generació contextual d'alta qualitat. Ideal per a escenes i composicions complexes.",
        },
        provider: "flux",
        selectableFor: [],
    },
    "fal-ai/flux-kontext-lora/text-to-image": {
        per_image_cents: 4,
        credits: 2,
        version: "v1",
        in_use: true,
        displayName: "Flux Kontext LoRA",
        description: {
            en: "LoRA-enhanced generation with style consistency. Great for branded content.",
            es: "Generación mejorada con LoRA y consistencia de estilo. Ideal para contenido de marca.",
            ca: "Generació millorada amb LoRA i consistència d'estil. Ideal per a contingut de marca.",
        },
        provider: "flux",
        selectableFor: [],
    },
    "gpt-image-1.5": {
        per_image_cents: 2,
        credits: 2,
        version: "v1",
        in_use: true,
        displayName: "GPT Image",
        description: {
            en: "OpenAI's image model. Excellent prompt understanding and photorealism.",
            es: "Modelo de imagen de OpenAI. Excelente comprensión de prompts y fotorrealismo.",
            ca: "Model d'imatge d'OpenAI. Excel·lent comprensió de prompts i fotorealisme.",
        },
        provider: "openai",
        selectableFor: ["quickGeneration", "fineEdit"],
    },
    "gpt-image-2": {
        per_image_cents: 5,
        credits: 4,
        version: "v2",
        in_use: true,
        displayName: "GPT Image 2",
        description: {
            en: "OpenAI's latest image model. State-of-the-art photorealism and prompt adherence.",
            es: "Último modelo de imagen de OpenAI. Fotorrealismo y comprensión de prompts de última generación.",
            ca: "Darrer model d'imatge d'OpenAI. Fotorrealisme i comprensió de prompts d'última generació.",
        },
        provider: "openai",
        selectableFor: ["quickGeneration", "fineEdit"],
    },
    "fal-ai/flux-kontext-lora/inpaint": {
        per_image_cents: 4,
        credits: 2,
        version: "v1",
        in_use: true,
        displayName: "Flux Kontext Inpaint",
        description: {
            en: "Context-aware inpainting. Best for seamless object replacement.",
            es: "Inpainting consciente del contexto. Ideal para reemplazo de objetos sin costuras.",
            ca: "Inpainting conscient del context. Ideal per a reemplaçament d'objectes sense costures.",
        },
        provider: "flux",
        selectableFor: ["fineEdit"],
    },
    "fal-ai/qwen-image-edit/inpaint": {
        per_image_cents: 4,
        credits: 2,
        version: "v1",
        in_use: false,
        displayName: "Qwen Inpaint",
        description: {
            en: "Qwen-based inpainting model. Good for text and detail edits.",
            es: "Modelo de inpainting basado en Qwen. Bueno para ediciones de texto y detalles.",
            ca: "Model d'inpainting basat en Qwen. Bo per a edicions de text i detalls.",
        },
        provider: "qwen",
        selectableFor: ["fineEdit"],
    },
    "fal-ai/flux-lora/inpainting": {
        per_image_cents: 4,
        credits: 2,
        version: "v1",
        in_use: true,
        displayName: "Flux LoRA Inpaint",
        description: {
            en: "LoRA-powered inpainting. Maintains style consistency in edits.",
            es: "Inpainting potenciado por LoRA. Mantiene la consistencia de estilo en las ediciones.",
            ca: "Inpainting potenciat per LoRA. Manté la consistència d'estil en les edicions.",
        },
        provider: "flux",
        selectableFor: ["fineEdit"],
    },
    "fal-ai/flux-lora-fill": {
        per_image_cents: 4,
        credits: 2,
        version: "v1",
        in_use: true,
        displayName: "Flux LoRA Fill",
        description: {
            en: "Intelligent fill generation. Great for extending or completing images.",
            es: "Generación de relleno inteligente. Ideal para extender o completar imágenes.",
            ca: "Generació d'ompliment intel·ligent. Ideal per a estendre o completar imatges.",
        },
        provider: "flux",
        selectableFor: ["fineEdit"],
    },
    "fal-ai/flux-lora/image-to-image": {
        per_image_cents: 4,
        credits: 2,
        version: "v1",
        in_use: true,
        displayName: "Flux Image-to-Image",
        description: {
            en: "Transform existing images. Best for style transfer and variations.",
            es: "Transforma imágenes existentes. Ideal para transferencia de estilo y variaciones.",
            ca: "Transforma imatges existents. Ideal per a transferència d'estil i variacions.",
        },
        provider: "flux",
        selectableFor: ["fineEdit"],
    },
    "fal-ai/ideogram/v3/edit": {
        per_image_cents: 6,
        credits: 6,
        version: "v1",
        in_use: false,
        displayName: "Ideogram Edit",
        description: {
            en: "Ideogram's editing model. Excellent text rendering in images.",
            es: "Modelo de edición de Ideogram. Excelente renderizado de texto en imágenes.",
            ca: "Model d'edició d'Ideogram. Excel·lent renderitzat de text en imatges.",
        },
        provider: "ideogram",
        selectableFor: ["fineEdit"],
    },
    "fal-ai/flux-lora": {
        per_image_cents: 4,
        credits: 2,
        version: "v1",
        in_use: false,
        displayName: "Flux LoRA",
        description: {
            en: "Base LoRA model. Consistent style with custom training support.",
            es: "Modelo LoRA base. Estilo consistente con soporte de entrenamiento personalizado.",
            ca: "Model LoRA base. Estil consistent amb suport d'entrenament personalitzat.",
        },
        provider: "flux",
        selectableFor: [],
    },
    "fal-ai/flux-2": {
        per_image_cents: 2,
        credits: 2,
        version: "v1",
        in_use: true,
        displayName: "Flux 2",
        description: {
            en: "Latest Flux model. Fast, affordable, and high quality.",
            es: "Último modelo Flux. Rápido, asequible y de alta calidad.",
            ca: "Últim model Flux. Ràpid, assequible i d'alta qualitat.",
        },
        provider: "flux",
        selectableFor: ["quickGeneration"],
    },
    "fal-ai/flux-2/edit": {
        per_image_cents: 2,
        credits: 1,
        version: "v1",
        in_use: true,
        displayName: "Flux 2 Edit",
        description: {
            en: "Flux 2 editing variant. Quick and precise image modifications.",
            es: "Variante de edición de Flux 2. Modificaciones de imagen rápidas y precisas.",
            ca: "Variant d'edició de Flux 2. Modificacions d'imatge ràpides i precises.",
        },
        provider: "flux",
        selectableFor: ["fineEdit"],
    },
    "fal-ai/flux-2/lora": {
        per_image_cents: 2,
        credits: 2,
        version: "v1",
        in_use: true,
        displayName: "Flux 2 LoRA",
        description: {
            en: "Flux 2 with LoRA support. Combine speed with custom styles.",
            es: "Flux 2 con soporte LoRA. Combina velocidad con estilos personalizados.",
            ca: "Flux 2 amb suport LoRA. Combina velocitat amb estils personalitzats.",
        },
        provider: "flux",
        selectableFor: [],
    },
    "fal-ai/nano-banana": {
        per_image_cents: 4,
        credits: 2,
        version: "v1",
        in_use: true,
        displayName: "Nano Banana",
        description: {
            en: "Google's state-of-the-art image generation. High quality photorealism.",
            es: "Generación de imágenes de última generación de Google. Fotorrealismo de alta calidad.",
            ca: "Generació d'imatges d'última generació de Google. Fotorealisme d'alta qualitat.",
        },
        provider: "google",
        selectableFor: ["quickGeneration", "fineEdit"],
    },
    "fal-ai/nano-banana-2": {
        per_image_cents: 8,
        credits: 4,
        version: "v2",
        in_use: true,
        displayName: "Nano Banana 2",
        description: {
            en: "Google's Gemini 3.1 Flash Image. 4x faster with vibrant output, accurate text rendering, and web search grounding.",
            es: "Google Gemini 3.1 Flash Image. 4x más rápido con salida vibrante, renderizado de texto preciso y búsqueda web.",
            ca: "Google Gemini 3.1 Flash Image. 4x més ràpid amb sortida vibrant, renderitzat de text precís i cerca web.",
        },
        provider: "google",
        selectableFor: ["quickGeneration", "fineEdit"],
        baseCredits: 4,
        resolutionOptions: [
            { value: '0.5K', label: '512px', creditMultiplier: 0.75 },
            { value: '1K', label: '1024px', creditMultiplier: 1 },
            { value: '2K', label: '2048px', creditMultiplier: 1.5 },
            { value: '4K', label: '4096px', creditMultiplier: 2 },
        ],
        supportsWebSearch: true,
        webSearchCredits: 2,
    },
    "fal-ai/qwen-image-2512": {
        per_image_cents: 2,
        credits: 1,
        version: "v1",
        in_use: true,
        displayName: "Qwen Image",
        description: {
            en: "Better text rendering, finer textures, and realistic human generation.",
            es: "Mejor renderizado de texto, texturas más finas y generación humana realista.",
            ca: "Millor renderitzat de text, textures més fines i generació humana realista.",
        },
        provider: "qwen",
        selectableFor: ["quickGeneration"],
    },
    "fal-ai/bytedance/seedream/v5/lite/text-to-image": {
        per_image_cents: 3.5,
        credits: 2,
        version: "v5",
        in_use: true,
        displayName: "Seedream 5.0 Lite",
        description: {
            en: "ByteDance's fast Lite model. Up to 9MP with web search and reasoning.",
            es: "Modelo Lite rápido de ByteDance. Hasta 9MP con búsqueda web y razonamiento.",
            ca: "Model Lite ràpid de ByteDance. Fins a 9MP amb cerca web i raonament.",
        },
        provider: "bytedance",
        selectableFor: ["quickGeneration"],
    },
    "fal-ai/z-image/turbo": {
        per_image_cents: 1,
        credits: 1,
        version: "v1",
        in_use: true,
        displayName: "Z-Image Turbo",
        description: {
            en: "Lightning fast 6B model by Tongyi.",
            es: "Modelo ultrarrápido de 6B de Tongyi.",
            ca: "Model ultraràpid de 6B de Tongyi.",
        },
        provider: "fal",
        selectableFor: ["quickGeneration"],
    },
    "fal-ai/z-image/turbo/image-to-image": {
        per_image_cents: 1,
        credits: 1,
        version: "v1",
        in_use: true,
        displayName: "Z-Image Turbo Edit",
        description: {
            en: "Fast image-to-image. Adjustable transformation strength.",
            es: "Imagen a imagen rápido. Fuerza de transformación ajustable.",
            ca: "Imatge a imatge ràpid. Força de transformació ajustable.",
        },
        provider: "fal",
        selectableFor: ["fineEdit"],
    },
    "fal-ai/bytedance/seedream/v5/lite/edit": {
        per_image_cents: 3.5,
        credits: 2,
        version: "v5",
        in_use: true,
        displayName: "Seedream 5.0 Lite Edit",
        description: {
            en: "Multi-image editing with natural language. Supports 10 reference images.",
            es: "Edición de múltiples imágenes con lenguaje natural. Soporta 10 imágenes de referencia.",
            ca: "Edició de múltiples imatges amb llenguatge natural. Suporta 10 imatges de referència.",
        },
        provider: "bytedance",
        selectableFor: ["fineEdit"],
    },
    "fal-ai/flux-2/flash/edit": {
        per_image_cents: 1,
        credits: 1,
        version: "v1",
        in_use: true,
        displayName: "Flux 2 Flash Edit",
        description: {
            en: "Ultra-fast Flux editing. Hex color control supported.",
            es: "Edición Flux ultrarrápida. Soporte de control de color hexadecimal.",
            ca: "Edició Flux ultraràpida. Suport de control de color hexadecimal.",
        },
        provider: "flux",
        selectableFor: ["fineEdit"],
    },
    "half-moon-ai/ai-face-swap/faceswapimage": {
        per_image_cents: 1,
        credits: 1,
        version: "v1",
        in_use: true,
        displayName: "Face Swap",
        description: {
            en: "Swap a source face onto a target image with high fidelity.",
            es: "Intercambia un rostro de origen en una imagen objetivo con alta fidelidad.",
            ca: "Intercanvia una cara d'origen en una imatge objectiu amb alta fidelitat.",
        },
        provider: "fal",
        selectableFor: [],
    },
};

export function getSelectableModels(type: SelectableFor): ModelName[] {
    return (Object.entries(FAL_MODEL_COSTS) as [ModelName, ModelConfig][])
        .filter(([_, config]) => config.in_use && config.selectableFor.includes(type))
        .map(([name]) => name);
}

export function getDefaultModel(type: SelectableFor): ModelName {
    const defaults: Record<SelectableFor, ModelName> = {
        quickGeneration: "fal-ai/flux-2",
        fineEdit: "fal-ai/flux-2/edit",
    };
    return defaults[type];
}

export function isKnownModel(model: string | null | undefined): model is ModelName {
    return typeof model === 'string' && model in FAL_MODEL_COSTS;
}

export function resolveModel(model: string | null | undefined, type?: SelectableFor): ModelName {
    if (isKnownModel(model)) {
        if (!type) return model;
        const config = FAL_MODEL_COSTS[model];
        if (config.in_use && config.selectableFor.includes(type)) {
            return model;
        }
    }
    return getDefaultModel(type ?? 'fineEdit');
}

export function getModelDescription(model: ModelName, locale: Locale = 'en'): string {
    const resolved = resolveModel(model);
    return FAL_MODEL_COSTS[resolved].description[locale] || FAL_MODEL_COSTS[resolved].description.en;
}

export function getModelCredits(model: ModelName): number {
    return FAL_MODEL_COSTS[resolveModel(model)].credits;
}

export function getModelCreditsWithOptions(
    model: ModelName,
    options?: { resolution?: ResolutionValue; webSearch?: boolean }
): number {
    const config = FAL_MODEL_COSTS[resolveModel(model)];
    let credits = config.baseCredits ?? config.credits;

    if (options?.resolution && config.resolutionOptions) {
        const resOption = config.resolutionOptions.find(r => r.value === options.resolution);
        if (resOption) credits = Math.ceil(credits * resOption.creditMultiplier);
    }

    if (options?.webSearch && config.supportsWebSearch) {
        credits += config.webSearchCredits ?? 0;
    }

    return credits;
}

export function getModelConfig(model: ModelName): ModelConfig {
    return FAL_MODEL_COSTS[resolveModel(model)];
}