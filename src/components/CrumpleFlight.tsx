import { useLayoutEffect, useRef } from 'react';
import type { ColorKey } from '../types';

export interface Flight {
  key: string;
  /** The binned note — kept out of the basket until this lands. */
  noteId: string;
  color: ColorKey;
  /** Frame pixels. `rot` in degrees. */
  from: { x: number; y: number; w: number; h: number; rot: number };
  /** The bin's mouth, frame pixels. */
  to: { x: number; y: number };
}

const BALL = 30;
const DURATION = 820;
/** Share of the flight spent balling the paper up before it's thrown. */
const CRUMPLE = 0.28;
/** Share at which it reaches the bin's mouth; the rest is the drop inside. */
const ARRIVE = 0.9;
const STEPS = 24;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeIn = (t: number) => t * t;

/**
 * A note being screwed up and lobbed into the bin. The sheet shrinks into a
 * ball where it was, then arcs over. The arc is sampled into keyframes rather
 * than eased, because a parabola is not something CSS easing can draw.
 */
export function CrumpleFlight({ flight, onDone }: { flight: Flight; onDone: (key: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { from, to } = flight;

    // Control point for a quadratic that peaks a little above both ends.
    const peak = Math.min(from.y, to.y) - 110;
    const cy = 2 * peak - (from.y + to.y) / 2;

    const frames: Keyframe[] = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      let x = from.x;
      let y = from.y;
      let w = BALL;
      let h = BALL;
      let rot = from.rot;
      let radius = 50;
      if (t <= CRUMPLE) {
        const u = easeIn(t / CRUMPLE);
        w = lerp(from.w, BALL, u);
        h = lerp(from.h, BALL, u);
        rot = from.rot + u * 70;
        radius = lerp(2, 50, u);
      } else if (t <= ARRIVE) {
        const u = (t - CRUMPLE) / (ARRIVE - CRUMPLE);
        x = lerp(from.x, to.x, u);
        y = (1 - u) ** 2 * from.y + 2 * u * (1 - u) * cy + u ** 2 * to.y;
        rot = from.rot + 70 + u * 420;
      } else {
        const u = (t - ARRIVE) / (1 - ARRIVE);
        x = to.x;
        y = to.y + u * 22;
        rot = from.rot + 490 + u * 30;
      }
      frames.push({
        offset: t,
        width: `${w}px`,
        height: `${h}px`,
        borderRadius: `${radius}%`,
        transform: `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot}deg)`,
      });
    }

    const anim = el.animate(frames, { duration: DURATION, fill: 'forwards' });
    el.querySelector('.flight__creases')?.animate(
      [{ opacity: 0 }, { opacity: 1, offset: CRUMPLE }, { opacity: 1 }],
      { duration: DURATION, fill: 'forwards' },
    );
    anim.onfinish = () => onDone(flight.key);
    return () => anim.cancel();
  }, [flight, onDone]);

  return (
    <div ref={ref} className={`flight color-${flight.color}`} aria-hidden>
      <span className="flight__creases" />
    </div>
  );
}
