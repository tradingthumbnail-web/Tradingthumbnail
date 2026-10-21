export const toolTypes = ["AVATAR", "IMAGE"] as const;
export const toolCategories = ["ENHANCEMENT", "STYLIZATION", "AVATAR", "COMPOSITION", "GRAPHICS"] as const;
export const toolStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export type ToolType = typeof toolTypes[number];
export type ToolCategory = typeof toolCategories[number];
export type ToolStatus = typeof toolStatuses[number];