import { useEffect } from 'react';
import type { ToolMode } from '../types';

interface Args {
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onEscape: () => void;
  onTool: (mode: ToolMode) => void;
}

const TOOL_KEYS: Record<string, ToolMode> = { v: 'hand', p: 'pencil', e: 'eraser' };

/** Ignores keys typed while the caret is inside a note. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export function useHotkeys({ onUndo, onRedo, onDelete, onEscape, onTool }: Args) {
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
        return;
      }

      // Single-letter tool switches, but never while writing on a note.
      const tool = !mod && !e.altKey && !isTyping(e.target) && TOOL_KEYS[e.key.toLowerCase()];
      if (tool) {
        e.preventDefault();
        onTool(tool);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUndo, onRedo, onDelete, onEscape, onTool]);
}
