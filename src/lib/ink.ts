/**
 * Geometry for freehand strokes. Points are a flat [x0,y0,x1,y1,...] array in
 * wall units — strokes are the only thing here that can grow without bound, so
 * the compact representation and the rounding below both matter for how much
 * of the localStorage quota a drawing session eats.
 */

/** One decimal is well below what's visible at any sane wall scale. */
export const round = (n: number): number => Math.round(n * 10) / 10;

/**
 * Quadratic smoothing through the midpoints of consecutive samples. A raw
 * polyline reads as visibly faceted at handwriting sizes; this costs nothing
 * and looks like a pen.
 */
export function pathFromPoints(pts: number[]): string {
  const n = pts.length >> 1;
  if (n === 0) return '';

  // A tap with no travel still deserves a dot; round linecaps render it.
  if (n === 1) return `M ${pts[0]} ${pts[1]} L ${pts[0]} ${pts[1]}`;

  let d = `M ${pts[0]} ${pts[1]}`;
  for (let i = 1; i < n - 1; i++) {
    const x = pts[i * 2];
    const y = pts[i * 2 + 1];
    const mx = round((x + pts[(i + 1) * 2]) / 2);
    const my = round((y + pts[(i + 1) * 2 + 1]) / 2);
    d += ` Q ${x} ${y} ${mx} ${my}`;
  }
  return `${d} L ${pts[(n - 1) * 2]} ${pts[(n - 1) * 2 + 1]}`;
}

export type BBox = [minX: number, minY: number, maxX: number, maxY: number];

export function bboxOf(pts: number[]): BBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    if (pts[i] < minX) minX = pts[i];
    if (pts[i] > maxX) maxX = pts[i];
    if (pts[i + 1] < minY) minY = pts[i + 1];
    if (pts[i + 1] > maxY) maxY = pts[i + 1];
  }
  return [minX, minY, maxX, maxY];
}

/** Squared distance from a point to a segment — no sqrt in the inner loop. */
function distSqToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = px - (ax + t * dx);
  const cy = py - (ay + t * dy);
  return cx * cx + cy * cy;
}

/**
 * Does the eraser at (x, y) touch this stroke? Tests against segments rather
 * than samples, so a thinned stroke can't be erased "between" its points.
 */
export function strokeHit(pts: number[], strokeWidth: number, x: number, y: number, radius: number): boolean {
  const reach = radius + strokeWidth / 2;
  const reachSq = reach * reach;
  const n = pts.length >> 1;

  if (n === 1) {
    const dx = x - pts[0];
    const dy = y - pts[1];
    return dx * dx + dy * dy <= reachSq;
  }

  for (let i = 0; i < n - 1; i++) {
    const hit = distSqToSegment(
      x,
      y,
      pts[i * 2],
      pts[i * 2 + 1],
      pts[(i + 1) * 2],
      pts[(i + 1) * 2 + 1],
    );
    if (hit <= reachSq) return true;
  }
  return false;
}

/** Cheap rejection before the per-segment test. */
export function bboxMisses(box: BBox, x: number, y: number, reach: number): boolean {
  return x < box[0] - reach || x > box[2] + reach || y < box[1] - reach || y > box[3] + reach;
}
