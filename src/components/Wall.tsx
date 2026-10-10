import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useTorch } from '../hooks/useTorch';
import type { Ambient } from '../lib/daylight';
import { WALL_H, WALL_W, type SurfaceType, type ToolMode } from '../types';
import { Bulb } from './Bulb';

/** Long enough for the warm-up flicker in wall.css to play out. */
const WARM_UP_MS = 700;

interface Props {
  surface: SurfaceType;
  scale: number;
  offsetY: number;
  mode: ToolMode;
  lightOn: boolean;
  onToggleLight: () => void;
  /** Window light by time of day — what's left when the bulb is off. */
  ambient: Ambient;
  ink: ReactNode;
  /** Red string, over the notes. */
  strings: ReactNode;
  /** Glow-paper notes, lifted above the darkness while the room is dark. */
  glowing: ReactNode;
  /** Things standing in the room in front of the wall: the bin, thrown paper. */
  room: ReactNode;
  frameRef: RefObject<HTMLDivElement>;
  onBackgroundPointerDown: () => void;
  onBackgroundDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  children: ReactNode;
}

export function Wall({
  surface,
  scale,
  offsetY,
  mode,
  lightOn,
  onToggleLight,
  ambient,
  ink,
  strings,
  glowing,
  room,
  frameRef,
  onBackgroundPointerDown,
  onBackgroundDoubleClick,
  children,
}: Props) {
  // Switching on flickers; switching off just goes. Only a real flip of the
  // switch warms up — a wall that mounts already lit must not flicker.
  const [warming, setWarming] = useState(false);
  const wasOn = useRef(lightOn);
  useLayoutEffect(() => {
    const flippedOn = lightOn && !wasOn.current;
    wasOn.current = lightOn;
    if (!flippedOn) {
      setWarming(false);
      return;
    }
    setWarming(true);
    const t = window.setTimeout(() => setWarming(false), WARM_UP_MS);
    return () => window.clearTimeout(t);
  }, [lightOn]);

  const lightClass = lightOn ? (warming ? 'is-warming' : '') : 'is-dark';
  const night = !lightOn && ambient.dark;

  const wallRef = useRef<HTMLDivElement>(null);
  useTorch(frameRef, wallRef, night);

  // Pencil and eraser draw on the ink layer; string works on the notes.
  const inking = mode === 'pencil' || mode === 'eraser';

  return (
    <div
      className={`frame ${lightClass} ${night ? 'is-night' : ''}`}
      ref={frameRef}
      style={ambient.vars as React.CSSProperties}
    >
      <div className="room__glow" aria-hidden />
      <div className="room__dark" aria-hidden />
      <div
        ref={wallRef}
        className={`wall wall--${surface} ${inking ? 'is-inking' : ''} is-${mode}`}
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
        {ink}
        <div className="wall__notes">{children}</div>
        {strings}
        <div className="wall__vignette" aria-hidden />
        <div className="wall__frame" aria-hidden />
        <div className="wall__shade" aria-hidden />
        <div className="wall__beam" aria-hidden />
        <div className="wall__glows">{glowing}</div>
      </div>
      {room}
      <Bulb on={lightOn} onToggle={onToggleLight} />
    </div>
  );
}
