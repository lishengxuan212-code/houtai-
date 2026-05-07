export type PerformanceMetricSnapshot = {
  counters: Record<string, number>;
  durations: Record<string, number[]>;
  recentOperation?: {
    name: string;
    durationMs: number;
  };
};

const counters: Record<string, number> = {};
const durations: Record<string, number[]> = {};
let recentOperation: PerformanceMetricSnapshot['recentOperation'];

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now();
  return Date.now();
}

export function incrementMetric(name: string, amount = 1): number {
  counters[name] = (counters[name] ?? 0) + amount;
  return counters[name];
}

export function recordDuration(name: string, durationMs: number): void {
  const rounded = Number(durationMs.toFixed(2));
  durations[name] = [...(durations[name] ?? []), rounded];
  recentOperation = { name, durationMs: rounded };
}

export function measureMetric<T>(name: string, fn: () => T): T {
  const start = nowMs();
  try {
    return fn();
  } finally {
    recordDuration(name, nowMs() - start);
  }
}

export function resetMetrics(): void {
  Object.keys(counters).forEach((key) => delete counters[key]);
  Object.keys(durations).forEach((key) => delete durations[key]);
  recentOperation = undefined;
}

export function getMetricSnapshot(): PerformanceMetricSnapshot {
  return {
    counters: { ...counters },
    durations: Object.fromEntries(Object.entries(durations).map(([key, value]) => [key, [...value]])),
    ...(recentOperation ? { recentOperation: { ...recentOperation } } : {}),
  };
}
