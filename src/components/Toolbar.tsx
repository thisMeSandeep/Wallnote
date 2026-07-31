import { useRef } from 'react';
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
    </header>
  );
}
