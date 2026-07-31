import { useEffect } from 'react';

interface Args {
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onEscape: () => void;
}

/** Ignores keys typed while the caret is inside a note. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export function useHotkeys({ onUndo, onRedo, onDelete, onEscape }: Args) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (e.key === 'Escape') {
        onEscape();
        return;
      }

      if (mod && e.key.toLowerCase() === 'z') {
        if (isTyping(e.target)) return; // let the browser undo inside the note
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping(e.target)) {
        e.preventDefault();
        onDelete();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUndo, onRedo, onDelete, onEscape]);
}
