import { useEffect } from 'react';

export interface MenuState {
  id: string;
  x: number;
  y: number;
}

interface Props {
  menu: MenuState;
  onClose: () => void;
  onDuplicate: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ContextMenu({ menu, onClose, onDuplicate, onSendToBack, onDelete }: Props) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener('pointerdown', close);
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('blur', close);
    };
  }, [onClose]);

  const run = (fn: (id: string) => void) => () => {
    fn(menu.id);
    onClose();
  };

  return (
    <div
      className="menu"
      style={{ left: menu.x, top: menu.y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button onClick={run(onDuplicate)}>Duplicate</button>
      <button onClick={run(onSendToBack)}>Send to back</button>
      <hr />
      <button className="menu__danger" onClick={run(onDelete)}>
        Take off wall
      </button>
    </div>
  );
}
