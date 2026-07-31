import type { Fastener as FastenerType, Note } from '../types';

/**
 * Fasteners get a rotation of their own, derived from the note id, so a wall of
 * pins doesn't look stamped. Tape in particular reads wrong if every strip sits
 * at the same angle.
 */
function jitter(id: string, spread: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 1000) / 1000 - 0.5) * spread;
}

const PIN_COLORS = ['#d8412f', '#2f6fd8', '#e0a021', '#3fa564', '#8b47c9'];

export function Fastener({ note }: { note: Note }) {
  const kind: FastenerType = note.fastener;
  if (kind === 'none') return null;

  if (kind === 'pin') {
    const color = PIN_COLORS[Math.abs(note.id.charCodeAt(0) + note.id.length) % PIN_COLORS.length];
    return (
      <span
        className="fastener fastener--pin"
        style={
          {
            '--pin-color': color,
            transform: `translateX(-50%) rotate(${jitter(note.id, 16)}deg)`,
          } as React.CSSProperties
        }
        aria-hidden
      >
        <span className="pin__shadow" />
        <span className="pin__needle" />
        <span className="pin__dome" />
      </span>
    );
  }

  if (kind === 'tape') {
    return (
      <span
        className="fastener fastener--tape"
        style={{ transform: `translateX(-50%) rotate(${jitter(note.id, 10) - 2}deg)` }}
        aria-hidden
      />
    );
  }

  return (
    <span
      className="fastener fastener--magnet"
      style={{ transform: `translateX(-50%) rotate(${jitter(note.id, 20)}deg)` }}
      aria-hidden
    >
      <span className="magnet__body" />
    </span>
  );
}
