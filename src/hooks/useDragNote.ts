import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { sound } from '../lib/audio';
import { clampToWall, isOffWall, toWallUnits } from '../lib/geometry';
import type { Note } from '../types';

interface Args {
  scale: number;
  /** Dropping onto the bin takes a note down even while it's over the wall. */
  binRef: RefObject<HTMLElement>;
  /** Every frame of the drag, so whatever's tied to the note can follow. */
  onMove: (id: string, x: number, y: number) => void;
  onDrop: (id: string, x: number, y: number) => void;
  onDropOff: (id: string) => void;
  /** Pressed and released without moving: a click, not a drag. */
  onTap: (id: string) => void;
}

/** Slack around the basket for the pointer, in screen pixels. */
const BIN_REACH = 28;
/** Share of the basket the dragged note has to cover to count. */
const BIN_COVER = 0.3;

/**
 * Generous on purpose. People aim the note at the bin, not the cursor — grab
 * a sheet by its corner and drop the paper over the basket and the pointer
 * can be well off it. So covering a good part of the basket counts, as does
 * the pointer getting anywhere near it.
 */
function isOverBin(bin: HTMLElement | null, note: HTMLElement, x: number, y: number): boolean {
  if (!bin) return false;
  const b = bin.getBoundingClientRect();
  if (
    x >= b.left - BIN_REACH &&
    x <= b.right + BIN_REACH &&
    y >= b.top - BIN_REACH &&
    y <= b.bottom + BIN_REACH
  ) {
    return true;
  }
  const n = note.getBoundingClientRect();
  const w = Math.min(n.right, b.right) - Math.max(n.left, b.left);
  const h = Math.min(n.bottom, b.bottom) - Math.max(n.top, b.top);
  return w > 0 && h > 0 && (w * h) / (b.width * b.height) >= BIN_COVER;
}

interface Active {
  id: string;
  pointerId: number;
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
}

/**
 * Pointer drag. During the gesture we write `transform` straight to the DOM
 * node and never touch React state — that is what keeps dragging smooth with a
 * hundred notes on the wall. State updates once, on release.
 *
 * Move/up listeners live on `window` rather than on the note. Per-note
 * `onPointerMove` fires on plain hover with no button held, so a gesture that
 * ended without its `pointerup` (a `pointercancel`, a release outside the
 * window, the note unmounting) would leave the drag record live and let a
 * later hover over *any* note resume dragging the stale one.
 */
export function useDragNote({ scale, binRef, onMove, onDrop, onDropOff, onTap }: Args) {
  const active = useRef<Active | null>(null);

  // Window listeners are attached once and must not close over stale props.
  const scaleRef = useRef(scale);
  const cbs = useRef({ onMove, onDrop, onDropOff, onTap });
  useEffect(() => {
    scaleRef.current = scale;
    cbs.current = { onMove, onDrop, onDropOff, onTap };
  });

  const apply = useCallback((a: Active, clientX: number, clientY: number) => {
    const { dx, dy } = toWallUnits(clientX - a.startX, clientY - a.startY, scaleRef.current);
    if (!a.moved && Math.hypot(dx, dy) > 2) {
      a.moved = true;
      // Only once the note actually leaves its spot — a click that merely
      // selects shouldn't rustle.
      sound.play('lift');
      // The bin perks up for the length of any drag, so it reads as a place
      // the note can go before you're anywhere near it.
      binRef.current?.classList.add('is-ready');
    }

    const raw = { x: a.originX + dx, y: a.originY + dy };
    const overBin = isOverBin(binRef.current, a.el, clientX, clientY);
    binRef.current?.classList.toggle('is-hungry', overBin);
    const off = overBin || isOffWall(raw.x, raw.y, a.note.w, a.note.h);
    const next = off ? raw : clampToWall(raw.x, raw.y, a.note.w, a.note.h);

    a.x = next.x;
    a.y = next.y;
    if (off !== a.off) {
      a.off = off;
      a.el.classList.toggle('is-peeling', off);
    }
    a.el.style.transform = `translate(${next.x}px, ${next.y}px) rotate(${a.note.rotation}deg)`;
    cbs.current.onMove(a.id, next.x, next.y);
  }, [binRef]);

  /** Ends the gesture. `commit: false` abandons it and restores the note. */
  const finish = useCallback((commit: boolean) => {
    const a = active.current;
    if (!a) return;
    active.current = null;
    a.el.classList.remove('is-lifted', 'is-peeling');
    binRef.current?.classList.remove('is-hungry', 'is-ready');
    document.body.classList.remove('is-dragging');

    if (!commit) {
      // Put it back where it started — a cancelled drag shouldn't move anything.
      a.el.style.transform = `translate(${a.originX}px, ${a.originY}px) rotate(${a.note.rotation}deg)`;
      cbs.current.onMove(a.id, a.originX, a.originY);
      return;
    }
    if (a.off) {
      // The crumple makes its own noise.
      cbs.current.onDropOff(a.id);
    } else if (a.moved) {
      sound.play('place');
      cbs.current.onDrop(a.id, a.x, a.y);
    } else {
      cbs.current.onTap(a.id);
    }
  }, [binRef]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const a = active.current;
      if (!a || e.pointerId !== a.pointerId) return;
      // The button was released somewhere we never heard about. Settle up here
      // rather than letting the gesture linger.
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

  const onPointerDown = useCallback(
    (e: React.PointerEvent, note: Note) => {
      if (e.button !== 0) return;
      // A second pointer landing mid-drag must not hijack the first.
      if (active.current) return;

      const el = e.currentTarget as HTMLElement;
      active.current = {
        id: note.id,
        pointerId: e.pointerId,
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
      // Without pointer capture, a fast drag would otherwise start selecting
      // text across the toolbar and panel.
      document.body.classList.add('is-dragging');
    },
    [],
  );

  return { onPointerDown };
}
