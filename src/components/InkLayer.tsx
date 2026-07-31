import { memo } from 'react';
import { pathFromPoints } from '../lib/ink';
import { WALL_H, WALL_W, type Stroke } from '../types';

interface Props {
  strokes: Stroke[];
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
}

/**
 * Committed ink, below the notes. SVG rather than canvas because the wall is
 * CSS-scaled: vector paths stay crisp at any viewport and survive a resize
 * untouched, where a canvas would need its backing store rebuilt on every
 * refit. The viewBox is in wall units, so strokes need no conversion at all.
 */
function InkLayerImpl({ strokes, onPointerDown }: Props) {
  return (
    <svg
      className="ink"
      viewBox={`0 0 ${WALL_W} ${WALL_H}`}
      preserveAspectRatio="none"
      onPointerDown={onPointerDown}
      aria-hidden
    >
      {strokes.map((s) => (
        <path
          key={s.id}
          data-stroke={s.id}
          d={pathFromPoints(s.points)}
          stroke={s.color}
          strokeWidth={s.width}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export const InkLayer = memo(InkLayerImpl);
