import { newId } from './id';
import {
  COLORS,
  FASTENERS,
  FONTS,
  PAPERS,
  ROOMS,
  SHAPES,
  SURFACES,
  BIN_CAP,
  type Link,
  type Note,
  type Stroke,
  type WallIndex,
  type WallMeta,
  type WallState,
} from '../types';

/** The list of walls. Each wall's contents live under its own key. */
const INDEX_KEY = 'wallnote:walls';
const wallKey = (id: string) => `wallnote:wall:${id}`;
/** Where the one and only wall lived before there could be several. */
const SINGLE_KEY = 'wallnote:v1';
/** Read-only fallbacks from before the rename, newest first. */
const LEGACY_KEYS = ['wallnut:v1'];

export const MAX_WALL_NAME = 40;

const keysOf = <T extends { key: string }>(list: T[]) => new Set(list.map((i) => i.key));
const SURFACE_KEYS = keysOf(SURFACES);
const ROOM_KEYS = keysOf(ROOMS);
const PAPER_KEYS = keysOf(PAPERS);
const SHAPE_KEYS = keysOf(SHAPES);
const FASTENER_KEYS = keysOf(FASTENERS);
const FONT_KEYS = keysOf(FONTS);
const COLOR_KEYS = keysOf(COLORS);

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function pick<T extends string>(v: unknown, allowed: Set<string>, fallback: T): T {
  return typeof v === 'string' && allowed.has(v) ? (v as T) : fallback;
}

function coerceNote(raw: unknown, index: number): Note | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const shape = pick(r.shape, SHAPE_KEYS, 'square' as const);
  const def = SHAPES.find((s) => s.key === shape)!;
  const now = Date.now();
  return {
    id: typeof r.id === 'string' && r.id ? r.id : newId(),
    text: typeof r.text === 'string' ? r.text : '',
    x: num(r.x, 80 + index * 24),
    y: num(r.y, 80 + index * 24),
    w: num(r.w, def.w),
    h: num(r.h, def.h),
    rotation: num(r.rotation, 0),
    z: num(r.z, index + 1),
    color: pick(r.color, COLOR_KEYS, 'canary' as const),
    paper: pick(r.paper, PAPER_KEYS, 'sticky' as const),
    shape,
    fastener: pick(r.fastener, FASTENER_KEYS, 'pin' as const),
    font: pick(r.font, FONT_KEYS, 'caveat' as const),
    fontScale: num(r.fontScale, 1),
    createdAt: num(r.createdAt, now),
    updatedAt: num(r.updatedAt, now),
  };
}

function coerceStroke(raw: unknown): Stroke | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.points)) return null;

  const points = r.points.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  // Coordinates come in pairs; an odd count means the data is corrupt.
  if (points.length < 2 || points.length % 2 !== 0) return null;

  return {
    id: typeof r.id === 'string' && r.id ? r.id : newId(),
    points,
    color: typeof r.color === 'string' ? r.color : '#33302b',
    width: num(r.width, 5),
  };
}

function coerceLink(raw: unknown): Link | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.a !== 'string' || typeof r.b !== 'string' || r.a === r.b) return null;
  return { id: typeof r.id === 'string' && r.id ? r.id : newId(), a: r.a, b: r.b };
}

/**
 * Versioned upgrade path. Only v1 exists today, but retrofitting this once
 * people have data in localStorage is the painful path.
 */
export function migrate(raw: unknown): WallState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const version = num(r.version, 1);

  switch (version) {
    case 1: {
      const notes = Array.isArray(r.notes)
        ? r.notes.map(coerceNote).filter((n): n is Note => n !== null)
        : [];
      return {
        version: 1,
        surface: pick(r.surface, SURFACE_KEYS, 'cork' as const),
        // Walls saved before rooms existed simply fall back to 'auto', which
        // is the behaviour they already had.
        room: pick(r.room, ROOM_KEYS, 'auto' as const),
        notes,
        // Walls saved before the pencil existed simply have no ink.
        strokes: Array.isArray(r.strokes)
          ? r.strokes.map(coerceStroke).filter((s): s is Stroke => s !== null)
          : [],
        // Likewise walls from before string and the bin.
        links: Array.isArray(r.links)
          ? r.links.map(coerceLink).filter((l): l is Link => l !== null)
          : [],
        binned: Array.isArray(r.binned)
          ? r.binned
              .map(coerceNote)
              .filter((n): n is Note => n !== null)
              .slice(0, BIN_CAP)
          : [],
        nextZ: Math.max(1, num(r.nextZ, notes.length + 1)),
      };
    }
    default:
      return null;
  }
}

function tilt(): number {
  return Math.round((Math.random() * 6 - 3) * 10) / 10;
}

export function starterWall(): WallState {
  const now = Date.now();
  const base = {
    rotation: 0,
    fontScale: 1,
    createdAt: now,
    updatedAt: now,
  };
  const notes: Note[] = [
    {
      ...base,
      id: newId(),
      text: 'Double-click the wall\nto stick a new note',
      x: 250,
      y: 200,
      w: 190,
      h: 190,
      z: 1,
      rotation: tilt(),
      color: 'canary',
      paper: 'sticky',
      shape: 'square',
      fastener: 'none',
      font: 'caveat',
    },
    {
      ...base,
      id: newId(),
      text: 'Drag me anywhere.\nDrag me off the wall\nto take me down.',
      x: 640,
      y: 300,
      w: 260,
      h: 170,
      z: 2,
      rotation: tilt(),
      color: 'sky',
      paper: 'index',
      shape: 'wide',
      fastener: 'pin',
      font: 'patrick',
    },
    {
      ...base,
      id: newId(),
      text: 'milk\neggs\nlemons',
      x: 1080,
      y: 190,
      w: 175,
      h: 230,
      z: 3,
      rotation: tilt(),
      color: 'mint',
      paper: 'notebook',
      shape: 'portrait',
      fastener: 'tape',
      font: 'kalam',
    },
    {
      ...base,
      id: newId(),
      text: 'change the wall up top',
      x: 520,
      y: 640,
      w: 300,
      h: 96,
      z: 4,
      rotation: tilt(),
      color: 'kraft',
      paper: 'kraft',
      shape: 'strip',
      fastener: 'magnet',
      font: 'architects',
    },
  ];
  return {
    version: 1,
    surface: 'cork',
    room: 'auto',
    notes,
    strokes: [],
    links: [],
    binned: [],
    nextZ: notes.length + 1,
  };
}

export function blankWall(): WallState {
  return {
    version: 1,
    surface: 'cork',
    room: 'auto',
    notes: [],
    strokes: [],
    links: [],
    binned: [],
    nextZ: 1,
  };
}

/**
 * Walls that exist in memory but haven't reached localStorage yet: a fresh
 * import, or the adopted single wall when copying it hit the quota. load()
 * looks here first, and a successful save() clears the entry.
 */
const unsaved = new Map<string, WallState>();

/** Hands a new wall's contents to the next load() of that id. */
export function primeWall(id: string, state: WallState): void {
  unsaved.set(id, state);
}

export function newWallMeta(name: string, state: WallState): WallMeta {
  return {
    id: newId(),
    name,
    surface: state.surface,
    noteCount: state.notes.length,
    lightOn: true,
    createdAt: Date.now(),
  };
}

function coerceMeta(raw: unknown): WallMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) return null;
  return {
    id: r.id,
    name: typeof r.name === 'string' && r.name.trim() ? r.name : 'Untitled wall',
    surface: pick(r.surface, SURFACE_KEYS, 'cork' as const),
    noteCount: num(r.noteCount, 0),
    // Walls listed before the bulb was fitted have always been lit.
    lightOn: r.lightOn !== false,
    createdAt: num(r.createdAt, Date.now()),
  };
}

function coerceIndex(raw: unknown): WallIndex | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.walls)) return null;
  const walls = r.walls.map(coerceMeta).filter((w): w is WallMeta => w !== null);
  if (walls.length === 0) return null;
  const activeId = walls.some((w) => w.id === r.activeId) ? (r.activeId as string) : walls[0].id;
  return { version: 1, activeId, walls };
}

function readSingleWall(): WallState | null {
  try {
    // Fall back to the wall saved under the old name, if that's all there is.
    for (const key of [SINGLE_KEY, ...LEGACY_KEYS]) {
      const raw = localStorage.getItem(key);
      if (raw) return migrate(JSON.parse(raw));
    }
  } catch {
    // Corrupt data reads as no wall, same as it always has.
  }
  return null;
}

/**
 * First run with more than one wall: whatever was on the single wall becomes
 * "My wall". It's moved rather than copied — an ink-heavy wall stored twice
 * could blow the quota — and the old key only goes once the copy has landed.
 * The pre-rename legacy entry is still left alone as a backup.
 */
function adoptSingleWall(): WallIndex {
  const state = readSingleWall() ?? starterWall();
  const meta = newWallMeta('My wall', state);
  const index: WallIndex = { version: 1, activeId: meta.id, walls: [meta] };
  primeWall(meta.id, state);
  try {
    localStorage.setItem(wallKey(meta.id), JSON.stringify(state));
    unsaved.delete(meta.id);
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    localStorage.removeItem(SINGLE_KEY);
  } catch {
    // Still in `unsaved`. The wall's first save retries and reports failure.
  }
  return index;
}

export function loadIndex(): WallIndex {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const index = raw ? coerceIndex(JSON.parse(raw)) : null;
    if (index) return index;
  } catch {
    // Fall through and rebuild from the single wall.
  }
  return adoptSingleWall();
}

/** The index is tiny and changes rarely, so it skips the debounce. */
export function saveIndex(index: WallIndex): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // A full quota also fails the wall saves, and those report it.
  }
}

export function load(id: string): WallState {
  const pending = unsaved.get(id);
  if (pending) return pending;
  try {
    const raw = localStorage.getItem(wallKey(id));
    return (raw && migrate(JSON.parse(raw))) || blankWall();
  } catch {
    return blankWall();
  }
}

/* One timer per wall: switching walls inside the debounce must not cancel the
   save of the wall being left. */
const saveTimers = new Map<string, number>();

/**
 * Ink is the first thing here that can grow without bound, so a failed write
 * has to be visible. Silently dropping it would mean losing a drawing session
 * with no warning at all.
 */
export function save(id: string, state: WallState, onError?: () => void): void {
  window.clearTimeout(saveTimers.get(id));
  saveTimers.set(
    id,
    window.setTimeout(() => {
      saveTimers.delete(id);
      try {
        localStorage.setItem(wallKey(id), JSON.stringify(state));
        unsaved.delete(id);
      } catch {
        onError?.();
      }
    }, 400),
  );
}

export function removeWall(id: string): void {
  window.clearTimeout(saveTimers.get(id));
  saveTimers.delete(id);
  unsaved.delete(id);
  try {
    localStorage.removeItem(wallKey(id));
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'wall'
  );
}

/** The name rides along in the file so an import comes back under it. */
export function exportWall(state: WallState, name: string): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify({ name, ...state }, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wallnote-${slug(name)}-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Runs imported files through the same validation path as load(). */
export async function importWall(file: File): Promise<{ state: WallState; name: string } | null> {
  try {
    const raw: unknown = JSON.parse(await file.text());
    const state = migrate(raw);
    if (!state) return null;
    const saved = (raw as Record<string, unknown>).name;
    const name =
      typeof saved === 'string' && saved.trim() ? saved.trim() : file.name.replace(/\.json$/i, '');
    return { state, name: name.slice(0, MAX_WALL_NAME) || 'Imported wall' };
  } catch {
    return null;
  }
}
