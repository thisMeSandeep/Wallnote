import { useCallback, useRef } from 'react';
import { clamp } from '../lib/geometry';
import { LOCKED_ASPECT, MAX_NOTE, MIN_NOTE, type Note } from '../types';

interface Args {
  scale: number;
  onDone: (id: string, w: number, h: number) => void;
}

/** Bottom-right handle resize. Same direct-DOM approach as dragging. */
export function useResizeNote({ scale, onDone }: Args) {
  const active = useRef<{
    id: string;
    el: HTMLElement;
    startX: number;
    startY: number;
    note: Note;
    w: number;
    h: number;
  } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent, note: Note) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const handle = e.currentTarget as HTMLElement;
    const el = handle.closest('.note') as HTMLElement | null;
    if (!el) return;
    handle.setPointerCapture(e.pointerId);
    active.current = {
      id: note.id,
      el,
      startX: e.clientX,
      startY: e.clientY,
      note,
      w: note.w,
      h: note.h,
    };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const a = active.current;
      if (!a) return;
      const dx = (e.clientX - a.startX) / scale;
      const dy = (e.clientY - a.startY) / scale;

      let w = clamp(a.note.w + dx, MIN_NOTE, MAX_NOTE);
      let h = clamp(a.note.h + dy, MIN_NOTE, MAX_NOTE);

      if (LOCKED_ASPECT.includes(a.note.shape)) {
        // Drive the locked pair off whichever axis the pointer moved more,
        // then clamp the driver so the follower can't escape its bounds.
        const ratio = a.note.w / a.note.h;
        if (Math.abs(dx) >= Math.abs(dy)) {
          w = clamp(w, MIN_NOTE, Math.min(MAX_NOTE, MAX_NOTE * ratio));
          h = w / ratio;
        } else {
          h = clamp(h, MIN_NOTE, Math.min(MAX_NOTE, MAX_NOTE / ratio));
          w = h * ratio;
        }
      }

      a.w = w;
      a.h = h;
      a.el.style.width = `${w}px`;
      a.el.style.height = `${h}px`;
    },
    [scale],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const a = active.current;
      if (!a) return;
      active.current = null;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      onDone(a.id, Math.round(a.w), Math.round(a.h));
    },
    [onDone],
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}
