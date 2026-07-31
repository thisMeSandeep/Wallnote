import { COLORS, FASTENERS, FONTS, PAPERS, SHAPES, type Note } from '../types';

interface Props {
  note: Note | null;
  onStyle: (id: string, patch: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

export function StylePanel({ note, onStyle, onDelete }: Props) {
  if (!note) {
    return (
      <aside className="panel panel--empty">
        <p className="panel__placeholder">
          Select a note to restyle it.
          <br />
          Double-click the wall to add one.
        </p>
      </aside>
    );
  }

  const set = (patch: Partial<Note>) => onStyle(note.id, patch);

  return (
    <aside className="panel">
      <section className="panel__section">
        <h3>Colour</h3>
        <div className="panel__grid panel__grid--colors">
          {COLORS.map((c) => (
            <button
              key={c.key}
              className={`chip chip--color color-${c.key} ${note.color === c.key ? 'is-active' : ''}`}
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
              className={`chip ${note.paper === p.key ? 'is-active' : ''}`}
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
              className={`chip ${note.shape === s.key ? 'is-active' : ''}`}
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
              className={`chip ${note.fastener === f.key ? 'is-active' : ''}`}
              onClick={() => set({ fastener: f.key })}
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
              className={`chip font-${f.key} ${note.font === f.key ? 'is-active' : ''}`}
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
            value={note.fontScale}
            onChange={(e) => set({ fontScale: Number(e.target.value) })}
          />
        </label>
      </section>

      <section className="panel__section">
        <h3>Tilt</h3>
        <div className="panel__tilt">
          <button className="chip" onClick={() => set({ rotation: note.rotation - 1.5 })}>
            ↺
          </button>
          <span className="panel__tiltvalue">{note.rotation.toFixed(1)}°</span>
          <button className="chip" onClick={() => set({ rotation: note.rotation + 1.5 })}>
            ↻
          </button>
          <button className="chip" onClick={() => set({ rotation: 0 })}>
            Straighten
          </button>
        </div>
      </section>

      <button className="btn btn--danger" onClick={() => onDelete(note.id)}>
        Take off wall
      </button>
    </aside>
  );
}
