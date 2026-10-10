/** Geometry for the red string tied between notes. All in wall units. */

interface Placed {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}

/** How far below the note's top edge the fastener's centre sits. */
const FASTENER_Y = 2;

/** Where string ties on: the fastener, top-centre, turned with the note. */
export function tiePoint(n: Placed): { x: number; y: number } {
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  const ly = FASTENER_Y - n.h / 2;
  const r = (n.rotation * Math.PI) / 180;
  return { x: cx - ly * Math.sin(r), y: cy + ly * Math.cos(r) };
}

/**
 * A length of yarn hanging between two points. It sags under its own weight,
 * more the longer it is, so short ties look taut and long runs droop.
 */
export function stringPath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const sag = Math.min(70, len * 0.11);
  const mx = (a.x + b.x) / 2;
  // A quadratic's midpoint sits halfway to its control point, hence 2×.
  const my = (a.y + b.y) / 2 + sag * 2;
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}
