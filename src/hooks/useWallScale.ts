import { useEffect, useRef, useState } from 'react';
import { WALL_H, WALL_W } from '../types';

/** Chrome that the wall must not slide under, in screen px. */
const PAD_X = 48;
const PAD_TOP = 84;
const PAD_BOTTOM = 40;

/**
 * Fits the fixed 1600x1000 wall into whatever viewport we have. Resizing the
 * window changes only this number — no note data is ever touched, so layouts
 * never distort.
 */
export function useWallScale() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const usableW = Math.max(200, width - PAD_X * 2);
      const usableH = Math.max(200, height - PAD_TOP - PAD_BOTTOM);
      setScale(Math.min(usableW / WALL_W, usableH / WALL_H));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { frameRef, scale };
}
