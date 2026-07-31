import { useCallback, useEffect, useRef } from 'react';
import { clamp } from '../lib/geometry';
import { LOCKED_ASPECT, MAX_NOTE, MIN_NOTE, type Note } from '../types';

interface Args {
  scale: number;
  onDone: (id: string, w: number, h: number) => void;
}

interface Active {
  id: string;
  pointerId: number;
  el: HTMLElement;
  startX: number;
  startY: number;
  note: Note;
  w: number;
  h: number;
}

/** Bottom-right handle resize. Same window-listener approach as dragging, and
 *  for the same reason — see the note in useDragNote. */
export function useResizeNote({ scale, onDone }: Args) {
  const active = useRef<Active | null>(null);

  const scaleRef = useRef(scale);
  const cbs = useRef({ onDone });
  useEffect(() => {
    scaleRef.current = scale;
    cbs.current = { onDone };
  });

  const apply = useCallback((a: Active, clientX: number, clientY: number) => {
    const dx = (clientX - a.startX) / scaleRef.current;
    const dy = (clientY - a.startY) / scaleRef.current;

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
  }, []);

  const finish = useCallback((commit: boolean) => {
    const a = active.current;
    if (!a) return;
    active.current = null;
    document.body.classList.remove('is-dragging');

    if (!commit) {
      a.el.style.width = `${a.note.w}px`;
      a.el.style.height = `${a.note.h}px`;
      return;
    }
    cbs.current.onDone(a.id, Math.round(a.w), Math.round(a.h));
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const a = active.current;
      if (!a || e.pointerId !== a.pointerId) return;
      if (e.buttons === 0) {
        finish(true);
        return;
      }
      apply(a, e.clientX, e.clientY);
    };

    const onUp = (e: PointerEvent) => {
      if (active.current?.pointerId === e.pointerId) finish(true);
    };

    const onCancel = (e: PointerEvent) => {
      if (active.current?.pointerId === e.pointerId) finish(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [apply, finish]);

  const onPointerDown = useCallback((e: React.PointerEvent, note: Note) => {
    if (e.button !== 0 || active.current) return;
    // Stop the note underneath from starting a drag at the same time.
    e.stopPropagation();

    const el = (e.currentTarget as HTMLElement).closest('.note') as HTMLElement | null;
    if (!el) return;
    active.current = {
      id: note.id,
      pointerId: e.pointerId,
      el,
      startX: e.clientX,
      startY: e.clientY,
      note,
      w: note.w,
      h: note.h,
    };
    document.body.classList.add('is-dragging');
  }, []);

  return { onPointerDown };
}
