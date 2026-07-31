import { useCallback, useRef } from 'react';
import { clampToWall, isOffWall, toWallUnits } from '../lib/geometry';
import type { Note } from '../types';

interface Args {
  scale: number;
  onGrab: (id: string) => void;
  onDrop: (id: string, x: number, y: number) => void;
  onDropOff: (id: string) => void;
}

/**
 * Pointer-capture drag. During the gesture we write `transform` straight to the
 * DOM node and never touch React state — that is what keeps dragging smooth
 * with a hundred notes on the wall. State is updated once, on pointerup.
 */
export function useDragNote({ scale, onGrab, onDrop, onDropOff }: Args) {
  const active = useRef<{
    id: string;
    el: HTMLElement;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    note: Note;
    x: number;
    y: number;
    off: boolean;
    moved: boolean;
  } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, note: Note) => {
      if (e.button !== 0) return;
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
      active.current = {
        id: note.id,
        el,
        startX: e.clientX,
        startY: e.clientY,
        originX: note.x,
        originY: note.y,
        note,
        x: note.x,
        y: note.y,
        off: false,
        moved: false,
      };
      el.classList.add('is-lifted');
      onGrab(note.id);
    },
    [onGrab],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const a = active.current;
      if (!a) return;
      const { dx, dy } = toWallUnits(e.clientX - a.startX, e.clientY - a.startY, scale);
      if (!a.moved && Math.hypot(dx, dy) > 2) a.moved = true;

      const raw = { x: a.originX + dx, y: a.originY + dy };
      const off = isOffWall(raw.x, raw.y, a.note.w, a.note.h);
      const next = off ? raw : clampToWall(raw.x, raw.y, a.note.w, a.note.h);

      a.x = next.x;
      a.y = next.y;
      if (off !== a.off) {
        a.off = off;
        a.el.classList.toggle('is-peeling', off);
      }
      a.el.style.transform = `translate(${next.x}px, ${next.y}px) rotate(${a.note.rotation}deg)`;
    },
    [scale],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const a = active.current;
      if (!a) return;
      active.current = null;
      a.el.releasePointerCapture(e.pointerId);
      a.el.classList.remove('is-lifted', 'is-peeling');

      if (a.off) {
        onDropOff(a.id);
      } else if (a.moved) {
        onDrop(a.id, a.x, a.y);
      }
    },
    [onDrop, onDropOff],
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}
