import * as fabric from 'fabric';

export const useKiThumbsText = () => {
    const TAG = 'kithumbs-text';

    function remove(canvas: fabric.Canvas) {
        canvas.getObjects().forEach(o => {
            if ((o as any).kithumbsTag === TAG) canvas.remove(o);
        });
    }

    function resolvePosition(canvas: fabric.Canvas, w: number, h: number, position: string) {
        const width = canvas.getWidth();
        const height = canvas.getHeight();
        const xMap: Record<string, number> = {
            'left': 40,
            'center': (width - w) / 2,
            'right': width - w - 40,
        };
        const yMap: Record<string, number> = {
            'top': 40,
            'center': (height - h) / 2,
            'bottom': height - h - 40,
        };
        let [v, hpos] = position.split('-');
        if (!hpos) { hpos = v; v = 'center'; }
        if (!v) v = 'center';
        if (!hpos) hpos = 'center';
        const top = yMap[v] ?? yMap['center'];
        const left = xMap[hpos] ?? xMap['center'];
        return { left, top };
    }

    function addHeadline(canvas: fabric.Canvas, text: string, include: boolean, position: string) {
        remove(canvas);
        if (!include || !text?.trim()) {
            canvas.requestRenderAll();
            return;
        }

        const width = canvas.getWidth();
        const maxWidth = Math.max(200, Math.min(Math.round(width * 0.92), width - 80));
        const tmp = new fabric.Textbox(text, { width: maxWidth, fontSize: 72 });
        const dims = { w: maxWidth, h: tmp.height || 100 };
        const coords = resolvePosition(canvas, dims.w, dims.h, position);

        const block = new fabric.Textbox(text, {
            left: coords.left,
            top: coords.top,
            width: maxWidth,
            originX: 'left',
            originY: 'top',
            fontSize: 72,
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            fill: '#111827',
            backgroundColor: '#fde68a',
            textAlign: 'center',
            strokeUniform: true,
            selectable: false,
            hoverCursor: 'default',
        });
        (block as any).kithumbsTag = TAG;
        canvas.add(block);
        canvas.requestRenderAll();
    }

    return { addHeadline };
};


