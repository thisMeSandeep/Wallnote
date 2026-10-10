import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { UpdatePrompt } from './components/UpdatePrompt';
import { WallSwitcher } from './components/WallSwitcher';
import { sound } from './lib/audio';
import {
  blankWall,
  loadIndex,
  newWallMeta,
  primeWall,
  removeWall,
  saveIndex,
} from './lib/storage';
import { WallScreen } from './WallScreen';
import type { SurfaceType, WallMeta, WallState } from './types';

/**
 * Runs a wall change inside a view transition so the old wall slides out and
 * the new one slides in (see the ::view-transition rules in wall.css). `dir`
 * says which way, following the picker's order. Browsers without the API, and
 * people who asked for less motion, get the change straight away.
 */
function transitionWalls(dir: 'next' | 'prev', update: () => void) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduce) {
    update();
    return;
  }
  const root = document.documentElement;
  root.dataset.wallDir = dir;
  // flushSync so the new wall is in the DOM when the browser takes its
  // "after" snapshot.
  const t = document.startViewTransition(() => flushSync(update));
  void t.finished.finally(() => delete root.dataset.wallDir);
}

/** "Wall 3", or the next free number if someone already took that name. */
function nextWallName(walls: WallMeta[]): string {
  const taken = new Set(walls.map((w) => w.name));
  let n = walls.length + 1;
  while (taken.has(`Wall ${n}`)) n++;
  return `Wall ${n}`;
}

export default function App() {
  const [index, setIndex] = useState(loadIndex);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    saveIndex(index);
  }, [index]);

  const active = index.walls.find((w) => w.id === index.activeId) ?? index.walls[0];

  useEffect(() => {
    document.title = `${active.name} · Wallnote`;
  }, [active.name]);

  // Lives up here, not in WallScreen, so a message survives switching walls.
  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const switchTo = useCallback(
    (id: string) => {
      const from = index.walls.findIndex((w) => w.id === index.activeId);
      const to = index.walls.findIndex((w) => w.id === id);
      if (to === -1 || from === to) return;
      transitionWalls(to > from ? 'next' : 'prev', () =>
        setIndex((i) => ({ ...i, activeId: id })),
      );
      sound.play('ui');
    },
    [index.walls, index.activeId],
  );

  const createWall = useCallback((name: string, state: WallState = blankWall()) => {
    let meta: WallMeta | undefined;
    // New walls join the end of the list, so they always arrive from the right.
    transitionWalls('next', () =>
      setIndex((i) => {
        // StrictMode runs updaters twice; minting once keeps the id stable.
        meta ??= newWallMeta(name || nextWallName(i.walls), state);
        primeWall(meta.id, state);
        return { ...i, activeId: meta.id, walls: [...i.walls, meta] };
      }),
    );
    sound.play('ui');
  }, []);

  const renameWall = useCallback((id: string, name: string) => {
    setIndex((i) => ({
      ...i,
      walls: i.walls.map((w) => (w.id === id ? { ...w, name } : w)),
    }));
  }, []);

  const deleteWall = useCallback(
    (id: string) => {
      const wall = index.walls.find((w) => w.id === id);
      if (!wall || index.walls.length < 2) return;
      const contents = wall.noteCount === 1 ? '1 note' : `${wall.noteCount} notes`;
      // History is per wall and goes with it, so this one really can't be undone.
      if (!window.confirm(`Take down "${wall.name}" and its ${contents}? This can't be undone.`)) {
        return;
      }
      removeWall(id);
      const update = () =>
        setIndex((i) => {
          const at = i.walls.findIndex((w) => w.id === id);
          const walls = i.walls.filter((w) => w.id !== id);
          const activeId = i.activeId === id ? walls[Math.max(0, at - 1)].id : i.activeId;
          return { ...i, activeId, walls };
        });
      // Taking down the wall you're on falls back to the one before it.
      if (id === index.activeId) transitionWalls('prev', update);
      else update();
      sound.play('peel');
      flash(`"${wall.name}" taken down`);
    },
    [index.walls, index.activeId, flash],
  );

  const toggleLight = useCallback(() => {
    setIndex((i) => ({
      ...i,
      walls: i.walls.map((w) => (w.id === i.activeId ? { ...w, lightOn: !w.lightOn } : w)),
    }));
    sound.play('switch');
  }, []);

  const syncMeta = useCallback((id: string, surface: SurfaceType, noteCount: number) => {
    setIndex((i) => {
      const wall = i.walls.find((w) => w.id === id);
      if (!wall || (wall.surface === surface && wall.noteCount === noteCount)) return i;
      return {
        ...i,
        walls: i.walls.map((w) => (w.id === id ? { ...w, surface, noteCount } : w)),
      };
    });
  }, []);

  const importAsWall = useCallback(
    (state: WallState, name: string) => {
      createWall(name, state);
      flash(`Hung "${name}" with ${state.notes.length} notes`);
    },
    [createWall, flash],
  );

  return (
    <div className="app">
      <WallScreen
        // A fresh mount per wall resets undo history, selection and tools.
        key={active.id}
        wallId={active.id}
        wallName={active.name}
        lightOn={active.lightOn}
        onToggleLight={toggleLight}
        switcher={
          <WallSwitcher
            walls={index.walls}
            activeId={active.id}
            onSwitch={switchTo}
            onCreate={createWall}
            onRename={renameWall}
            onDelete={deleteWall}
          />
        }
        flash={flash}
        onMeta={syncMeta}
        onImport={importAsWall}
      />

      {toast && <div className="toast">{toast}</div>}

      <UpdatePrompt />
    </div>
  );
}
