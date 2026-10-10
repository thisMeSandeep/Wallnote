import { useEffect, type RefObject } from 'react';
import { WALL_W } from '../types';

/** How quickly the beam catches up with the pointer, per frame. */
const FOLLOW = 0.32;

/**
 * In the dark, the pointer carries a torch. The beam is a hole in the
 * darkness layers (see light.css), positioned by CSS variables written
 * straight to the DOM — the same trick dragging uses, so moving the torch
 * never re-renders React.
 *
 * The beam trails the pointer slightly, like a hand-held light rather than a
 * cursor.
 */
export function useTorch(
  frameRef: RefObject<HTMLDivElement>,
  wallRef: RefObject<HTMLDivElement>,
  active: boolean,
) {
  useEffect(() => {
    const frame = frameRef.current;
    const wall = wallRef.current;
    if (!frame || !wall || !active) return;

    let target: { x: number; y: number } | null = null;
    let beam: { x: number; y: number } | null = null;
    let raf = 0;

    const paint = () => {
      raf = 0;
      if (!target || !beam) return;
      beam.x += (target.x - beam.x) * FOLLOW;
      beam.y += (target.y - beam.y) * FOLLOW;

      // The room's darkness is in frame pixels; the wall's is in wall units.
      const f = frame.getBoundingClientRect();
      const w = wall.getBoundingClientRect();
      const scale = w.width / WALL_W;
      frame.style.setProperty('--torch-fx', `${beam.x - f.left}px`);
      frame.style.setProperty('--torch-fy', `${beam.y - f.top}px`);
      wall.style.setProperty('--torch-wx', `${(beam.x - w.left) / scale}px`);
      wall.style.setProperty('--torch-wy', `${(beam.y - w.top) / scale}px`);

      if (Math.hypot(target.x - beam.x, target.y - beam.y) > 0.5) {
        raf = requestAnimationFrame(paint);
      }
    };

    const onMove = (e: PointerEvent) => {
      target = { x: e.clientX, y: e.clientY };
      beam ??= { ...target };
      // A data attribute rather than a class: React owns className and
      // would wipe it on the next render.
      frame.dataset.torch = 'on';
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      target = beam = null;
      delete frame.dataset.torch;
    };

    frame.addEventListener('pointermove', onMove);
    frame.addEventListener('pointerleave', onLeave);
    return () => {
      frame.removeEventListener('pointermove', onMove);
      frame.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
      delete frame.dataset.torch;
    };
  }, [frameRef, wallRef, active]);
}
