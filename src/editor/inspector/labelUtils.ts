const labels: Record<string, string> = {
  text: '文案',
  title: '标题',
  description: '说明',
  variant: '样式',
  danger: '危险操作',
  dataSourceId: '数据源',
  columns: '表格列',
  actions: '操作项',
  fields: '字段',
  submitText: '提交按钮文案',
  open: '打开状态',
};

export function propLabel(key: string): string {
  return labels[key] ?? key;
}
