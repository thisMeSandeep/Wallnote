import { useEffect, useState, type RefObject } from 'react';
import type { Note } from '../types';

interface Props {
  binned: Note[];
  /** Notes still in the air: they don't show in the basket until they land. */
  arriving: string[];
  /** The basket itself: drag hit-testing, and the wobble when a ball lands. */
  basketRef: RefObject<HTMLButtonElement>;
  onRestore: (id: string) => void;
  onEmpty: () => void;
}

/** First line of a note, for telling crumpled balls apart. */
function label(text: string): string {
  const line = text.trim().split('\n')[0];
  return line.length > 34 ? `${line.slice(0, 33)}…` : line;
}

/**
 * The waste-paper basket in the corner of the room. Notes taken off the wall
 * land here as paper balls; click it to fish one out.
 */
export function Bin({ binned, arriving, basketRef, onRestore, onEmpty }: Props) {
  const [open, setOpen] = useState(false);
  const count = binned.length;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="bin" onPointerDown={(e) => e.stopPropagation()}>
      {open && (
        <div className="bin__pop">
          <h4>
            In the bin <span>{count || ''}</span>
          </h4>
          {count === 0 ? (
            <p className="bin__empty-msg">Nothing in here. Drag a note into the basket to bin it.</p>
          ) : (
            <>
              <ul>
                {binned.map((n) => (
                  <li key={n.id}>
                    <button
                      className="bin__item"
                      onClick={() => {
                        onRestore(n.id);
                        if (count === 1) setOpen(false);
                      }}
                      title="Smooth it out and put it back"
                    >
                      <span className={`bin__swatch color-${n.color}`} aria-hidden />
                      <span className="bin__text">{label(n.text) || 'Blank note'}</span>
                      <span className="bin__restore">Put back</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                className="bin__clear"
                onClick={() => {
                  onEmpty();
                  setOpen(false);
                }}
              >
                Empty the bin
              </button>
            </>
          )}
        </div>
      )}

      <button
        ref={basketRef}
        className="bin__basket"
        onClick={() => setOpen((o) => !o)}
        aria-label={count ? `Bin, ${count} notes` : 'Bin, empty'}
        aria-expanded={open}
        title={count ? `${count} in the bin` : 'The bin'}
      >
        <span className="bin__mouth" aria-hidden />
        {/* The most recent few poke out of the top. */}
        {binned
          .filter((n) => !arriving.includes(n.id))
          .slice(0, 3)
          .map((n, i) => (
            <span
              key={n.id}
              className={`ball bin__ball bin__ball--${i} color-${n.color}`}
              aria-hidden
            />
          ))}
        <span className="bin__body" aria-hidden />
      </button>
    </div>
  );
}
