import * as fabric from 'fabric';

export const useKiThumbsAvatar = () => {
    const LAYER_TAG = 'kithumbs-avatar';

    function remove(canvas: fabric.Canvas) {
        canvas.getObjects().forEach(o => {
            if ((o as any).kithumbsTag === LAYER_TAG) canvas.remove(o);
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

    async function addAvatarPlaceholder(canvas: fabric.Canvas, enabled: boolean, position: string) {
        remove(canvas);
        if (!enabled) {
            canvas.requestRenderAll();
            return;
        }

        const result = await fabric.loadSVGFromURL('/img/user.svg');
        const objs = result.objects as fabric.FabricObject[];
        const svg = fabric.util.groupSVGElements(objs, result.options);
        const width = canvas.getWidth();
        const targetWidth = Math.min(240, width * 0.25);
        svg.scaleToWidth(targetWidth);
        const w = svg.getScaledWidth();
        const h = svg.getScaledHeight();
        const coords = resolvePosition(canvas, w, h, position);
        svg.set(coords as any);
        svg.selectable = false;
        svg.hoverCursor = 'default';
        (svg as any).kithumbsTag = LAYER_TAG;
        canvas.add(svg);
        canvas.requestRenderAll();
    }

    return { addAvatarPlaceholder };
};


