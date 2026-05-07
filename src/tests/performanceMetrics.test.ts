import { describe, expect, it, beforeEach } from 'vitest';
import { getMetricSnapshot, incrementMetric, measureMetric, recordDuration, resetMetrics } from '../editor/performance/performanceMetrics';

describe('performanceMetrics', () => {
  beforeEach(() => {
    resetMetrics();
  });

  it('increments named counters', () => {
    expect(incrementMetric('nodeRender')).toBe(1);
    expect(incrementMetric('nodeRender', 2)).toBe(3);

    expect(getMetricSnapshot().counters.nodeRender).toBe(3);
  });

  it('records operation durations and recent operation', () => {
    recordDuration('librarySearch', 12.345);

    const snapshot = getMetricSnapshot();
    expect(snapshot.durations.librarySearch).toEqual([12.35]);
    expect(snapshot.recentOperation).toEqual({ name: 'librarySearch', durationMs: 12.35 });
  });

  it('measures synchronous operations', () => {
    const result = measureMetric('selection', () => 'selected');

    expect(result).toBe('selected');
    expect(getMetricSnapshot().durations.selection?.length).toBe(1);
  });

  it('returns immutable snapshots', () => {
    incrementMetric('storeUpdate');
    const snapshot = getMetricSnapshot();
    snapshot.counters.storeUpdate = 999;

    expect(getMetricSnapshot().counters.storeUpdate).toBe(1);
  });
});
