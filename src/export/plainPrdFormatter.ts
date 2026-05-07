export function sectionTitle(level: number, title: string): string {
  return `${'#'.repeat(level)} ${title}`;
}

export function bullet(items: string[]): string {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- 暂未配置';
}
