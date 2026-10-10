/**
 * What comes through the window when the bulb is off, by local time of day.
 *
 * With the light on nothing here shows. With it off, the wall is lit only by
 * the window to the right: full daylight at noon (barely dimmer than the
 * bulb), low gold at sunset, cool blue moonlight at night. Values in between
 * keyframes are interpolated, so the room drifts rather than steps.
 */

type RGB = [number, number, number];

interface Keyframe {
  hour: number;
  /** Multiply colours for the wall: nearest the window, mid-wall, far side. */
  near: RGB;
  mid: RGB;
  far: RGB;
  /** How dark the room around the wall gets, 0-1. */
  room: number;
  /** Colour the room's darkness leans toward. */
  roomTint: RGB;
  /** Height the light enters at, as % of the wall. Low sun comes in low. */
  y: number;
}

const NIGHT: Omit<Keyframe, 'hour'> = {
  near: [128, 140, 178],
  mid: [72, 82, 116],
  far: [34, 40, 60],
  room: 0.9,
  roomTint: [20, 26, 44],
  y: 18,
};

const KEYFRAMES: Keyframe[] = [
  { hour: 0, ...NIGHT },
  { hour: 5, ...NIGHT },
  {
    hour: 6.5, // dawn: rose and grey
    near: [214, 172, 164],
    mid: [140, 112, 118],
    far: [62, 52, 64],
    room: 0.72,
    roomTint: [44, 30, 38],
    y: 50,
  },
  {
    hour: 8.5, // morning
    near: [242, 240, 232],
    mid: [210, 208, 202],
    far: [158, 156, 154],
    room: 0.3,
    roomTint: [30, 30, 34],
    y: 24,
  },
  {
    hour: 15.5, // afternoon, warming slightly
    near: [246, 238, 220],
    mid: [212, 200, 180],
    far: [152, 142, 128],
    room: 0.34,
    roomTint: [34, 30, 26],
    y: 30,
  },
  {
    hour: 18, // golden hour
    near: [255, 192, 124],
    mid: [192, 128, 88],
    far: [86, 58, 50],
    room: 0.62,
    roomTint: [52, 30, 18],
    y: 55,
  },
  {
    hour: 19.5, // dusk
    near: [168, 150, 192],
    mid: [100, 92, 132],
    far: [46, 44, 72],
    room: 0.82,
    roomTint: [28, 26, 46],
    y: 40,
  },
  { hour: 21, ...NIGHT },
  { hour: 24, ...NIGHT },
];

export interface Ambient {
  vars: Record<string, string>;
  /** Dark enough that a torch makes sense and glow paper shows. */
  dark: boolean;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: RGB, b: RGB, t: number) => a.map((v, i) => Math.round(lerp(v, b[i], t))).join(' ');

export function ambientAt(hour: number): Ambient {
  const h = ((hour % 24) + 24) % 24;
  const i = KEYFRAMES.findIndex((k) => k.hour > h);
  const a = KEYFRAMES[i - 1];
  const b = KEYFRAMES[i];
  const t = (h - a.hour) / (b.hour - a.hour);
  const room = lerp(a.room, b.room, t);
  return {
    vars: {
      '--amb-near': mix(a.near, b.near, t),
      '--amb-mid': mix(a.mid, b.mid, t),
      '--amb-far': mix(a.far, b.far, t),
      '--amb-room': room.toFixed(3),
      '--amb-room-tint': mix(a.roomTint, b.roomTint, t),
      '--amb-y': `${lerp(a.y, b.y, t).toFixed(1)}%`,
    },
    dark: room >= 0.55,
  };
}

/**
 * Local time as a fractional hour. `?hour=21` in the URL pins it, for seeing
 * night at noon.
 */
export function currentHour(): number {
  const pinned = new URLSearchParams(window.location.search).get('hour');
  if (pinned && Number.isFinite(Number(pinned))) return Number(pinned);
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}
