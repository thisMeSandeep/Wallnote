import { useEffect } from 'react';
import type { ToolMode } from '../types';

interface Args {
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onEscape: () => void;
  onTool: (mode: ToolMode) => void;
  onLight: () => void;
}

const TOOL_KEYS: Record<string, ToolMode> = { v: 'hand', p: 'pencil', e: 'eraser', s: 'string' };

/** Ignores keys typed while the caret is inside a note. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export function useHotkeys({ onUndo, onRedo, onDelete, onEscape, onTool, onLight }: Args) {
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

      // Single-letter switches below, but never while writing on a note.
      if (!mod && !e.altKey && !isTyping(e.target) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        onLight();
        return;
      }

      const tool = !mod && !e.altKey && !isTyping(e.target) && TOOL_KEYS[e.key.toLowerCase()];
      if (tool) {
        e.preventDefault();
        onTool(tool);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUndo, onRedo, onDelete, onEscape, onTool, onLight]);
}
