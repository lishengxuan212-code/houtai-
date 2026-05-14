export type CanvasAssistRect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AlignmentGuide = {
  axis: 'x' | 'y';
  position: number;
  from: number;
  to: number;
  kind: 'frame' | 'node';
  label: string;
};

export type SpacingHint = {
  axis: 'x' | 'y';
  gap: number;
  start: number;
  end: number;
};

export type CanvasSnapResult = {
  rect: CanvasAssistRect;
  deltaX: number;
  deltaY: number;
  guides: AlignmentGuide[];
  spacingHints: SpacingHint[];
};

type Anchor = {
  axis: 'x' | 'y';
  value: number;
  offset: number;
  from: number;
  to: number;
  kind: 'frame' | 'node';
  label: string;
};

const DEFAULT_THRESHOLD = 6;

function xAnchors(rect: CanvasAssistRect, kind: 'frame' | 'node'): Anchor[] {
  return [
    { axis: 'x', value: rect.x, offset: 0, from: rect.y, to: rect.y + rect.height, kind, label: kind === 'frame' ? 'Frame left' : 'Left' },
    { axis: 'x', value: rect.x + rect.width / 2, offset: rect.width / 2, from: rect.y, to: rect.y + rect.height, kind, label: kind === 'frame' ? 'Frame center' : 'Center' },
    { axis: 'x', value: rect.x + rect.width, offset: rect.width, from: rect.y, to: rect.y + rect.height, kind, label: kind === 'frame' ? 'Frame right' : 'Right' },
  ];
}

function yAnchors(rect: CanvasAssistRect, kind: 'frame' | 'node'): Anchor[] {
  return [
    { axis: 'y', value: rect.y, offset: 0, from: rect.x, to: rect.x + rect.width, kind, label: kind === 'frame' ? 'Frame top' : 'Top' },
    { axis: 'y', value: rect.y + rect.height / 2, offset: rect.height / 2, from: rect.x, to: rect.x + rect.width, kind, label: kind === 'frame' ? 'Frame middle' : 'Middle' },
    { axis: 'y', value: rect.y + rect.height, offset: rect.height, from: rect.x, to: rect.x + rect.width, kind, label: kind === 'frame' ? 'Frame bottom' : 'Bottom' },
  ];
}

function closestSnap(movingAnchors: Anchor[], targetAnchors: Anchor[], threshold: number) {
  let best: { distance: number; delta: number; guide: AlignmentGuide } | undefined;
  for (const moving of movingAnchors) {
    for (const target of targetAnchors) {
      const delta = target.value - moving.value;
      const distance = Math.abs(delta);
      if (distance > threshold || (best && distance >= best.distance)) continue;
      best = {
        distance,
        delta,
        guide: {
          axis: moving.axis,
          position: target.value,
          from: Math.min(moving.from, target.from),
          to: Math.max(moving.to, target.to),
          kind: target.kind,
          label: target.label,
        },
      };
    }
  }
  return best;
}

function overlapsOnY(left: CanvasAssistRect, right: CanvasAssistRect) {
  return left.y < right.y + right.height && left.y + left.height > right.y;
}

function overlapsOnX(top: CanvasAssistRect, bottom: CanvasAssistRect) {
  return top.x < bottom.x + bottom.width && top.x + top.width > bottom.x;
}

export function detectEqualSpacing({
  moving,
  others,
  threshold = DEFAULT_THRESHOLD,
}: {
  moving: CanvasAssistRect;
  others: CanvasAssistRect[];
  threshold?: number;
}): SpacingHint[] {
  const hints: SpacingHint[] = [];
  const left = others.filter((item) => overlapsOnY(item, moving) && item.x + item.width <= moving.x).sort((a, b) => b.x + b.width - (a.x + a.width))[0];
  const right = others.filter((item) => overlapsOnY(item, moving) && item.x >= moving.x + moving.width).sort((a, b) => a.x - b.x)[0];
  if (left && right) {
    const leftGap = moving.x - (left.x + left.width);
    const rightGap = right.x - (moving.x + moving.width);
    if (Math.abs(leftGap - rightGap) <= threshold) hints.push({ axis: 'x', gap: Math.round((leftGap + rightGap) / 2), start: left.x + left.width, end: right.x });
  }

  const above = others.filter((item) => overlapsOnX(item, moving) && item.y + item.height <= moving.y).sort((a, b) => b.y + b.height - (a.y + a.height))[0];
  const below = others.filter((item) => overlapsOnX(item, moving) && item.y >= moving.y + moving.height).sort((a, b) => a.y - b.y)[0];
  if (above && below) {
    const topGap = moving.y - (above.y + above.height);
    const bottomGap = below.y - (moving.y + moving.height);
    if (Math.abs(topGap - bottomGap) <= threshold) hints.push({ axis: 'y', gap: Math.round((topGap + bottomGap) / 2), start: above.y + above.height, end: below.y });
  }
  return hints;
}

export function computeCanvasSnap({
  moving,
  others,
  frame,
  threshold = DEFAULT_THRESHOLD,
}: {
  moving: CanvasAssistRect;
  others: CanvasAssistRect[];
  frame: CanvasAssistRect;
  threshold?: number;
}): CanvasSnapResult {
  const targetXAnchors = [...xAnchors(frame, 'frame'), ...others.flatMap((item) => xAnchors(item, 'node'))];
  const targetYAnchors = [...yAnchors(frame, 'frame'), ...others.flatMap((item) => yAnchors(item, 'node'))];
  const xSnap = closestSnap(xAnchors(moving, 'node'), targetXAnchors, threshold);
  const ySnap = closestSnap(yAnchors(moving, 'node'), targetYAnchors, threshold);
  const deltaX = xSnap?.delta ?? 0;
  const deltaY = ySnap?.delta ?? 0;
  const rect = { ...moving, x: Math.round(moving.x + deltaX), y: Math.round(moving.y + deltaY) };
  return {
    rect,
    deltaX,
    deltaY,
    guides: [xSnap?.guide, ySnap?.guide].filter((guide): guide is AlignmentGuide => Boolean(guide)),
    spacingHints: detectEqualSpacing({ moving: rect, others, threshold }),
  };
}
