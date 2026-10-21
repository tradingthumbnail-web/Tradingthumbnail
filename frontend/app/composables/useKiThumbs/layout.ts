import * as fabric from 'fabric';

type DefaultLayoutKind = 'centered-face' | 'split-screen' | 'object-focus' | 'background-blur' | 'before-after' | 'close-up' | string;

export const useKiThumbsLayout = () => {
    const LAYER_TAG = 'kithumbs-layout';
    const COLOR_GUIDE_BACKGROUND = '#e5e7eb';

    function removePreviousLayout(canvas: fabric.Canvas) {
        const objects = canvas.getObjects();
        objects.forEach((obj) => {
            if ((obj as any).kithumbsTag === LAYER_TAG) {
                canvas.remove(obj);
            }
        });
    };

    const circlePlaceholder = (canvas: fabric.Canvas, radius: number) => {
        const width = canvas.getWidth();
        const height = canvas.getHeight();
        const circle = new fabric.Circle({
            left: width / 2 - radius,
            top: height / 2 - radius,
            radius,
            fill: COLOR_GUIDE_BACKGROUND,
            selectable: false,
            hoverCursor: 'default',
        });
        (circle as any).kithumbsTag = LAYER_TAG;
        return circle;
    };

    const textPlaceholder = (canvas: fabric.Canvas, text: string, options?: { top?: number, left?: number }) => {
        const width = canvas.getWidth();
        const height = canvas.getHeight();
        const textbox = new fabric.Textbox(text, {
            left: options?.left ?? width / 2,
            top: options?.top ?? height / 2,
            originX: 'center',
            originY: 'center',
            fontSize: 54,
            textAlign: 'center',
            selectable: false,
            hoverCursor: 'default',
            backgroundColor: COLOR_GUIDE_BACKGROUND,
        });
        (textbox as any).kithumbsTag = LAYER_TAG;
        return textbox;
    };

    function addSplitScreen(canvas: fabric.Canvas) {
        const width = canvas.getWidth();
        const height = canvas.getHeight();
        const padding = width * 0.25;

        const left = textPlaceholder(canvas, 'Scene 1', { top: height / 2, left: width / 2 - padding });
        const right = textPlaceholder(canvas, 'Scene 2', { top: height / 2, left: (width / 2) + padding });

        const divider = new fabric.Rect({
            left: width / 2 - 2,
            top: 0,
            width: 4,
            height: height,
            fill: COLOR_GUIDE_BACKGROUND,
            selectable: false,
            hoverCursor: 'default',
        });
        (divider as any).kithumbsTag = LAYER_TAG;

        canvas.add(divider, left, right);
    }

    function addCenteredFaceGuides(canvas: fabric.Canvas) {
        const width = canvas.getWidth();
        const height = canvas.getHeight();

        const radius = Math.min(width, height) * 0.28;
        const circle = circlePlaceholder(canvas, radius);
        const text = textPlaceholder(canvas, 'Avatar');
        
        canvas.add(circle, text);
    }

    function addObjectFocusGuides(canvas: fabric.Canvas) {
        const width = canvas.getWidth();
        const height = canvas.getHeight();
        
        const radius = Math.min(width, height) * 0.28;
        const circle = circlePlaceholder(canvas, radius);
        const objectTextPlaceholder = textPlaceholder(canvas, 'Object');
        
        canvas.add(circle, objectTextPlaceholder);
    }

    function addBeforeAndAfterGuides(canvas: fabric.Canvas) {
        const width = canvas.getWidth();
        const height = canvas.getHeight();
        
        const padding = width * 0.25;
        const before = textPlaceholder(canvas, 'Before', { top: height / 2, left: width / 2 - padding });
        const after = textPlaceholder(canvas, 'After', { top: height / 2, left: (width / 2) + padding });
        
        canvas.add(before, after);
    }

    function addCloseUpGuides(canvas: fabric.Canvas) {
        const width = canvas.getWidth();
        const height = canvas.getHeight();
        
        const radius = Math.min(width, height) * 0.55;
        const circle = circlePlaceholder(canvas, radius);
        const closeUpTextPlaceholder = textPlaceholder(canvas, 'Close-up', { top: height / 2, left: width / 2 });
        
        canvas.add(circle, closeUpTextPlaceholder);
    }

    function applyLayout(canvas: fabric.Canvas, layout: DefaultLayoutKind) {
        removePreviousLayout(canvas);

        switch (layout) {
            case 'split-screen':
                addSplitScreen(canvas);
                break;
            case 'centered-face':
                addCenteredFaceGuides(canvas);
                break;
            case 'object-focus':
                addObjectFocusGuides(canvas);
                break;
            case 'before-after':
                addBeforeAndAfterGuides(canvas);
                break;
            case 'close-up':
                addCloseUpGuides(canvas);
                break;
            default:
                const width = canvas.getWidth();
                const height = canvas.getHeight();
                const placeholder = new fabric.Textbox('Main area', {
                    left: width / 2,
                    top: height / 2,
                    width: Math.min(800, width - 80),
                    originX: 'center',
                    originY: 'center',
                    fontSize: 54,
                    textAlign: 'center',
                    backgroundColor: COLOR_GUIDE_BACKGROUND,
                    fill: '#000',
                });
                (placeholder as any).kithumbsTag = LAYER_TAG;
                canvas.add(placeholder);
                break;
        }

        canvas.requestRenderAll();
    }

    return { applyLayout };
};


