import { memo, useEffect, useRef } from 'react';
import { Fastener } from './Fastener';
import type { Note as NoteModel } from '../types';

interface Props {
  note: NoteModel;
  selected: boolean;
  editing: boolean;
  onPointerDown: (e: React.PointerEvent, note: NoteModel) => void;
  onResizeDown: (e: React.PointerEvent, note: NoteModel) => void;
  onSelect: (id: string) => void;
  onStartEdit: (id: string) => void;
  onText: (id: string, text: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

function NoteImpl({
  note,
  selected,
  editing,
  onPointerDown,
  onResizeDown,
  onSelect,
  onStartEdit,
  onText,
  onContextMenu,
}: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);

  // contenteditable is uncontrolled on purpose: writing innerText back on every
  // keystroke would fight the caret. Sync only when not actively editing.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el || editing) return;
    if (el.innerText !== note.text) el.innerText = note.text;
  }, [note.text, editing]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || !editing) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [editing]);

  return (
    <div
      data-note-id={note.id}
      className={[
        'note',
        `note--${note.paper}`,
        `note--shape-${note.shape}`,
        `color-${note.color}`,
        `font-${note.font}`,
        selected ? 'is-selected' : '',
        editing ? 'is-editing' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        width: note.w,
        height: note.h,
        zIndex: note.z,
        transform: `translate(${note.x}px, ${note.y}px) rotate(${note.rotation}deg)`,
        ['--font-scale' as string]: note.fontScale,
      }}
      onPointerDown={(e) => {
        if (editing) return;
        onSelect(note.id);
        onPointerDown(e, note);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartEdit(note.id);
      }}
      onContextMenu={(e) => onContextMenu(e, note.id)}
    >
      <div className="note__paper" aria-hidden />
      <Fastener note={note} />

      <div
        ref={bodyRef}
        className="note__body"
        contentEditable={editing}
        suppressContentEditableWarning
        spellCheck={false}
        onInput={(e) => onText(note.id, (e.currentTarget as HTMLElement).innerText)}
        onBlur={(e) => onText(note.id, (e.currentTarget as HTMLElement).innerText)}
      />

      {note.text.trim() === '' && !editing && <div className="note__hint">double-click</div>}

      {selected && !editing && (
        <span
          className="note__handle"
          onPointerDown={(e) => onResizeDown(e, note)}
          aria-hidden
        />
      )}
    </div>
  );
}

export const Note = memo(NoteImpl);
