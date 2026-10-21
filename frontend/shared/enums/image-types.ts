export const imageTypes = ['BACKGROUND', 'CHARACTER', 'GENERATION', 'THUMBNAIL', 'SKETCH'] as const;
export type ImageType = typeof imageTypes[number];