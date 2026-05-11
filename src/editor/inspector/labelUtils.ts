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
  label: '标签',
  placeholder: '占位文案',
  fieldKey: '字段标识',
  options: '选项',
  content: '内容',
  src: '图片地址',
  alt: '图片说明',
  fit: '适配方式',
  width: '宽度',
  height: '高度',
  color: '颜色',
  background: '背景',
  status: '状态',
  amount: '金额',
  value: '值',
};

export function propLabel(key: string): string {
  return labels[key] ?? key;
}
