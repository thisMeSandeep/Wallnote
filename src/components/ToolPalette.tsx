import { PEN_COLORS, PEN_WIDTHS, type ToolMode } from '../types';

interface Props {
  mode: ToolMode;
  color: string;
  width: number;
  hasInk: boolean;
  onMode: (m: ToolMode) => void;
  onColor: (c: string) => void;
  onWidth: (w: number) => void;
  onClear: () => void;
}

const TOOLS: { key: ToolMode; label: string; hint: string; icon: JSX.Element }[] = [
  {
    key: 'hand',
    label: 'Hand',
    hint: 'Move and edit notes  ·  V',
    icon: (
      <path
        d="M6 9.5V5.2a1.2 1.2 0 0 1 2.4 0V9m0-.4V4a1.2 1.2 0 0 1 2.4 0v4.6m0-.2V5.4a1.2 1.2 0 0 1 2.4 0V10m0-2.2a1.2 1.2 0 0 1 2.4 0v4.9c0 2.6-1.9 4.3-4.4 4.3-2.6 0-3.8-1-5-3l-1.9-3.2a1.25 1.25 0 0 1 2-1.5L6 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    key: 'pencil',
    label: 'Pencil',
    hint: 'Draw on the wall  ·  P',
    icon: (
      <path
        d="M3.5 16.5l1-3.4L13.2 4.4a1.6 1.6 0 0 1 2.3 0l.6.6a1.6 1.6 0 0 1 0 2.3L7.4 16 4 17zM12.2 5.6l2.6 2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    key: 'eraser',
    label: 'Eraser',
    hint: 'Rub out strokes  ·  E',
    icon: (
      <path
        d="M8.4 16.5h8M4.2 13.1l4.4 4.4 8-8a1.7 1.7 0 0 0 0-2.4l-2.6-2.6a1.7 1.7 0 0 0-2.4 0l-7.4 7.4a1.7 1.7 0 0 0 0 1.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

/**
 * Floating over the top-left of the wall. Colour and width only appear with
 * the pencil up, so the palette stays out of the way in hand mode — which is
 * the default, and where most people will spend their time.
 */
export function ToolPalette({
  mode,
  color,
  width,
  hasInk,
  onMode,
  onColor,
  onWidth,
  onClear,
}: Props) {
  return (
    <div className="palette">
      <div className="palette__tools">
        {TOOLS.map((t) => (
          <button
            key={t.key}
            className={`palette__tool ${mode === t.key ? 'is-active' : ''}`}
            onClick={() => onMode(t.key)}
            title={t.hint}
            aria-label={t.label}
            aria-pressed={mode === t.key}
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
              {t.icon}
            </svg>
          </button>
        ))}
      </div>

      {mode === 'pencil' && (
        <div className="palette__opts">
          <div className="palette__colors">
            {PEN_COLORS.map((c) => (
              <button
                key={c.key}
                className={`palette__ink ${color === c.value ? 'is-active' : ''}`}
                style={{ background: c.value }}
                onClick={() => onColor(c.value)}
                title={c.label}
                aria-label={c.label}
              />
            ))}
          </div>

          <div className="palette__widths">
            {PEN_WIDTHS.map((w) => (
              <button
                key={w.value}
                className={`palette__width ${width === w.value ? 'is-active' : ''}`}
                onClick={() => onWidth(w.value)}
                title={w.label}
                aria-label={w.label}
              >
                <span style={{ width: w.value * 2.2, height: w.value * 2.2, background: color }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {mode !== 'hand' && hasInk && (
        <button className="palette__clear" onClick={onClear} title="Undo brings it back">
          Wipe the wall
        </button>
      )}
    </div>
  );
}
