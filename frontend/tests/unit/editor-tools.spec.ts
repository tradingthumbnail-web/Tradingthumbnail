import { describe, it, expect } from 'vitest';
import { toolButtons, isDrawingTool, shouldLockAndCenterOnToolSwitch } from '~~/app/composables/editor-tools';

const TOOLS = toolButtons.map(tool => tool.id);

describe('Editor tools', () => {
    describe('tool list', () => {
        it('has all 6 tools', () => {
            expect(TOOLS).toHaveLength(6);
        });

        it('includes change-face, face-swap, inpainting, chat-edition, add-text, outpainting', () => {
            expect(TOOLS).toContain('change-face');
            expect(TOOLS).toContain('face-swap');
            expect(TOOLS).toContain('inpainting');
            expect(TOOLS).toContain('chat-edition');
            expect(TOOLS).toContain('add-text');
            expect(TOOLS).toContain('outpainting');
        });
    });

    describe('drawing mode', () => {
        it('change-face is a drawing tool', () => {
            expect(isDrawingTool('change-face')).toBe(true);
        });

        it('inpainting is a drawing tool', () => {
            expect(isDrawingTool('inpainting')).toBe(true);
        });

        it('face-swap is not a drawing tool', () => {
            expect(isDrawingTool('face-swap')).toBe(false);
        });

        it('add-text is not a drawing tool', () => {
            expect(isDrawingTool('add-text')).toBe(false);
        });

        it('outpainting is not a drawing tool', () => {
            expect(isDrawingTool('outpainting')).toBe(false);
        });

        it('chat-edition is not a drawing tool', () => {
            expect(isDrawingTool('chat-edition')).toBe(false);
        });
    });

    describe('outpainting tool switch', () => {
        it('locks and centers when switching from outpainting to change-face', () => {
            expect(shouldLockAndCenterOnToolSwitch('outpainting', 'change-face')).toBe(true);
        });

        it('locks and centers when switching from outpainting to inpainting', () => {
            expect(shouldLockAndCenterOnToolSwitch('outpainting', 'inpainting')).toBe(true);
        });

        it('does not lock when switching from inpainting to outpainting', () => {
            expect(shouldLockAndCenterOnToolSwitch('inpainting', 'outpainting')).toBe(false);
        });

        it('does not lock when staying on outpainting', () => {
            expect(shouldLockAndCenterOnToolSwitch('outpainting', 'outpainting')).toBe(false);
        });
    });
});
