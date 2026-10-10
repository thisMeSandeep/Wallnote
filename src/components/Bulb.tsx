import { useEffect, useRef } from 'react';

/** A tug on the cord: the bulb kicks out and settles back on its flex. */
const SWING: Keyframe[] = [
  { transform: 'rotate(0deg)' },
  { transform: 'rotate(7deg)' },
  { transform: 'rotate(-4.5deg)' },
  { transform: 'rotate(2.5deg)' },
  { transform: 'rotate(-1deg)' },
  { transform: 'rotate(0deg)' },
];

interface Props {
  on: boolean;
  onToggle: () => void;
}

/**
 * The bulb hanging in the room. It sits where the app's one light source has
 * always been — up and to the left — so the shadows were already pointing
 * away from it before it existed.
 */
export function Bulb({ on, onToggle }: Props) {
  const pullRef = useRef<HTMLButtonElement>(null);
  const wasOn = useRef(on);

  // Swings on every flip, whichever switch did it — but not when a wall
  // mounts, which isn't anybody pulling anything.
  useEffect(() => {
    if (wasOn.current === on) return;
    wasOn.current = on;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    pullRef.current?.animate(SWING, { duration: 900, easing: 'ease-out' });
  }, [on]);

  return (
    <div className={`bulb ${on ? 'is-on' : ''}`}>
      {/* Warm pool thrown onto the wall and room around the bulb. */}
      <div className="bulb__glow" aria-hidden />
      <button
        ref={pullRef}
        className="bulb__pull"
        onClick={onToggle}
        title={on ? 'Turn the light off (L)' : 'Turn the light on (L)'}
        aria-label={on ? 'Turn the light off' : 'Turn the light on'}
        aria-pressed={on}
      >
        <span className="bulb__cord" aria-hidden />
        <span className="bulb__socket" aria-hidden />
        <svg className="bulb__glass" viewBox="0 0 24 26" width="24" height="26" aria-hidden>
          <path
            className="bulb__shell"
            d="M8 0h8v3c0 3 5 6 5 13a9 9 0 0 1-18 0c0-7 5-10 5-13z"
          />
          {/* Second shell that carries the lit colour, so turning on and the
              flicker only ever animate its opacity. */}
          <path className="bulb__hot" d="M8 0h8v3c0 3 5 6 5 13a9 9 0 0 1-18 0c0-7 5-10 5-13z" />
          <path className="bulb__filament" d="M10 2l.4 9q1.6 3 3.2 0L14 2" />
          <path className="bulb__shine" d="M6.8 13.5c.3-2.3 1.4-4 2.6-5" />
        </svg>
      </button>
    </div>
  );
}
