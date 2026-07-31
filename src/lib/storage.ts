import { newId } from './id';
import {
  COLORS,
  FASTENERS,
  FONTS,
  PAPERS,
  SHAPES,
  SURFACES,
  type Note,
  type WallState,
} from '../types';

const KEY = 'wallnut:v1';

const keysOf = <T extends { key: string }>(list: T[]) => new Set(list.map((i) => i.key));
const SURFACE_KEYS = keysOf(SURFACES);
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
        notes,
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
  return { version: 1, surface: 'cork', notes, nextZ: notes.length + 1 };
}

export function load(): WallState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return starterWall();
    const migrated = migrate(JSON.parse(raw));
    return migrated ?? starterWall();
  } catch {
    return starterWall();
  }
}

let saveTimer: number | undefined;

export function save(state: WallState): void {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Quota exceeded or storage disabled — the wall still works this session.
    }
  }, 400);
}

export function exportWall(state: WallState): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wallnut-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Runs imported files through the same validation path as load(). */
export async function importWall(file: File): Promise<WallState | null> {
  try {
    return migrate(JSON.parse(await file.text()));
  } catch {
    return null;
  }
}
