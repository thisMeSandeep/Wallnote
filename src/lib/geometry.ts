import { WALL_W, WALL_H } from '../types';

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Keep a note grabbable: its centre must stay on the wall, but edges may hang
 * over so notes can sit flush against a corner.
 */
export function clampToWall(x: number, y: number, w: number, h: number) {
  return {
    x: clamp(x, -w / 2, WALL_W - w / 2),
    y: clamp(y, -h / 2, WALL_H - h / 2),
  };
}

/** True once a note has been dragged far enough off the wall to count as removed. */
export function isOffWall(x: number, y: number, w: number, h: number): boolean {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const margin = 24;
  return cx < -margin || cy < -margin || cx > WALL_W + margin || cy > WALL_H + margin;
}

/** Convert a screen-space delta into wall units. The only place scale is divided out. */
export function toWallUnits(dx: number, dy: number, scale: number) {
  return { dx: dx / scale, dy: dy / scale };
}
