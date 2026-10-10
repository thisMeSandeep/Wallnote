import { useRef, useState, type ReactNode } from 'react';
import { sound } from '../lib/audio';
import { Wordmark } from './Logo';
import { ShortcutsHelp } from './ShortcutsHelp';
import { ROOMS, SURFACES, type RoomKey, type SurfaceType } from '../types';

/** 20×20 line icons, stroked to match the sound and light buttons. */
function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  // A note with its corner folded over, and a plus on it.
  note: 'M4 3.5h12v8.5l-4.5 4.5H4zM16 12h-4.5v4.5M10 6.5v6M7 9.5h6',
  undo: 'M7.5 5L4 8.5 7.5 12M4 8.5h7.5a4.5 4.5 0 0 1 0 9H9',
  redo: 'M12.5 5L16 8.5 12.5 12M16 8.5H8.5a4.5 4.5 0 0 0 0 9H11',
  // Out of the app into a tray, and back up out of one.
  export: 'M10 3.5v9M6.5 9l3.5 3.5L13.5 9M4 13.5v2.5h12v-2.5',
  import: 'M10 12.5v-9M6.5 7L10 3.5 13.5 7M4 13.5v2.5h12v-2.5',
};

interface Props {
  switcher: ReactNode;
  surface: SurfaceType;
  room: RoomKey;
  lightOn: boolean;
  onLight: () => void;
  canUndo: boolean;
  canRedo: boolean;
  noteCount: number;
  onSurface: (s: SurfaceType) => void;
  onRoom: (r: RoomKey) => void;
  onAdd: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function Toolbar({
  switcher,
  surface,
  room,
  lightOn,
  onLight,
  canUndo,
  canRedo,
  noteCount,
  onSurface,
  onRoom,
  onAdd,
  onUndo,
  onRedo,
  onExport,
  onImport,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  // The engine owns the preference (it persists it); this only mirrors it for
  // the button's appearance.
  const [audioOn, setAudioOn] = useState(sound.enabled);

  const toggleAudio = () => {
    const next = !audioOn;
    sound.setEnabled(next);
    setAudioOn(next);
  };

  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <Wordmark />
      </div>

      {switcher}

      <div className="toolbar__group toolbar__surfaces" role="group" aria-label="Wall surface">
        {SURFACES.map((s) => (
          <button
            key={s.key}
            className={`swatch swatch--${s.key} ${surface === s.key ? 'is-active' : ''}`}
            onClick={() => onSurface(s.key)}
            title={s.label}
            aria-label={s.label}
            aria-pressed={surface === s.key}
          />
        ))}
      </div>

      <label className="toolbar__select" title="Colour of the room behind the wall">
        <span className={`toolbar__roomdot room-dot--${room}`} aria-hidden />
        <select
          value={room}
          onChange={(e) => onRoom(e.target.value as RoomKey)}
          aria-label="Room colour"
        >
          {ROOMS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <div className="toolbar__spacer" />

      <div className="toolbar__group">
        <button
          className="iconbtn iconbtn--primary"
          onClick={onAdd}
          title="New note (or double-click the wall)"
          aria-label="New note"
        >
          <Icon d={ICONS.note} />
        </button>
        <button
          className="iconbtn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Cmd+Z)"
          aria-label="Undo"
        >
          <Icon d={ICONS.undo} />
        </button>
        <button
          className="iconbtn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Cmd+Shift+Z)"
          aria-label="Redo"
        >
          <Icon d={ICONS.redo} />
        </button>
      </div>

      <div className="toolbar__group">
        <button
          className="iconbtn"
          onClick={onExport}
          title="Export — download this wall as a file"
          aria-label="Export this wall"
        >
          <Icon d={ICONS.export} />
        </button>
        <button
          className="iconbtn"
          onClick={() => fileRef.current?.click()}
          title="Import — load a wall file as a new wall"
          aria-label="Import a wall"
        >
          <Icon d={ICONS.import} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = '';
          }}
        />
      </div>

      <span className="toolbar__count">{noteCount} notes</span>

      <button
        className={`iconbtn ${lightOn ? 'is-on' : ''}`}
        onClick={onLight}
        title={lightOn ? 'Light on (L)' : 'Light off (L)'}
        aria-label={lightOn ? 'Turn the light off' : 'Turn the light on'}
        aria-pressed={lightOn}
      >
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
          <path
            d="M10 2.8a5 5 0 0 0-3 9c.6.5 1 1.1 1 1.9v.6h4v-.6c0-.8.4-1.4 1-1.9a5 5 0 0 0-3-9z"
            fill={lightOn ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M8.2 16.6h3.6M8.8 18.4h2.4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <button
        className={`iconbtn ${audioOn ? 'is-on' : ''}`}
        onClick={toggleAudio}
        title={audioOn ? 'Sound on' : 'Sound off'}
        aria-label={audioOn ? 'Turn sound off' : 'Turn sound on'}
        aria-pressed={audioOn}
      >
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
          <path
            d="M4 7.5h2.5L10 4.5v11L6.5 12.5H4z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {audioOn ? (
            <>
              <path
                d="M12.8 7.4a3.6 3.6 0 0 1 0 5.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M14.9 5.3a6.6 6.6 0 0 1 0 9.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </>
          ) : (
            <path
              d="M13 7.8l4 4.4M17 7.8l-4 4.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      <ShortcutsHelp />
    </header>
  );
}
