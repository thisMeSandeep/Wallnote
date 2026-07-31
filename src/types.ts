export type SurfaceType = 'cork' | 'whiteboard' | 'chalkboard' | 'brick' | 'wood' | 'plaster';
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

export interface WallState {
  version: 1;
  surface: SurfaceType;
  notes: Note[];
  nextZ: number;
}

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
