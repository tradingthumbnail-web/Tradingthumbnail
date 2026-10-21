import { describe, it, expect } from 'vitest';

function shouldLockAndCenterOnToolSwitch(oldTool: string, newTool: string): boolean {
    return oldTool === 'outpainting' && newTool !== 'outpainting';
}

describe('Editor outpainting tool switch logic', () => {
    it('returns true when switching from outpainting to change-face', () => {
        expect(shouldLockAndCenterOnToolSwitch('outpainting', 'change-face')).toBe(true);
    });

    it('returns true when switching from outpainting to inpainting', () => {
        expect(shouldLockAndCenterOnToolSwitch('outpainting', 'inpainting')).toBe(true);
    });

    it('returns true when switching from outpainting to face-swap', () => {
        expect(shouldLockAndCenterOnToolSwitch('outpainting', 'face-swap')).toBe(true);
    });

    it('returns false when switching from change-face to inpainting', () => {
        expect(shouldLockAndCenterOnToolSwitch('change-face', 'inpainting')).toBe(false);
    });

    it('returns false when switching to outpainting', () => {
        expect(shouldLockAndCenterOnToolSwitch('inpainting', 'outpainting')).toBe(false);
    });

    it('returns false when staying on outpainting', () => {
        expect(shouldLockAndCenterOnToolSwitch('outpainting', 'outpainting')).toBe(false);
    });
});