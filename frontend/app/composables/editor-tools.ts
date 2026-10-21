export const tools = ['change-face', 'face-swap', 'inpainting', 'chat-edition', 'add-text', 'outpainting'] as const;
export type Tool = (typeof tools)[number];

export const NOT_DRAWING_TOOLS: Tool[] = ['add-text', 'outpainting', 'face-swap', 'chat-edition'];

export const toolButtons = [
    { id: 'change-face' as Tool, icon: 'lucide:scan-face', labelKey: 'editor.changeFace' },
    { id: 'face-swap' as Tool, icon: 'lucide:shuffle', labelKey: 'editor.faceSwap' },
    { id: 'inpainting' as Tool, icon: 'lucide:brush-cleaning', labelKey: 'editor.inpainting' },
    { id: 'chat-edition' as Tool, icon: 'lucide:message-circle', labelKey: 'editor.chatEdition' },
    { id: 'add-text' as Tool, icon: 'lucide:text-cursor', labelKey: 'editor.addText' },
    { id: 'outpainting' as Tool, icon: 'lucide:expand', labelKey: 'editor.outpainting' },
];

export function isDrawingTool(tool: Tool): boolean {
    return !NOT_DRAWING_TOOLS.includes(tool);
}

export function shouldLockAndCenterOnToolSwitch(from: Tool, to: Tool): boolean {
    return from === 'outpainting' && to !== 'outpainting';
}