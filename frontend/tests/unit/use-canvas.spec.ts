// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockRemove = vi.fn();
const mockDiscardActiveObject = vi.fn();
const mockRequestRenderAll = vi.fn();
const mockGetObjects = vi.fn(() => []);
const mockGetWidth = vi.fn(() => 1270);
const mockGetHeight = vi.fn(() => 720);

const createMockBgObject = (overrides: Record<string, unknown> = {}) => ({
    get: mockGet,
    set: mockSet,
    width: 800,
    height: 600,
    scaleX: 1,
    scaleY: 1,
    left: 400,
    top: 300,
    ...overrides,
});

const mockCanvasInstance = {
    getObjects: mockGetObjects,
    remove: mockRemove,
    discardActiveObject: mockDiscardActiveObject,
    requestRenderAll: mockRequestRenderAll,
    on: vi.fn(),
    off: vi.fn(),
    dispose: vi.fn(),
    width: 1270,
    height: 720,
    getWidth: mockGetWidth,
    getHeight: mockGetHeight,
    backgroundColor: '',
    isDrawingMode: false,
    freeDrawingBrush: null,
};

vi.mock('fabric', () => ({
    Canvas: class {
        constructor() {
            return mockCanvasInstance;
        }
    },
    FabricImage: {
        fromURL: vi.fn().mockResolvedValue(createMockBgObject()),
    },
    PencilBrush: class {
        constructor() {
            return { width: 12 };
        }
    },
    Path: class {},
}));

describe('useCanvas', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        mockGet.mockImplementation((key: string) => (key === 'id' ? 'background-image' : undefined));
        vi.stubGlobal('useCanvasPath', () => ({ autoClosePath: vi.fn() }));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('lockAndCenterBackground', () => {
        it('does nothing when canvas has no background image in objects', async () => {
            const { useCanvas } = await import('~~/app/composables/useCanvas');
            mockGetObjects.mockReturnValue([]);

            const { lockAndCenterBackground, initCanvas, setHost, disposeCanvas } = useCanvas();
            const host = document.createElement('canvas');
            setHost(host);
            await initCanvas(host, { isDrawingMode: false });

            lockAndCenterBackground();

            expect(mockRemove).not.toHaveBeenCalled();
            expect(mockSet).not.toHaveBeenCalled();
            disposeCanvas();
        });

        it('moves background from objects to backgroundImage and centers when background is in objects', async () => {
            const { useCanvas } = await import('~~/app/composables/useCanvas');
            const mockBg = createMockBgObject({ scaleX: 1.5, scaleY: 1.5 });
            mockGet.mockImplementation((key: string) => (key === 'id' ? 'background-image' : undefined));
            mockGetObjects.mockReturnValue([mockBg]);

            const { lockAndCenterBackground, initCanvas, setHost, disposeCanvas } = useCanvas();
            const host = document.createElement('canvas');
            setHost(host);
            await initCanvas(host, { isDrawingMode: false });

            lockAndCenterBackground();

            expect(mockRemove).toHaveBeenCalledWith(mockBg);
            expect(mockDiscardActiveObject).toHaveBeenCalled();
            expect(mockSet).toHaveBeenCalledWith(
                expect.objectContaining({
                    originX: 'center',
                    originY: 'center',
                    left: 635,
                    top: 360,
                    selectable: false,
                    evented: false,
                    hasControls: false,
                    hasBorders: false,
                })
            );
            expect((mockCanvasInstance as any).backgroundImage).toBe(mockBg);
            expect(mockRequestRenderAll).toHaveBeenCalled();
            disposeCanvas();
        });
    });
});