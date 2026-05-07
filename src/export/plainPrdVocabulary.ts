export const forbiddenPlainPrdTerms = [
  'JSON',
  'DSL',
  'schema',
  'runtime',
  'mock',
  'operation',
  'node',
  'component tree',
  'store',
  'Zustand',
  'Zod',
  'renderer',
  'Interaction Runner',
  'DataSource',
];

export function sanitizePlainPrd(markdown: string): string {
  return forbiddenPlainPrdTerms.reduce((current, term) => current.replace(new RegExp(escapeRegExp(term), 'gi'), ''), markdown);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
