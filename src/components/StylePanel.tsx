import { useEffect, useRef } from 'react';
import { sound, type SoundName } from '../lib/audio';
import { COLORS, FASTENERS, FONTS, PAPERS, SHAPES, type Fastener, type Note } from '../types';

/** Each fastener sounds like the thing it is; bare paper just rustles. */
const FASTENER_SOUND: Record<Fastener, SoundName> = {
  pin: 'pin',
  tape: 'tape',
  magnet: 'magnet',
  none: 'lift',
};

interface Props {
  note: Note | null;
  onStyle: (id: string, patch: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

/**
 * Collapses to zero width when nothing is selected. The stage measures itself
 * with a ResizeObserver, so the wall grows into the freed space as the panel
 * slides shut. Content lives in a fixed-width inner div so it doesn't reflow
 * mid-animation.
 */
export function StylePanel({ note, onStyle, onDelete, onClose }: Props) {
  // Hold the last selected note through the closing animation, otherwise the
  // controls blink out before the panel has finished sliding away.
  const lastNote = useRef<Note | null>(note);
  useEffect(() => {
    if (note) lastNote.current = note;
  }, [note]);

  const shown = note ?? lastNote.current;
  const open = note !== null;
  const set = (patch: Partial<Note>) => note && onStyle(note.id, patch);

  return (
    <aside className={`panel ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="panel__inner">
        {shown && (
          <>
            <header className="panel__head">
              <h2>Note</h2>
              <button className="panel__close" onClick={onClose} aria-label="Close panel">
                ×
              </button>
            </header>

            <section className="panel__section">
              <h3>Colour</h3>
              <div className="panel__grid panel__grid--colors">
                {COLORS.map((c) => (
                  <button
                    key={c.key}
                    className={`chip chip--color color-${c.key} ${
                      shown.color === c.key ? 'is-active' : ''
                    }`}
                    onClick={() => set({ color: c.key })}
                    title={c.label}
                    aria-label={c.label}
                  />
                ))}
              </div>
            </section>

            <section className="panel__section">
              <h3>Paper</h3>
              <div className="panel__grid">
                {PAPERS.map((p) => (
                  <button
                    key={p.key}
                    className={`chip ${shown.paper === p.key ? 'is-active' : ''}`}
                    onClick={() => set({ paper: p.key })}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="panel__section">
              <h3>Shape</h3>
              <div className="panel__grid">
                {SHAPES.map((s) => (
                  <button
                    key={s.key}
                    className={`chip ${shown.shape === s.key ? 'is-active' : ''}`}
                    // Changing shape resets to that shape's proportions — a square
                    // keeping a strip's dimensions just looks like a bug.
                    onClick={() => set({ shape: s.key, w: s.w, h: s.h })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="panel__section">
              <h3>Fastener</h3>
              <div className="panel__grid">
                {FASTENERS.map((f) => (
                  <button
                    key={f.key}
                    className={`chip ${shown.fastener === f.key ? 'is-active' : ''}`}
                    onClick={() => {
                      sound.play(FASTENER_SOUND[f.key]);
                      set({ fastener: f.key });
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="panel__section">
              <h3>Handwriting</h3>
              <div className="panel__grid">
                {FONTS.map((f) => (
                  <button
                    key={f.key}
                    className={`chip font-${f.key} ${shown.font === f.key ? 'is-active' : ''}`}
                    onClick={() => set({ font: f.key })}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <label className="panel__slider">
                <span>Size</span>
                <input
                  type="range"
                  min={0.8}
                  max={1.6}
                  step={0.05}
                  value={shown.fontScale}
                  onChange={(e) => set({ fontScale: Number(e.target.value) })}
                />
              </label>
            </section>

            <section className="panel__section">
              <h3>Tilt</h3>
              <div className="panel__tilt">
                <button className="chip" onClick={() => set({ rotation: shown.rotation - 1.5 })}>
                  ↺
                </button>
                <span className="panel__tiltvalue">{shown.rotation.toFixed(1)}°</span>
                <button className="chip" onClick={() => set({ rotation: shown.rotation + 1.5 })}>
                  ↻
                </button>
                <button className="chip" onClick={() => set({ rotation: 0 })}>
                  Straighten
                </button>
              </div>
            </section>

            <button className="btn btn--danger" onClick={() => note && onDelete(note.id)}>
              Take off wall
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
