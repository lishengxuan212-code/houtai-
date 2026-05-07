import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

const KEY = 'admin-prototype-studio.workbench-layout';

export function ResizablePanels({ left, center, right }: { left: ReactNode; center: ReactNode; right: ReactNode }) {
  const initial = () => {
    if (typeof localStorage === 'undefined') return { leftWidth: 340, rightWidth: 380 };
    const raw = localStorage.getItem(KEY);
    if (!raw) return { leftWidth: 340, rightWidth: 380 };
    try {
      const parsed = JSON.parse(raw) as { leftWidth?: number; rightWidth?: number };
      return {
        leftWidth: parsed.leftWidth ?? 340,
        rightWidth: parsed.rightWidth ?? 380,
      };
    } catch {
      return { leftWidth: 340, rightWidth: 380 };
    }
  };
  const [{ leftWidth: initialLeftWidth, rightWidth: initialRightWidth }] = useState(initial);
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [rightWidth, setRightWidth] = useState(initialRightWidth);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify({ leftWidth, rightWidth }));
  }, [leftWidth, rightWidth]);

  function beginResize(side: 'left' | 'right') {
    return (event: React.MouseEvent) => {
      event.preventDefault();
      const startX = event.clientX;
      const startLeft = leftWidth;
      const startRight = rightWidth;
      const move = (moveEvent: MouseEvent) => {
        if (side === 'left') setLeftWidth(Math.min(520, Math.max(260, startLeft + moveEvent.clientX - startX)));
        if (side === 'right') setRightWidth(Math.min(520, Math.max(300, startRight - (moveEvent.clientX - startX))));
      };
      const up = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    };
  }

  return (
    <div className="workbench-grid" style={{ gridTemplateColumns: `${leftWidth}px 6px minmax(0, 1fr) 6px ${rightWidth}px` }}>
      {left}
      <div className="resize-divider" onMouseDown={beginResize('left')} />
      {center}
      <div className="resize-divider" onMouseDown={beginResize('right')} />
      {right}
    </div>
  );
}
