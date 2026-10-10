import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { stringPath, tiePoint } from '../lib/strings';
import type { Note } from '../types';

interface Args {
  /** The in-progress string, drawn by StringLayer and steered from here. */
  liveRef: RefObject<SVGPathElement>;
  /** Screen point to wall units. */
  toWall: (clientX: number, clientY: number) => { x: number; y: number } | null;
  onTie: (a: string, b: string) => void;
}

/**
 * String tool: press on one note, pull to another, let go. The loose end
 * follows the pointer by direct DOM writes; the tie only reaches state on
 * release, and only if it landed on a different note.
 */
export function useTieString({ liveRef, toWall, onTie }: Args) {
  const active = useRef<{ from: Note; pointerId: number } | null>(null);
  const cbs = useRef({ toWall, onTie });
  useEffect(() => {
    cbs.current = { toWall, onTie };
  });

  const end = useCallback(() => {
    active.current = null;
    liveRef.current?.setAttribute('d', '');
    document.body.classList.remove('is-dragging');
  }, [liveRef]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const a = active.current;
      if (!a || e.pointerId !== a.pointerId) return;
      const p = cbs.current.toWall(e.clientX, e.clientY);
      if (p) liveRef.current?.setAttribute('d', stringPath(tiePoint(a.from), p));
    };

    const onUp = (e: PointerEvent) => {
      const a = active.current;
      if (!a || e.pointerId !== a.pointerId) return;
      const hit = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>('[data-note-id]')?.dataset.noteId;
      end();
      if (hit && hit !== a.from.id) cbs.current.onTie(a.from.id, hit);
    };

    const onCancel = (e: PointerEvent) => {
      if (active.current?.pointerId === e.pointerId) end();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [end, liveRef]);

  const onPointerDown = useCallback((e: React.PointerEvent, note: Note) => {
    if (e.button !== 0 || active.current) return;
    active.current = { from: note, pointerId: e.pointerId };
    document.body.classList.add('is-dragging');
  }, []);

  return { onPointerDown };
}
