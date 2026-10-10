import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { newId } from '../lib/id';
import { load, save } from '../lib/storage';
import {
  BIN_CAP,
  SHAPES,
  type Note,
  type RoomKey,
  type Stroke,
  type SurfaceType,
  type WallState,
} from '../types';

export type Action =
  | { type: 'ADD_NOTE'; x: number; y: number; seed?: Partial<Note> }
  | { type: 'MOVE_NOTE'; id: string; x: number; y: number }
  | { type: 'RESIZE_NOTE'; id: string; w: number; h: number }
  | { type: 'SET_TEXT'; id: string; text: string }
  | { type: 'SET_STYLE'; id: string; patch: Partial<Note> }
  | { type: 'RAISE'; id: string }
  | { type: 'SEND_TO_BACK'; id: string }
  | { type: 'DUPLICATE'; id: string }
  | { type: 'DELETE_NOTE'; id: string }
  | { type: 'SET_SURFACE'; surface: SurfaceType }
  | { type: 'SET_ROOM'; room: RoomKey }
  | { type: 'ADD_STROKE'; stroke: Stroke }
  | { type: 'ERASE_STROKES'; ids: string[] }
  | { type: 'CLEAR_INK' }
  | { type: 'RESTORE_NOTE'; id: string }
  | { type: 'EMPTY_BIN' }
  | { type: 'ADD_LINK'; a: string; b: string }
  | { type: 'CUT_LINK'; id: string };

interface History {
  past: WallState[];
  present: WallState;
  future: WallState[];
}

/* Raised once drawing landed: each stroke is its own entry, so a short sketch
   would otherwise evict every note edit behind it. */
const HISTORY_CAP = 120;

/**
 * Actions that shouldn't each get their own undo entry. Drag/resize push a
 * single snapshot on release (see commit()), and text edits are coalesced by a
 * debounce in the SET_TEXT path. RAISE fires on every click, so leaving it
 * undoable would bury real edits under a pile of z-order bumps.
 */
const TRANSIENT: Action['type'][] = [
  'MOVE_NOTE',
  'RESIZE_NOTE',
  'SET_TEXT',
  'RAISE',
];

function tilt(): number {
  return Math.round((Math.random() * 6 - 3) * 10) / 10;
}

function mapNote(state: WallState, id: string, fn: (n: Note) => Note): WallState {
  return {
    ...state,
    notes: state.notes.map((n) => (n.id === id ? { ...fn(n), updatedAt: Date.now() } : n)),
  };
}

/**
 * Drops string whose ends are gone for good. A note in the bin keeps its
 * strings, so fishing it back out ties them back up.
 */
function pruneLinks(state: WallState): WallState {
  const ids = new Set([...state.notes, ...state.binned].map((n) => n.id));
  const links = state.links.filter((l) => ids.has(l.a) && ids.has(l.b));
  return links.length === state.links.length ? state : { ...state, links };
}

function reduce(state: WallState, action: Action): WallState {
  switch (action.type) {
    case 'ADD_NOTE': {
      const shape = action.seed?.shape ?? 'square';
      const def = SHAPES.find((s) => s.key === shape)!;
      const w = action.seed?.w ?? def.w;
      const h = action.seed?.h ?? def.h;
      const now = Date.now();
      const note: Note = {
        id: newId(),
        text: '',
        x: action.x - w / 2,
        y: action.y - h / 2,
        w,
        h,
        rotation: tilt(),
        z: state.nextZ,
        color: 'canary',
        paper: 'sticky',
        shape,
        fastener: 'pin',
        font: 'caveat',
        fontScale: 1,
        createdAt: now,
        updatedAt: now,
        ...action.seed,
      };
      return { ...state, notes: [...state.notes, note], nextZ: state.nextZ + 1 };
    }

    case 'MOVE_NOTE':
      return mapNote(state, action.id, (n) => ({ ...n, x: action.x, y: action.y }));

    case 'RESIZE_NOTE':
      return mapNote(state, action.id, (n) => ({ ...n, w: action.w, h: action.h }));

    case 'SET_TEXT':
      return mapNote(state, action.id, (n) => ({ ...n, text: action.text }));

    case 'SET_STYLE':
      return mapNote(state, action.id, (n) => ({ ...n, ...action.patch }));

    case 'RAISE': {
      const note = state.notes.find((n) => n.id === action.id);
      if (!note || note.z === state.nextZ - 1) return state;
      return {
        ...mapNote(state, action.id, (n) => ({ ...n, z: state.nextZ })),
        nextZ: state.nextZ + 1,
      };
    }

    case 'SEND_TO_BACK': {
      const lowest = Math.min(...state.notes.map((n) => n.z));
      return mapNote(state, action.id, (n) => ({ ...n, z: lowest - 1 }));
    }

    case 'DUPLICATE': {
      const src = state.notes.find((n) => n.id === action.id);
      if (!src) return state;
      const now = Date.now();
      const copy: Note = {
        ...src,
        id: newId(),
        x: src.x + 28,
        y: src.y + 28,
        z: state.nextZ,
        rotation: tilt(),
        createdAt: now,
        updatedAt: now,
      };
      return { ...state, notes: [...state.notes, copy], nextZ: state.nextZ + 1 };
    }

    // Taken off the wall means into the bin, not gone.
    case 'DELETE_NOTE': {
      const note = state.notes.find((n) => n.id === action.id);
      if (!note) return state;
      return pruneLinks({
        ...state,
        notes: state.notes.filter((n) => n.id !== action.id),
        binned: [note, ...state.binned].slice(0, BIN_CAP),
      });
    }

    case 'RESTORE_NOTE': {
      const note = state.binned.find((n) => n.id === action.id);
      if (!note) return state;
      return {
        ...state,
        notes: [...state.notes, { ...note, z: state.nextZ, rotation: tilt(), updatedAt: Date.now() }],
        binned: state.binned.filter((n) => n.id !== action.id),
        nextZ: state.nextZ + 1,
      };
    }

    case 'EMPTY_BIN':
      return state.binned.length === 0 ? state : pruneLinks({ ...state, binned: [] });

    case 'ADD_LINK': {
      const { a, b } = action;
      if (a === b) return state;
      const tied = state.links.some(
        (l) => (l.a === a && l.b === b) || (l.a === b && l.b === a),
      );
      if (tied) return state;
      return {
        ...state,
        // String needs something to wrap round: bare paper gets a pin.
        notes: state.notes.map((n) =>
          (n.id === a || n.id === b) && n.fastener === 'none' ? { ...n, fastener: 'pin' } : n,
        ),
        links: [...state.links, { id: newId(), a, b }],
      };
    }

    case 'CUT_LINK':
      return { ...state, links: state.links.filter((l) => l.id !== action.id) };

    case 'SET_SURFACE':
      return { ...state, surface: action.surface };

    case 'SET_ROOM':
      return { ...state, room: action.room };

    case 'ADD_STROKE':
      return { ...state, strokes: [...state.strokes, action.stroke] };

    case 'ERASE_STROKES': {
      const gone = new Set(action.ids);
      return { ...state, strokes: state.strokes.filter((s) => !gone.has(s.id)) };
    }

    case 'CLEAR_INK':
      return state.strokes.length === 0 ? state : { ...state, strokes: [] };
  }
}

type HistoryAction = Action | { type: 'UNDO' } | { type: 'REDO' } | { type: 'COMMIT' };

function historyReducer(h: History, action: HistoryAction): History {
  switch (action.type) {
    case 'UNDO': {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future].slice(0, HISTORY_CAP),
      };
    }

    case 'REDO': {
      if (h.future.length === 0) return h;
      return {
        past: [...h.past, h.present].slice(-HISTORY_CAP),
        present: h.future[0],
        future: h.future.slice(1),
      };
    }

    // Snapshots the current state without changing it. Drag and resize fire this
    // once on pointerup so the whole gesture collapses into one undo step.
    case 'COMMIT':
      return { past: [...h.past, h.present].slice(-HISTORY_CAP), present: h.present, future: [] };

    default: {
      const next = reduce(h.present, action);
      if (next === h.present) return h;
      if (TRANSIENT.includes(action.type)) {
        return { ...h, present: next, future: h.future };
      }
      return {
        past: [...h.past, h.present].slice(-HISTORY_CAP),
        present: next,
        future: [],
      };
    }
  }
}

/**
 * One wall's state and undo history. The caller remounts this per wall (via a
 * React key), so history never leaks from one wall into another.
 */
export function useWallStore(wallId: string) {
  const [history, raw] = useReducer(historyReducer, undefined, () => ({
    past: [],
    present: load(wallId),
    future: [],
  }));

  const state = history.present;
  const [storageFull, setStorageFull] = useState(false);

  useEffect(() => {
    save(wallId, state, () => setStorageFull(true));
  }, [wallId, state]);

  const textTimer = useRef<number | undefined>(undefined);
  const pendingText = useRef<string | null>(null);

  const dispatch = useCallback((action: HistoryAction) => raw(action), []);

  /** Snapshot before a gesture-style mutation so undo treats it as one step. */
  const commit = useCallback(() => raw({ type: 'COMMIT' }), []);

  /**
   * Text is transient in the reducer; this pushes one history entry per burst
   * of typing so Cmd+Z reverts a sentence rather than a character.
   */
  const setText = useCallback((id: string, text: string) => {
    if (pendingText.current === null) {
      pendingText.current = id;
      raw({ type: 'COMMIT' });
    }
    raw({ type: 'SET_TEXT', id, text });
    window.clearTimeout(textTimer.current);
    textTimer.current = window.setTimeout(() => {
      pendingText.current = null;
    }, 600);
  }, []);

  const sorted = useMemo(() => [...state.notes].sort((a, b) => a.z - b.z), [state.notes]);

  return {
    state,
    notes: sorted,
    dispatch,
    commit,
    setText,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    storageFull,
    dismissStorageWarning: useCallback(() => setStorageFull(false), []),
  };
}
