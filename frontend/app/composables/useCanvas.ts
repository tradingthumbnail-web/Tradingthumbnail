import * as fabric from 'fabric';

const _canvas = shallowRef<fabric.Canvas | null>(null);
const _host = shallowRef<HTMLCanvasElement | null>(null);

const backgroundImageKey = 'background-image';

export const useCanvas = () => {
    const { autoClosePath } = useCanvasPath();
    const isCanvasReady = computed(() => !!_canvas.value);

    const setHost = (element: HTMLCanvasElement) => {
        _host.value = element;
    };

    const initCanvas = async (host: HTMLCanvasElement, options: { width?: number, height?: number, isDrawingMode?: boolean } = {}) => {
        if (!host) throw new Error('Host element is required');
        _host.value = host;

        if (_canvas.value) {
            _canvas.value.dispose();
        };

        const WIDTH = options.width ?? 1270;
        const HEIGHT = options.height ?? 720;

        const canvas = new fabric.Canvas(host, {
            width: WIDTH,
            height: HEIGHT,
            enableRetinaScaling: true,
            selection: true,
        });
        canvas.backgroundColor = 'oklch(29.313% 0.000 89.876)';
        canvas.isDrawingMode = options.isDrawingMode ?? true;
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = 12;
        canvas.on('path:created', (e: any) => {
            autoClosePath(e, canvas);
        });
        _canvas.value = canvas;
        canvas.requestRenderAll();
    };

    const saveCanvas = () => {
        if (!_canvas.value) return;
        console.log(_canvas.value.toJSON());
    }

    const clearCanvas = () => {
        if (!_canvas.value) return;
        // Clear all the objects except the background image
        const objects = _canvas.value.getObjects();
        objects.forEach((object) => {
            if (object.get('id') !== backgroundImageKey) {
                _canvas.value?.remove(object);
            }
        });
        _canvas.value.requestRenderAll();
    };

    const setBackgroundImage = async (imageUrl: string) => {
        if (!_canvas.value) return;
        const image = await fabric.FabricImage.fromURL(imageUrl);
        
        const canvasWidth = _canvas.value.width || 1270;
        const canvasHeight = _canvas.value.height || 720;
        
        // Calculate scale to fit image within canvas (like object-fit: contain)
        const scaleX = canvasWidth / (image.width || 1);
        const scaleY = canvasHeight / (image.height || 1);
        const scale = Math.min(scaleX, scaleY);
        
        image.set({
            id: backgroundImageKey,
            scaleX: scale,
            scaleY: scale,
            originX: 'center',
            originY: 'center',
            left: canvasWidth / 2,
            top: canvasHeight / 2,
        });
        
        _canvas.value.backgroundImage = image;
        _canvas.value.requestRenderAll();
    }

    const disposeCanvas = () => {
        _canvas.value?.dispose();
        _canvas.value = null;
    };

    const getPathFromCanvas = () => {
        if (!_canvas.value) return;
        const objects = _canvas.value.getObjects();
        const path = objects.find((object) => object instanceof fabric.Path);
        return path;
    };

    const lockAndCenterBackground = () => {
        if (!_canvas.value) return;
        const canvas = _canvas.value;
        const canvasWidth = canvas.width || 1270;
        const canvasHeight = canvas.height || 720;

        const bgAsObject = canvas.getObjects().find((o: any) => o?.get?.('id') === backgroundImageKey) as fabric.FabricImage | undefined;
        if (!bgAsObject) return;

        canvas.remove(bgAsObject);
        canvas.discardActiveObject();

        const iw = (bgAsObject.width || 1) * (bgAsObject.scaleX || 1);
        const ih = (bgAsObject.height || 1) * (bgAsObject.scaleY || 1);
        const fitScale = Math.min(canvasWidth / iw, canvasHeight / ih);
        const baseScaleX = bgAsObject.scaleX || 1;
        const baseScaleY = bgAsObject.scaleY || 1;

        bgAsObject.set({
            scaleX: baseScaleX * fitScale,
            scaleY: baseScaleY * fitScale,
            originX: 'center',
            originY: 'center',
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            selectable: false,
            evented: false,
            hasControls: false,
            hasBorders: false,
        } as any);

        (canvas as any).backgroundImage = bgAsObject;
        canvas.requestRenderAll();
    };

    return {
        canvas: _canvas,
        isCanvasReady,

        setHost,
        initCanvas,
        setBackgroundImage,
        saveCanvas,
        getPathFromCanvas,
        clearCanvas,
        lockAndCenterBackground,

        disposeCanvas,
    }
};