import { useCallback, useEffect, useRef } from 'react';
import { newId } from '../lib/id';
import { bboxMisses, bboxOf, pathFromPoints, round, strokeHit, type BBox } from '../lib/ink';
import {
  ERASER_RADIUS,
  MIN_SAMPLE_GAP,
  WALL_H,
  WALL_W,
  type Stroke,
  type ToolMode,
} from '../types';

interface Args {
  mode: ToolMode;
  color: string;
  width: number;
  strokes: Stroke[];
  onStroke: (stroke: Stroke) => void;
  onErase: (ids: string[]) => void;
}

interface Active {
  pointerId: number;
  svg: SVGSVGElement;
  /** Drawing only: the live path being extended, outside React. */
  live: SVGPathElement | null;
  points: number[];
  /** Erasing only: strokes marked for removal this gesture. */
  erased: Set<string>;
  erasing: boolean;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Freehand drawing and erasing on the wall surface.
 *
 * Follows the same shape as useDragNote: the in-progress stroke is written
 * straight into the DOM and only committed to state on release, so a long
 * stroke costs one render rather than one per sample. Move/up/cancel live on
 * `window` for the same reason they do there — a gesture that ends off-target
 * must not be left running.
 */
export function useDraw({ mode, color, width, strokes, onStroke, onErase }: Args) {
  const active = useRef<Active | null>(null);

  // Window listeners are attached once; everything they need is read via refs.
  const cfg = useRef({ mode, color, width, strokes, onStroke, onErase });
  useEffect(() => {
    cfg.current = { mode, color, width, strokes, onStroke, onErase };
  });

  /** Bounding boxes for the current gesture, so erase hit-tests stay cheap. */
  const boxes = useRef(new Map<string, BBox>());

  /** Client coords → wall units, derived from the SVG's own box. */
  const toWall = useCallback((svg: SVGSVGElement, clientX: number, clientY: number) => {
    const r = svg.getBoundingClientRect();
    return {
      x: round(((clientX - r.left) / r.width) * WALL_W),
      y: round(((clientY - r.top) / r.height) * WALL_H),
    };
  }, []);

  const eraseAt = useCallback((a: Active, x: number, y: number) => {
    for (const s of cfg.current.strokes) {
      if (a.erased.has(s.id)) continue;

      let box = boxes.current.get(s.id);
      if (!box) {
        box = bboxOf(s.points);
        boxes.current.set(s.id, box);
      }
      const reach = ERASER_RADIUS + s.width / 2;
      if (bboxMisses(box, x, y, reach)) continue;
      if (!strokeHit(s.points, s.width, x, y, ERASER_RADIUS)) continue;

      a.erased.add(s.id);
      // Hide it now; state catches up on release so the whole rub is one undo.
      const el = a.svg.querySelector<SVGPathElement>(`[data-stroke="${s.id}"]`);
      if (el) el.style.display = 'none';
    }
  }, []);

  const extend = useCallback((a: Active, x: number, y: number) => {
    const n = a.points.length;
    const lastX = a.points[n - 2];
    const lastY = a.points[n - 1];
    // Thinning: dense samples bloat the saved wall without being visible.
    if (Math.hypot(x - lastX, y - lastY) < MIN_SAMPLE_GAP) return;

    a.points.push(x, y);
    a.live?.setAttribute('d', pathFromPoints(a.points));
  }, []);

  const finish = useCallback((commit: boolean) => {
    const a = active.current;
    if (!a) return;
    active.current = null;
    boxes.current.clear();
    document.body.classList.remove('is-dragging');

    if (a.erasing) {
      if (commit && a.erased.size > 0) {
        cfg.current.onErase([...a.erased]);
      } else if (!commit) {
        // Cancelled: put back anything we optimistically hid.
        for (const id of a.erased) {
          const el = a.svg.querySelector<SVGPathElement>(`[data-stroke="${id}"]`);
          if (el) el.style.display = '';
        }
      }
      return;
    }

    const live = a.live;
    if (!commit || a.points.length < 2) {
      live?.remove();
      return;
    }

    cfg.current.onStroke({
      id: newId(),
      points: a.points,
      color: live?.getAttribute('stroke') ?? cfg.current.color,
      width: Number(live?.getAttribute('stroke-width') ?? cfg.current.width),
    });

    // Drop the scratch path only after React has painted the committed one;
    // removing it in the same frame would flash a gap.
    requestAnimationFrame(() => live?.remove());
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const a = active.current;
      if (!a || e.pointerId !== a.pointerId) return;
      if (e.buttons === 0) {
        finish(true);
        return;
      }
      const { x, y } = toWall(a.svg, e.clientX, e.clientY);
      if (a.erasing) eraseAt(a, x, y);
      else extend(a, x, y);
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
  }, [eraseAt, extend, finish, toWall]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const { mode: tool, color: penColor, width: penWidth } = cfg.current;
      if (tool === 'hand' || e.button !== 0 || active.current) return;

      e.preventDefault();
      const svg = e.currentTarget;
      const { x, y } = toWall(svg, e.clientX, e.clientY);
      const erasing = tool === 'eraser';

      let live: SVGPathElement | null = null;
      if (!erasing) {
        live = document.createElementNS(SVG_NS, 'path');
        live.setAttribute('fill', 'none');
        live.setAttribute('stroke', penColor);
        live.setAttribute('stroke-width', String(penWidth));
        live.setAttribute('stroke-linecap', 'round');
        live.setAttribute('stroke-linejoin', 'round');
        live.setAttribute('d', pathFromPoints([x, y]));
        svg.appendChild(live);
      }

      active.current = {
        pointerId: e.pointerId,
        svg,
        live,
        points: [x, y],
        erased: new Set(),
        erasing,
      };

      if (erasing) eraseAt(active.current, x, y);
      document.body.classList.add('is-dragging');
    },
    [eraseAt, toWall],
  );

  return { onPointerDown };
}
