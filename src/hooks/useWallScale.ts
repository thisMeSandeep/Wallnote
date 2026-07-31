import { useEffect, useRef, useState } from 'react';
import { WALL_H, WALL_W } from '../types';

/** The wall fills this share of the stage; the remainder is room around it. */
const FILL = 0.95;
/** Extra breathing room under the toolbar so the wall doesn't crowd it. */
const TOP_BREATHE = 18;

/**
 * Fits the fixed 1600x1000 wall into whatever stage we have. Resizing the
 * window — or collapsing the side panel — changes only these numbers. No note
 * data is ever touched, so layouts never distort.
 */
export function useWallScale() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, offsetY: 0 });

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const gutterX = (width * (1 - FILL)) / 2;
      const gutterY = (height * (1 - FILL)) / 2;
      const topGap = gutterY + TOP_BREATHE;

      const usableW = Math.max(200, width - gutterX * 2);
      const usableH = Math.max(200, height - topGap - gutterY);

      setFit({
        scale: Math.min(usableW / WALL_W, usableH / WALL_H),
        // Asymmetric gaps mean the wall's centre sits below the stage's.
        offsetY: (topGap - gutterY) / 2,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { frameRef, scale: fit.scale, offsetY: fit.offsetY };
}
