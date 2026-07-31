export type SurfaceType = 'cork' | 'whiteboard' | 'chalkboard' | 'brick' | 'wood' | 'plaster';
export type RoomKey =
  | 'auto'
  | 'taupe'
  | 'slate'
  | 'forest'
  | 'plum'
  | 'clay'
  | 'ink'
  | 'sand';
export type PaperType = 'sticky' | 'index' | 'notebook' | 'kraft' | 'graph' | 'scrap';
export type NoteShape = 'square' | 'portrait' | 'wide' | 'strip' | 'round' | 'tag';
export type Fastener = 'pin' | 'tape' | 'magnet' | 'none';
export type FontKey = 'caveat' | 'patrick' | 'kalam' | 'architects';
export type ColorKey =
  | 'canary'
  | 'mint'
  | 'sky'
  | 'blush'
  | 'coral'
  | 'lilac'
  | 'white'
  | 'kraft';

export interface Note {
  id: string;
  text: string;
  /** wall units, top-left corner */
  x: number;
  y: number;
  /** wall units */
  w: number;
  h: number;
  /** degrees */
  rotation: number;
  z: number;
  color: ColorKey;
  paper: PaperType;
  shape: NoteShape;
  fastener: Fastener;
  font: FontKey;
  /** multiplier on the base handwriting size, 0.8 - 1.6 */
  fontScale: number;
  createdAt: number;
  updatedAt: number;
}

export type ToolMode = 'hand' | 'pencil' | 'eraser';

/** A freehand mark on the wall itself, underneath the notes. */
export interface Stroke {
  id: string;
  /** Flat [x0,y0,x1,y1,...] in wall units — half the JSON of {x,y} objects. */
  points: number[];
  color: string;
  /** Wall units, so line weight scales with everything else. */
  width: number;
}

export interface WallState {
  version: 1;
  surface: SurfaceType;
  /** Colour of the room the wall hangs in. 'auto' follows the wall material. */
  room: RoomKey;
  notes: Note[];
  strokes: Stroke[];
  nextZ: number;
}

export const PEN_COLORS: { key: string; label: string; value: string }[] = [
  { key: 'graphite', label: 'Graphite', value: '#33302b' },
  { key: 'chalk', label: 'Chalk', value: '#f2efe6' },
  { key: 'red', label: 'Red', value: '#c0392b' },
  { key: 'blue', label: 'Blue', value: '#2f6da4' },
  { key: 'green', label: 'Green', value: '#2c7a4b' },
  { key: 'amber', label: 'Amber', value: '#e0a021' },
];

export const PEN_WIDTHS: { label: string; value: number }[] = [
  { label: 'Fine', value: 2.5 },
  { label: 'Medium', value: 5 },
  { label: 'Broad', value: 9 },
];

/** The instrument you'd reach for on each material. */
export const SURFACE_PEN: Record<SurfaceType, string> = {
  cork: '#33302b',
  whiteboard: '#2f6da4',
  chalkboard: '#f2efe6',
  brick: '#f2efe6',
  wood: '#33302b',
  plaster: '#33302b',
};

/** How close the eraser has to pass to a stroke to take it, in wall units. */
export const ERASER_RADIUS = 14;

/** Samples closer together than this are dropped — see lib/ink.ts. */
export const MIN_SAMPLE_GAP = 2;

/** The wall is always this many logical units. Positions never get re-mapped. */
export const WALL_W = 1600;
export const WALL_H = 1000;

export const SURFACES: { key: SurfaceType; label: string }[] = [
  { key: 'cork', label: 'Cork' },
  { key: 'whiteboard', label: 'Whiteboard' },
  { key: 'chalkboard', label: 'Chalkboard' },
  { key: 'brick', label: 'Brick' },
  { key: 'wood', label: 'Wood' },
  { key: 'plaster', label: 'Plaster' },
];

export const ROOMS: { key: RoomKey; label: string }[] = [
  { key: 'auto', label: 'Match the wall' },
  { key: 'taupe', label: 'Warm taupe' },
  { key: 'slate', label: 'Cool slate' },
  { key: 'forest', label: 'Forest' },
  { key: 'plum', label: 'Plum' },
  { key: 'clay', label: 'Clay' },
  { key: 'ink', label: 'Ink' },
  { key: 'sand', label: 'Sand (light)' },
];

export const PAPERS: { key: PaperType; label: string }[] = [
  { key: 'sticky', label: 'Sticky' },
  { key: 'index', label: 'Index card' },
  { key: 'notebook', label: 'Notebook' },
  { key: 'kraft', label: 'Kraft' },
  { key: 'graph', label: 'Graph' },
  { key: 'scrap', label: 'Torn scrap' },
];

export const SHAPES: { key: NoteShape; label: string; w: number; h: number }[] = [
  { key: 'square', label: 'Square', w: 190, h: 190 },
  { key: 'portrait', label: 'Portrait', w: 175, h: 230 },
  { key: 'wide', label: 'Wide', w: 260, h: 170 },
  { key: 'strip', label: 'Strip', w: 300, h: 96 },
  { key: 'round', label: 'Round', w: 200, h: 200 },
  { key: 'tag', label: 'Tag', w: 170, h: 240 },
];

export const FASTENERS: { key: Fastener; label: string }[] = [
  { key: 'pin', label: 'Pushpin' },
  { key: 'tape', label: 'Tape' },
  { key: 'magnet', label: 'Magnet' },
  { key: 'none', label: 'Bare' },
];

export const FONTS: { key: FontKey; label: string; stack: string }[] = [
  { key: 'caveat', label: 'Caveat', stack: '"Caveat", cursive' },
  { key: 'patrick', label: 'Patrick Hand', stack: '"Patrick Hand", cursive' },
  { key: 'kalam', label: 'Kalam', stack: '"Kalam", cursive' },
  { key: 'architects', label: 'Architects', stack: '"Architects Daughter", cursive' },
];

export const COLORS: { key: ColorKey; label: string }[] = [
  { key: 'canary', label: 'Canary' },
  { key: 'mint', label: 'Mint' },
  { key: 'sky', label: 'Sky' },
  { key: 'blush', label: 'Blush' },
  { key: 'coral', label: 'Coral' },
  { key: 'lilac', label: 'Lilac' },
  { key: 'white', label: 'White' },
  { key: 'kraft', label: 'Kraft' },
];

/** Shapes whose aspect ratio is locked while resizing. */
export const LOCKED_ASPECT: NoteShape[] = ['strip', 'tag', 'round'];

export const MIN_NOTE = 90;
export const MAX_NOTE = 560;
