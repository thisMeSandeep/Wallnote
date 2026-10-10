import { useCallback, useEffect, useState } from 'react';
import { MAX_WALL_NAME } from '../lib/storage';
import type { WallMeta } from '../types';

interface Props {
  walls: WallMeta[];
  activeId: string;
  onSwitch: (id: string) => void;
  /** An empty name means "pick one for me". */
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

/** Sentinel for the name field of a wall that doesn't exist yet. */
const NEW = 'new';

export function WallSwitcher({ walls, activeId, onSwitch, onCreate, onRename, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  /** A wall id being renamed, NEW while naming a new wall, or null. */
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const active = walls.find((w) => w.id === activeId) ?? walls[0];

  const close = useCallback(() => {
    setOpen(false);
    setEditing(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const startEdit = (id: string, name: string) => {
    setEditing(id);
    setDraft(name);
  };

  const commit = () => {
    const name = draft.trim().slice(0, MAX_WALL_NAME);
    if (editing === NEW) {
      onCreate(name);
      close();
      return;
    }
    if (editing && name) onRename(editing, name);
    setEditing(null);
  };

  const field = (placeholder: string) => (
    <input
      className="walls__input"
      value={draft}
      placeholder={placeholder}
      maxLength={MAX_WALL_NAME}
      autoFocus
      onFocus={(e) => e.target.select()}
      onChange={(e) => setDraft(e.target.value)}
      // Blur commits a rename but abandons a new wall — clicking away from an
      // empty "new wall" field shouldn't conjure one up.
      onBlur={() => (editing === NEW ? setEditing(null) : commit())}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') {
          // Back out of the field without closing the whole list.
          e.stopPropagation();
          setEditing(null);
        }
      }}
    />
  );

  return (
    <div className="walls" onPointerDown={(e) => e.stopPropagation()}>
      <button
        className={`walls__trigger ${open ? 'is-open' : ''}`}
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="true"
        aria-expanded={open}
        title="Switch walls"
      >
        <span
          className={`walls__swatch swatch--${active.surface} ${active.lightOn ? '' : 'is-dark'}`}
          aria-hidden
        />
        <span className="walls__current">{active.name}</span>
        <svg className="walls__chevron" viewBox="0 0 10 10" width="10" height="10" aria-hidden>
          <path
            d="M2 3.5l3 3 3-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="walls__pop">
          <h4>Walls</h4>
          <ul>
            {walls.map((w) => (
              <li key={w.id} className={`walls__row ${w.id === activeId ? 'is-active' : ''}`}>
                {editing === w.id ? (
                  field('Wall name')
                ) : (
                  <button
                    className="walls__pick"
                    onClick={() => {
                      if (w.id !== activeId) onSwitch(w.id);
                      close();
                    }}
                    aria-current={w.id === activeId}
                  >
                    <span
                      className={`walls__swatch swatch--${w.surface} ${w.lightOn ? '' : 'is-dark'}`}
                      aria-hidden
                    />
                    <span className="walls__name">{w.name}</span>
                    <span className="walls__count">{w.noteCount}</span>
                  </button>
                )}
                <button
                  className="walls__icon"
                  onClick={() => startEdit(w.id, w.name)}
                  title="Rename"
                  aria-label={`Rename ${w.name}`}
                >
                  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden>
                    <path
                      d="M10.5 2.5l3 3L6 13H3v-3z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  className="walls__icon walls__icon--danger"
                  onClick={() => onDelete(w.id)}
                  disabled={walls.length < 2}
                  title={walls.length < 2 ? 'You need at least one wall' : 'Take down this wall'}
                  aria-label={`Delete ${w.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="walls__foot">
            {editing === NEW ? (
              field('Name it, then Enter')
            ) : (
              <button className="walls__new" onClick={() => startEdit(NEW, '')}>
                + New wall
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
