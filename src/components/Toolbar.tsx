import { useRef, useState } from 'react';
import { sound } from '../lib/audio';
import { ShortcutsHelp } from './ShortcutsHelp';
import { ROOMS, SURFACES, type RoomKey, type SurfaceType } from '../types';

interface Props {
  surface: SurfaceType;
  room: RoomKey;
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
  surface,
  room,
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
        <span className="toolbar__mark" aria-hidden />
        <span>Wallnut</span>
      </div>

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
        <button className="btn btn--primary" onClick={onAdd}>
          + Note
        </button>
        <button className="btn" onClick={onUndo} disabled={!canUndo} title="Undo (Cmd+Z)">
          Undo
        </button>
        <button className="btn" onClick={onRedo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)">
          Redo
        </button>
      </div>

      <div className="toolbar__group">
        <button className="btn" onClick={onExport} title="Download this wall as JSON">
          Export
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()} title="Load a wall file">
          Import
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
