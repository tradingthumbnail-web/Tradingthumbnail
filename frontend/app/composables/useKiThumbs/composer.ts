import * as fabric from 'fabric';
import { useKiThumbsLayout } from './layout';
import { useKiThumbsText } from './text';
import { useKiThumbsAvatar } from './avatar';

type QuickThumbForm = {
  title: string;
  includeText: boolean;
  textHeadline: string;
  textPosition: string;
  layout: string;
  includeAvatar: boolean;
  avatarPosition: string;
};

export const useKiThumbsComposer = () => {
  const { applyLayout } = useKiThumbsLayout();
  const { addHeadline } = useKiThumbsText();
  const { addAvatarPlaceholder } = useKiThumbsAvatar();

  function clearCanvas(canvas: fabric.Canvas) {
    const objects = canvas.getObjects();
    objects.forEach((o) => {
      if (o === canvas.backgroundImage) return;
      canvas.remove(o);
    });
  }

  async function composeThumbnail(canvas: fabric.Canvas, form: QuickThumbForm) {
    clearCanvas(canvas);

    applyLayout(canvas, form.layout);

    await addAvatarPlaceholder(canvas, form.includeAvatar, form.avatarPosition);

    addHeadline(canvas, form.textHeadline, form.includeText, form.textPosition);

    canvas.requestRenderAll();
  }

  return { composeThumbnail };
};