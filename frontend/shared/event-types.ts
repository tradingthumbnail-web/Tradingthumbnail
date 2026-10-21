export type EventType = typeof eventTypes[number];
export const eventTypes = [
    "branch.created",
    "branch.updated",
    "branch.deleted",

    "image.quick-generation.generated",
    "image.quick-thumb.generated",
    "image.background.generated",
    "image.inpainting.generated",
    "image.change-face.generated",
    "image.face-swap.generated",
    "image.image-to-image.generated",
    "image.characters.generated",
    "image.backgrounds.generated",
    "image.portrait-mode.generated",
    "image.fine-edit.generated",
    "image.outpainting.generated",
    "image.generated",
    "image.deleted",

    "text.added",
    "text.deleted",

    "avatar.created",
    "avatar.updated",
    "avatar.deleted",

    "style.created",
    "style.updated",
    "style.deleted",

    "project.created",
    "project.updated",
    "project.deleted",

    "pipeline.generated",
] as const;