import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Bin } from './components/Bin';
import { ContextMenu, type MenuState } from './components/ContextMenu';
import { CrumpleFlight, type Flight } from './components/CrumpleFlight';
import { InkLayer } from './components/InkLayer';
import { Note } from './components/Note';
import { retie, StringLayer } from './components/StringLayer';
import { StylePanel } from './components/StylePanel';
import { ToolPalette } from './components/ToolPalette';
import { Toolbar } from './components/Toolbar';
import { Wall } from './components/Wall';
import { useDaylight } from './hooks/useDaylight';
import { useDragNote } from './hooks/useDragNote';
import { useDraw } from './hooks/useDraw';
import { useHotkeys } from './hooks/useHotkeys';
import { useResizeNote } from './hooks/useResizeNote';
import { useTieString } from './hooks/useTieString';
import { useWallScale } from './hooks/useWallScale';
import { sound } from './lib/audio';
import { newId } from './lib/id';
import { exportWall, importWall } from './lib/storage';
import { useWallStore } from './state/useWallStore';
import {
  PEN_WIDTHS,
  SURFACE_PEN,
  WALL_H,
  WALL_W,
  type Note as NoteModel,
  type RoomKey,
  type Stroke,
  type SurfaceType,
  type ToolMode,
  type WallState,
} from './types';

/** The basket rocking as a paper ball lands in it. */
const BIN_WOBBLE: Keyframe[] = [
  { transform: 'rotate(0deg)' },
  { transform: 'rotate(-7deg)' },
  { transform: 'rotate(5deg)' },
  { transform: 'rotate(-2deg)' },
  { transform: 'rotate(0deg)' },
];

const noop = () => {};

const prefersLessMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Props {
  wallId: string;
  wallName: string;
  lightOn: boolean;
  onToggleLight: () => void;
  /** The wall picker, slotted into the toolbar. */
  switcher: ReactNode;
  flash: (msg: string) => void;
  /** Keeps the picker's swatch and note count in step with the wall. */
  onMeta: (id: string, surface: SurfaceType, noteCount: number) => void;
  /** An imported file becomes a wall of its own rather than replacing this one. */
  onImport: (state: WallState, name: string) => void;
}

/** One wall and everything for working on it. Mounted fresh per wall. */
export function WallScreen({
  wallId,
  wallName,
  lightOn,
  onToggleLight,
  switcher,
  flash,
  onMeta,
  onImport,
}: Props) {
  const {
    state,
    notes,
    dispatch,
    commit,
    setText,
    canUndo,
    canRedo,
    storageFull,
    dismissStorageWarning,
  } = useWallStore(wallId);
  const { frameRef, scale, offsetY } = useWallScale();
  const ambient = useDaylight();
  // Dark enough for glow paper to show: the bulb's off and it's not daytime.
  const night = !lightOn && ambient.dark;

  const basketRef = useRef<HTMLButtonElement>(null);
  const stringsRef = useRef<SVGSVGElement>(null);
  const liveStringRef = useRef<SVGPathElement>(null);
  const [flights, setFlights] = useState<Flight[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);

  const [mode, setMode] = useState<ToolMode>('hand');
  const [penColor, setPenColor] = useState(SURFACE_PEN[state.surface]);
  const [penWidth, setPenWidth] = useState(PEN_WIDTHS[1].value);

  // Reach for the instrument that suits the material: chalk on a chalkboard,
  // marker on a whiteboard. An explicit pick sticks until the surface changes.
  useEffect(() => {
    setPenColor(SURFACE_PEN[state.surface]);
  }, [state.surface]);

  useEffect(() => {
    onMeta(wallId, state.surface, state.notes.length);
  }, [onMeta, wallId, state.surface, state.notes.length]);

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  // Read by handlers that run outside React's render (drag, string ties).
  const notesById = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes]);
  const notesRef = useRef(notesById);
  notesRef.current = notesById;

  /**
   * Pressing a note brings it to the front, as grabbing paper would. It isn't
   * selected until the press turns out to be a click (see onTap below):
   * selecting opens the style panel, which narrows the room, and doing that
   * mid-drag would slide the wall and the bin out from under the pointer.
   */
  const handleSelect = useCallback(
    (id: string) => {
      // With string in hand, pressing a note starts a tie, not a selection.
      if (mode === 'string') return;
      dispatch({ type: 'RAISE', id });
    },
    [dispatch, mode],
  );

  /**
   * Off the wall and into the bin. The note leaves state straight away; what
   * flies across the room is a stand-in that knows only where it started.
   */
  const binNote = useCallback(
    (id: string) => {
      const note = notesRef.current.get(id);
      const el = document.querySelector<HTMLElement>(`[data-note-id="${id}"]`);
      const frame = frameRef.current;
      const basket = basketRef.current;
      if (note && el && frame && basket && !prefersLessMotion()) {
        const f = frame.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const b = basket.getBoundingClientRect();
        setFlights((fs) => [
          ...fs,
          {
            key: newId(),
            noteId: id,
            color: note.color,
            from: {
              x: r.left + r.width / 2 - f.left,
              y: r.top + r.height / 2 - f.top,
              w: note.w * scale,
              h: note.h * scale,
              rot: note.rotation,
            },
            to: { x: b.left + b.width / 2 - f.left, y: b.top + 10 - f.top },
          },
        ]);
      } else {
        sound.play('bin');
      }
      sound.play('crumple');
      dispatch({ type: 'DELETE_NOTE', id });
      setSelectedId((cur) => (cur === id ? null : cur));
      setEditingId((cur) => (cur === id ? null : cur));
    },
    [dispatch, frameRef, scale],
  );

  const landFlight = useCallback((key: string) => {
    setFlights((fs) => fs.filter((f) => f.key !== key));
    sound.play('bin');
    basketRef.current?.animate(BIN_WOBBLE, { duration: 420, easing: 'ease-out' });
  }, []);

  const drag = useDragNote({
    scale,
    binRef: basketRef,
    onTap: setSelectedId,
    onMove: useCallback((id: string, x: number, y: number) => {
      const note = notesRef.current.get(id);
      if (note) retie(stringsRef.current, id, { ...note, x, y }, notesRef.current);
    }, []),
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
        binNote(id);
        flash('Into the bin — click the bin to fish it back out');
      },
      [binNote, flash],
    ),
  });

  /** Screen point to wall units, for the string tool's loose end. */
  const toWall = useCallback(
    (clientX: number, clientY: number) => {
      const wall = frameRef.current?.querySelector('.wall');
      if (!wall) return null;
      const r = wall.getBoundingClientRect();
      return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale };
    },
    [frameRef, scale],
  );

  const tie = useTieString({
    liveRef: liveStringRef,
    toWall,
    onTie: useCallback(
      (a: string, b: string) => {
        dispatch({ type: 'ADD_LINK', a, b });
        sound.play('tie');
      },
      [dispatch],
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

  const draw = useDraw({
    mode,
    color: penColor,
    width: penWidth,
    strokes: state.strokes,
    onStroke: useCallback(
      (stroke: Stroke) => dispatch({ type: 'ADD_STROKE', stroke }),
      [dispatch],
    ),
    onErase: useCallback((ids: string[]) => dispatch({ type: 'ERASE_STROKES', ids }), [dispatch]),
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
      sound.play('stick');
    },
    [dispatch],
  );

  const handleWallDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Drawing is a flurry of fast clicks — without this, sketching would
      // carpet the wall in empty notes.
      if (mode !== 'hand') return;
      const target = e.target as HTMLElement;
      if (target.closest('.note')) return;
      const { x, y } = wallPointFromEvent(e);
      addNoteAt(x, y);
    },
    [addNoteAt, mode, wallPointFromEvent],
  );

  const handleStyle = useCallback(
    (id: string, patch: Partial<NoteModel>) => dispatch({ type: 'SET_STYLE', id, patch }),
    [dispatch],
  );

  const handleDelete = binNote;

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
        flash("That file didn't look like a Wallnote wall");
        return;
      }
      onImport(loaded.state, loaded.name);
    },
    [flash, onImport],
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
      setMode('hand');
    }, []),
    onTool: useCallback((next: ToolMode) => {
      setMode(next);
      // Picking up a pencil implies you're done fiddling with a note.
      if (next !== 'hand') {
        setSelectedId(null);
        setEditingId(null);
      }
      sound.play('ui');
    }, []),
    onLight: onToggleLight,
  });

  const cutLink = useCallback(
    (id: string) => {
      dispatch({ type: 'CUT_LINK', id });
      sound.play('snip');
    },
    [dispatch],
  );

  const restoreNote = useCallback(
    (id: string) => {
      dispatch({ type: 'RESTORE_NOTE', id });
      setSelectedId(id);
      sound.play('stick');
    },
    [dispatch],
  );

  const emptyBin = useCallback(() => {
    dispatch({ type: 'EMPTY_BIN' });
    sound.play('peel');
    flash('Bin emptied — Cmd+Z if you needed something in there');
  }, [dispatch, flash]);

  /**
   * Glow paper in a dark room is lifted out of the normal note stack into a
   * layer above the darkness, so it can shine. It sits over every other note
   * while it's there — it's the only thing you can see anyway.
   */
  const glows = (n: NoteModel) => night && n.paper === 'glow';

  const renderNote = (note: NoteModel) => (
    <Note
      key={note.id}
      note={note}
      selected={note.id === selectedId}
      editing={note.id === editingId}
      onPointerDown={mode === 'string' ? tie.onPointerDown : drag.onPointerDown}
      onResizeDown={resize.onPointerDown}
      onSelect={handleSelect}
      // Double-clicking while tying string shouldn't open the note for writing.
      onStartEdit={mode === 'string' ? noop : setEditingId}
      onText={setText}
      onContextMenu={handleContextMenu}
    />
  );

  useEffect(() => {
    if (storageFull) {
      flash('Out of browser storage — export your wall, some changes are not being saved');
      dismissStorageWarning();
    }
  }, [storageFull, flash, dismissStorageWarning]);

  return (
    <>
      <Toolbar
        switcher={switcher}
        surface={state.surface}
        room={state.room}
        lightOn={lightOn}
        onLight={onToggleLight}
        canUndo={canUndo}
        canRedo={canRedo}
        noteCount={state.notes.length}
        onSurface={(s: SurfaceType) => dispatch({ type: 'SET_SURFACE', surface: s })}
        onRoom={(r: RoomKey) => dispatch({ type: 'SET_ROOM', room: r })}
        onAdd={() => addNoteAt(WALL_W / 2 + (Math.random() * 160 - 80), WALL_H / 2 + (Math.random() * 120 - 60))}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onExport={() => exportWall(state, wallName)}
        onImport={handleImport}
      />

      <main className={`stage stage--${state.surface} stage--room-${state.room}`}>
        <ToolPalette
          mode={mode}
          color={penColor}
          width={penWidth}
          hasInk={state.strokes.length > 0}
          onMode={(m) => {
            setMode(m);
            if (m !== 'hand') {
              setSelectedId(null);
              setEditingId(null);
            }
            sound.play('ui');
          }}
          onColor={setPenColor}
          onWidth={setPenWidth}
          onClear={() => {
            dispatch({ type: 'CLEAR_INK' });
            sound.play('peel');
          }}
        />

        <Wall
          surface={state.surface}
          scale={scale}
          offsetY={offsetY}
          mode={mode}
          lightOn={lightOn}
          onToggleLight={onToggleLight}
          ambient={ambient}
          ink={<InkLayer strokes={state.strokes} onPointerDown={draw.onPointerDown} />}
          strings={
            <StringLayer
              links={state.links}
              notes={notes}
              cutting={mode === 'string'}
              onCut={cutLink}
              svgRef={stringsRef}
              liveRef={liveStringRef}
            />
          }
          glowing={notes.filter(glows).map(renderNote)}
          room={
            <>
              <Bin
                binned={state.binned}
                arriving={flights.map((f) => f.noteId)}
                basketRef={basketRef}
                onRestore={restoreNote}
                onEmpty={emptyBin}
              />
              {flights.map((f) => (
                <CrumpleFlight key={f.key} flight={f} onDone={landFlight} />
              ))}
            </>
          }
          frameRef={frameRef}
          onBackgroundPointerDown={() => {
            setSelectedId(null);
            setEditingId(null);
          }}
          onBackgroundDoubleClick={handleWallDoubleClick}
        >
          {notes.filter((n) => !glows(n)).map(renderNote)}
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
    </>
  );
}
