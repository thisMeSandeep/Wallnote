import { useCallback, useRef, useState } from 'react';
import { ContextMenu, type MenuState } from './components/ContextMenu';
import { Note } from './components/Note';
import { StylePanel } from './components/StylePanel';
import { Toolbar } from './components/Toolbar';
import { Wall } from './components/Wall';
import { useDragNote } from './hooks/useDragNote';
import { useHotkeys } from './hooks/useHotkeys';
import { useResizeNote } from './hooks/useResizeNote';
import { useWallScale } from './hooks/useWallScale';
import { newId } from './lib/id';
import { exportWall, importWall } from './lib/storage';
import { useWallStore } from './state/useWallStore';
import {
  WALL_H,
  WALL_W,
  type Note as NoteModel,
  type RoomKey,
  type SurfaceType,
} from './types';

export default function App() {
  const { state, notes, dispatch, commit, setText, canUndo, canRedo } = useWallStore();
  const { frameRef, scale, offsetY } = useWallScale();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  /** Selecting also brings the note to the front, as grabbing paper would. */
  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      dispatch({ type: 'RAISE', id });
    },
    [dispatch],
  );

  const drag = useDragNote({
    scale,
    // commit() runs here rather than on grab so a click that moves nothing
    // doesn't leave an empty step on the undo stack.
    onDrop: useCallback(
      (id: string, x: number, y: number) => {
        commit();
        dispatch({ type: 'MOVE_NOTE', id, x, y });
      },
      [commit, dispatch],
    ),
    onDropOff: useCallback(
      (id: string) => {
        dispatch({ type: 'DELETE_NOTE', id });
        setSelectedId((cur) => (cur === id ? null : cur));
        flash('Note taken off the wall — Cmd+Z to put it back');
      },
      [dispatch, flash],
    ),
  });

  const resize = useResizeNote({
    scale,
    onDone: useCallback(
      (id, w, h) => {
        commit();
        dispatch({ type: 'RESIZE_NOTE', id, w, h });
      },
      [commit, dispatch],
    ),
  });

  /** Turn a screen-space click into wall units. */
  const wallPointFromEvent = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      };
    },
    [scale],
  );

  const addNoteAt = useCallback(
    (x: number, y: number) => {
      // Mint the id here so the new note can be selected and opened for typing
      // in the same commit that creates it.
      const id = newId();
      dispatch({ type: 'ADD_NOTE', x, y, seed: { id } });
      setSelectedId(id);
      setEditingId(id);
    },
    [dispatch],
  );

  const handleWallDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest('.note')) return;
      const { x, y } = wallPointFromEvent(e);
      addNoteAt(x, y);
    },
    [addNoteAt, wallPointFromEvent],
  );

  const handleStyle = useCallback(
    (id: string, patch: Partial<NoteModel>) => dispatch({ type: 'SET_STYLE', id, patch }),
    [dispatch],
  );

  const handleDelete = useCallback(
    (id: string) => {
      dispatch({ type: 'DELETE_NOTE', id });
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [dispatch],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    setMenu({ id, x: e.clientX, y: e.clientY });
  }, []);

  const handleImport = useCallback(
    async (file: File) => {
      const loaded = await importWall(file);
      if (!loaded) {
        flash("That file didn't look like a Wallnut wall");
        return;
      }
      commit();
      dispatch({ type: 'LOAD_STATE', state: loaded });
      setSelectedId(null);
      setEditingId(null);
      flash(`Loaded ${loaded.notes.length} notes`);
    },
    [commit, dispatch, flash],
  );

  useHotkeys({
    onUndo: useCallback(() => dispatch({ type: 'UNDO' }), [dispatch]),
    onRedo: useCallback(() => dispatch({ type: 'REDO' }), [dispatch]),
    onDelete: useCallback(() => {
      if (selectedId) handleDelete(selectedId);
    }, [selectedId, handleDelete]),
    onEscape: useCallback(() => {
      setEditingId(null);
      setMenu(null);
    }, []),
  });

  return (
    <div className="app">
      <Toolbar
        surface={state.surface}
        room={state.room}
        canUndo={canUndo}
        canRedo={canRedo}
        noteCount={state.notes.length}
        onSurface={(s: SurfaceType) => dispatch({ type: 'SET_SURFACE', surface: s })}
        onRoom={(r: RoomKey) => dispatch({ type: 'SET_ROOM', room: r })}
        onAdd={() => addNoteAt(WALL_W / 2 + (Math.random() * 160 - 80), WALL_H / 2 + (Math.random() * 120 - 60))}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onExport={() => exportWall(state)}
        onImport={handleImport}
      />

      <main className={`stage stage--${state.surface} stage--room-${state.room}`}>
        <Wall
          surface={state.surface}
          scale={scale}
          offsetY={offsetY}
          frameRef={frameRef}
          onBackgroundPointerDown={() => {
            setSelectedId(null);
            setEditingId(null);
          }}
          onBackgroundDoubleClick={handleWallDoubleClick}
        >
          {notes.map((note) => (
            <Note
              key={note.id}
              note={note}
              selected={note.id === selectedId}
              editing={note.id === editingId}
              onPointerDown={drag.onPointerDown}
              onResizeDown={resize.onPointerDown}
              onSelect={handleSelect}
              onStartEdit={setEditingId}
              onText={setText}
              onContextMenu={handleContextMenu}
            />
          ))}
        </Wall>

        <StylePanel
          note={selected}
          onStyle={handleStyle}
          onDelete={handleDelete}
          onClose={() => {
            setSelectedId(null);
            setEditingId(null);
          }}
        />
      </main>

      {menu && (
        <ContextMenu
          menu={menu}
          onClose={() => setMenu(null)}
          onDuplicate={(id) => dispatch({ type: 'DUPLICATE', id })}
          onSendToBack={(id) => dispatch({ type: 'SEND_TO_BACK', id })}
          onDelete={handleDelete}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
