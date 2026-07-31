import type { ReactNode, RefObject } from 'react';
import { WALL_H, WALL_W, type SurfaceType } from '../types';

interface Props {
  surface: SurfaceType;
  scale: number;
  offsetY: number;
  frameRef: RefObject<HTMLDivElement>;
  onBackgroundPointerDown: () => void;
  onBackgroundDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  children: ReactNode;
}

export function Wall({
  surface,
  scale,
  offsetY,
  frameRef,
  onBackgroundPointerDown,
  onBackgroundDoubleClick,
  children,
}: Props) {
  return (
    <div className="frame" ref={frameRef}>
      <div className="room__glow" aria-hidden />
      <div
        className={`wall wall--${surface}`}
        style={
          {
            width: WALL_W,
            height: WALL_H,
            top: `calc(50% + ${offsetY}px)`,
            transform: `translate(-50%, -50%) scale(${scale})`,
            // Chrome rendered inside the wall counter-scales with this so grab
            // targets stay a constant physical size at any viewport.
            '--scale': scale,
            '--inv-scale': 1 / scale,
          } as React.CSSProperties
        }
        onPointerDown={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.wallbg) {
            onBackgroundPointerDown();
          }
        }}
        onDoubleClick={onBackgroundDoubleClick}
      >
        <div className="wall__surface" data-wallbg="1" aria-hidden />
        <div className="wall__grain" data-wallbg="1" aria-hidden />
        <div className="wall__notes">{children}</div>
        <div className="wall__vignette" aria-hidden />
        <div className="wall__frame" aria-hidden />
      </div>
    </div>
  );
}
