import type { Operation } from './types';

export type HistoryEntry = {
  id: string;
  label: string;
  operations: Operation[];
  inverseOperations: Operation[];
  createdAt: string;
};

export function createHistoryEntry({
  id,
  label,
  operations,
  inverseOperations,
  createdAt = new Date().toISOString(),
}: {
  id: string;
  label: string;
  operations: Operation[];
  inverseOperations: Operation[];
  createdAt?: string;
}): HistoryEntry {
  return {
    id,
    label,
    operations: structuredClone(operations),
    inverseOperations: structuredClone(inverseOperations),
    createdAt,
  };
}

export function mergeConsecutiveTextEdits(entries: HistoryEntry[]): HistoryEntry[] {
  return entries.reduce<HistoryEntry[]>((result, entry) => {
    const previous = result.at(-1);
    const currentOperation = entry.operations[0];
    const previousOperation = previous?.operations.at(-1);
    const currentInverse = entry.inverseOperations[0];
    const previousInverse = previous?.inverseOperations[0];

    if (
      previous &&
      currentOperation?.type === 'updateNodeProps' &&
      previousOperation?.type === 'updateNodeProps' &&
      currentInverse?.type === 'updateNodeProps' &&
      previousInverse?.type === 'updateNodeProps' &&
      currentOperation.pageId === previousOperation.pageId &&
      currentOperation.nodeId === previousOperation.nodeId
    ) {
      result[result.length - 1] = {
        ...previous,
        operations: [currentOperation],
        inverseOperations: [previousInverse],
        createdAt: entry.createdAt,
      };
      return result;
    }

    result.push(entry);
    return result;
  }, []);
}
