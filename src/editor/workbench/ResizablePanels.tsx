import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

const KEY = 'admin-prototype-studio.workbench-layout.v2';
const DEFAULT_LEFT_WIDTH = 272;
const DEFAULT_RIGHT_WIDTH = 304;
const MIN_LEFT_WIDTH = 208;
const MAX_LEFT_WIDTH = 416;
const MIN_RIGHT_WIDTH = 240;
const MAX_RIGHT_WIDTH = 416;
const DIVIDER_WIDTH = 5;

export function ResizablePanels({ left, center, right }: { left: ReactNode; center: ReactNode; right: ReactNode }) {
  const initial = () => {
    if (typeof localStorage === 'undefined') return { leftWidth: DEFAULT_LEFT_WIDTH, rightWidth: DEFAULT_RIGHT_WIDTH };
    const raw = localStorage.getItem(KEY);
    if (!raw) return { leftWidth: DEFAULT_LEFT_WIDTH, rightWidth: DEFAULT_RIGHT_WIDTH };
    try {
      const parsed = JSON.parse(raw) as { leftWidth?: number; rightWidth?: number };
      return {
        leftWidth: parsed.leftWidth ?? DEFAULT_LEFT_WIDTH,
        rightWidth: parsed.rightWidth ?? DEFAULT_RIGHT_WIDTH,
      };
    } catch {
      return { leftWidth: DEFAULT_LEFT_WIDTH, rightWidth: DEFAULT_RIGHT_WIDTH };
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
        if (side === 'left') setLeftWidth(Math.min(MAX_LEFT_WIDTH, Math.max(MIN_LEFT_WIDTH, startLeft + moveEvent.clientX - startX)));
        if (side === 'right') setRightWidth(Math.min(MAX_RIGHT_WIDTH, Math.max(MIN_RIGHT_WIDTH, startRight - (moveEvent.clientX - startX))));
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
    <div className="workbench-grid" style={{ gridTemplateColumns: `${leftWidth}px ${DIVIDER_WIDTH}px minmax(0, 1fr) ${DIVIDER_WIDTH}px ${rightWidth}px` }}>
      {left}
      <div className="resize-divider" onMouseDown={beginResize('left')} />
      {center}
      <div className="resize-divider" onMouseDown={beginResize('right')} />
      {right}
    </div>
  );
}
