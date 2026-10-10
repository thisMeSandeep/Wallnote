/**
 * Hover (or focus) the "?" to see what the app responds to. Kept in sync by
 * hand with useHotkeys and the pointer handlers on Note — if you add a
 * binding there, add it here.
 */

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

const MOD = isMac ? '⌘' : 'Ctrl';
const DEL = isMac ? 'Delete' : 'Del';

const KEYS: { keys: string[]; label: string }[] = [
  { keys: [MOD, 'Z'], label: 'Undo' },
  { keys: [MOD, '⇧', 'Z'], label: 'Redo' },
  { keys: [DEL], label: 'Take selected note off the wall' },
  { keys: ['V'], label: 'Hand — move and edit notes' },
  { keys: ['P'], label: 'Pencil — draw on the wall' },
  { keys: ['E'], label: 'Eraser — rub out strokes' },
  { keys: ['S'], label: 'String — tie notes together' },
  { keys: ['L'], label: 'Light switch' },
  { keys: ['Esc'], label: 'Back to the hand / close menu' },
];

const POINTER: { action: string; label: string }[] = [
  { action: 'Double-click wall', label: 'Stick up a new note' },
  { action: 'Double-click note', label: 'Write on it' },
  { action: 'Drag note', label: 'Move it around' },
  { action: 'Drag off the wall', label: 'Crumple it into the bin' },
  { action: 'Click the bin', label: 'Fish a note back out' },
  { action: 'Drag corner handle', label: 'Resize' },
  { action: 'Click note', label: 'Open the style panel' },
  { action: 'Click bare wall', label: 'Close the panel' },
  { action: 'Right-click note', label: 'Duplicate, send to back, remove' },
  { action: 'Drag with pencil', label: 'Draw — notes stay on top of the ink' },
  { action: 'Drag with eraser', label: 'Rub out whole strokes' },
  { action: 'Drag note to note', label: 'Tie red string (string tool)' },
  { action: 'Click a string', label: 'Cut it (string tool)' },
  { action: 'Click the bulb', label: 'Pull the cord — lights on or off' },
  { action: 'Move in the dark', label: 'Your pointer is a torch' },
];

const NOTES = 'Sound effects are off by default — the speaker button turns them on.';

export function ShortcutsHelp() {
  return (
    <div className="help">
      <button
        className="help__btn"
        aria-label="Keyboard shortcuts"
        aria-describedby="shortcuts-pop"
      >
        ?
      </button>

      <div className="help__pop" id="shortcuts-pop" role="tooltip">
        <h4>Keys</h4>
        <ul>
          {KEYS.map((s) => (
            <li key={s.label}>
              <span className="help__keys">
                {s.keys.map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </span>
              <span className="help__label">{s.label}</span>
            </li>
          ))}
        </ul>

        <h4>Mouse</h4>
        <ul>
          {POINTER.map((s) => (
            <li key={s.action}>
              <span className="help__action">{s.action}</span>
              <span className="help__label">{s.label}</span>
            </li>
          ))}
        </ul>

        <p className="help__note">{NOTES}</p>
      </div>
    </div>
  );
}
