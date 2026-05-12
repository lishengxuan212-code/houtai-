import type { JsonRecord, JsonValue } from '../domain/types';
import type { ImagePrototypeAnalysis, ImagePrototypePlan } from './imagePrototype';
import type { AiModelConfig } from './modelSettings';

type ChatResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toJsonValue(value: unknown): JsonValue | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.flatMap((item): JsonValue[] => {
      const next = toJsonValue(item);
      return next === undefined ? [] : [next];
    });
  }
  if (!isRecord(value)) return undefined;
  const record: JsonRecord = {};
  for (const [key, item] of Object.entries(value)) {
    const next = toJsonValue(item);
    if (next !== undefined) record[key] = next;
  }
  return record;
}

function toJsonRecord(value: unknown): JsonRecord {
  const normalized = toJsonValue(value);
  return isRecord(normalized) && !Array.isArray(normalized) ? normalized : {};
}

const COMPONENT_PROP_KEYS = [
  'dataSourceId',
  'columns',
  'fields',
  'actions',
  'rowActions',
  'data',
  'rows',
  'title',
  'text',
  'submitText',
  'items',
  'options',
  'placeholder',
  'value',
  'label',
  'fieldKey',
  'variant',
  'status',
  'content',
  'src',
  'alt',
];

function componentPropsFromRecord(value: Record<string, unknown>, type: string | undefined): JsonRecord {
  const props: JsonRecord = {};
  for (const key of COMPONENT_PROP_KEYS) {
    const next = toJsonValue(value[key]);
    if (next !== undefined) props[key] = next;
  }
  if (type === 'Table' && props.columns === undefined && Array.isArray(props.fields)) {
    props.columns = props.fields;
  }
  return props;
}

function isDirectTableConfig(value: Record<string, unknown>) {
  return Array.isArray(value.columns) || Array.isArray(value.fields) || value.dataSourceId !== undefined || Array.isArray(value.data) || Array.isArray(value.rows);
}

function defaultBox(index: number) {
  if (index === 0) return { x: 40, y: 220, width: 1040, height: 360 };
  return { x: 40, y: 80 + index * 88, width: 360, height: 56 };
}

function numberFrom(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function recordValue(value: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const next = value[key];
  return isRecord(next) ? next : undefined;
}

function nodeBox(value: Record<string, unknown>, index: number, offset: { x: number; y: number }) {
  const layout = recordValue(value, 'layout');
  const fallback = defaultBox(index);
  return {
    x: offset.x + numberFrom(value.x ?? layout?.x, fallback.x),
    y: offset.y + numberFrom(value.y ?? layout?.y, fallback.y),
    width: numberFrom(value.width ?? layout?.width, fallback.width),
    height: numberFrom(value.height ?? layout?.height, fallback.height),
  };
}

function normalizedNodeType(type: string | undefined, value: Record<string, unknown>) {
  const lower = type?.toLowerCase();
  if (!lower || lower === 'page') return undefined;
  if (lower === 'frame' || lower === 'container' || lower === 'section' || lower === 'card') return 'WhitePanel';
  if (lower === 'text') {
    const style = recordValue(value, 'style');
    return numberFrom(style?.fontSize, 14) >= 24 ? 'PageTitle' : 'BodyText';
  }
  if (lower === 'button') return 'Button';
  if (lower === 'input' || lower === 'textarea') return 'Input';
  if (lower === 'select') return 'Select';
  if (lower === 'table') return 'Table';
  if (lower === 'form') return 'Form';
  if (lower === 'tabs') return 'Tabs';
  if (lower === 'modal') return 'Modal';
  if (lower === 'drawer') return 'Drawer';
  if (lower === 'image') return 'ImageWidget';
  if (lower === 'icon') return 'IconWidget';
  if (lower === 'badge') return 'BadgePill';
  if (lower === 'divider') return 'DividerWidget';
  return type;
}

function styleProps(value: Record<string, unknown>, type: string, box: { width: number; height: number }): JsonRecord {
  const style = recordValue(value, 'style');
  const props: JsonRecord = {};
  if (type === 'WhitePanel') {
    props.label = String(value.name ?? value.title ?? value.id ?? '区域');
    props.width = box.width;
    props.height = box.height;
    props.fill = typeof style?.background === 'string' ? style.background : '#ffffff';
    if (typeof style?.border === 'string') props.border = style.border;
    if (typeof style?.borderRadius === 'number') props.radius = style.borderRadius;
    if (typeof style?.radius === 'number') props.radius = style.radius;
    if (typeof style?.shadow === 'string') props.shadow = style.shadow;
    return props;
  }
  if (type === 'PageTitle' || type === 'BodyText') {
    const content = value.content ?? value.text ?? value.title ?? value.label ?? value.name;
    if (typeof content === 'string') props.content = content;
    if (typeof style?.fontSize === 'number') props.fontSize = style.fontSize;
    if (typeof style?.fontWeight === 'number') props.fontWeight = style.fontWeight;
    if (typeof style?.color === 'string') props.color = style.color;
    props.width = box.width;
    props.height = box.height;
    return props;
  }
  if (type === 'Button') {
    const text = value.content ?? value.text ?? value.label ?? value.name;
    if (typeof text === 'string') props.text = text;
    return props;
  }
  if (type === 'Input' || type === 'Select') {
    const label = value.label ?? value.name ?? value.title;
    if (typeof label === 'string') props.label = label;
    if (typeof value.placeholder === 'string') props.placeholder = value.placeholder;
    if (typeof value.fieldKey === 'string') props.fieldKey = value.fieldKey;
    if (Array.isArray(value.options)) props.options = toJsonValue(value.options) ?? [];
    return props;
  }
  if (type === 'ImageWidget') {
    if (typeof value.src === 'string') props.src = value.src;
    if (typeof value.alt === 'string') props.alt = value.alt;
    props.width = box.width;
    props.height = box.height;
  }
  return props;
}

function normalizeDesignTree(value: Record<string, unknown>, index = 0, offset = { x: 0, y: 0 }): ImagePrototypePlan['nodes'] {
  const type = typeof value.type === 'string' ? value.type : undefined;
  const children = Array.isArray(value.children) ? value.children : [];
  if (type?.toLowerCase() === 'page') {
    return children.flatMap((child, childIndex) => (isRecord(child) ? normalizeDesignTree(child, childIndex, offset) : []));
  }

  const nextType = normalizedNodeType(type, value);
  const box = nodeBox(value, index, offset);
  const props = nextType ? { ...componentPropsFromRecord(value, nextType), ...styleProps(value, nextType, box), ...toJsonRecord(value.props) } : {};
  const name = String(value.name ?? value.title ?? value.label ?? value.content ?? nextType ?? type ?? `节点${index + 1}`);
  const current = nextType ? [{ type: nextType, name, props, ...box }] : [];
  const childOffset = nextType === 'WhitePanel' ? { x: box.x, y: box.y } : offset;
  return [
    ...current,
    ...children.flatMap((child, childIndex) => (isRecord(child) ? normalizeDesignTree(child, childIndex, childOffset) : [])),
  ];
}

function normalizePlan(value: unknown): ImagePrototypePlan | undefined {
  if (!isRecord(value)) return undefined;
  if (!Array.isArray(value.nodes) && isDirectTableConfig(value)) {
    return {
      title: typeof value.title === 'string' ? value.title : 'AI 识别生成的后台页面',
      summary: '由视觉理解模型识别图片后生成。',
      nodes: [
        {
          type: 'Table',
          name: typeof value.name === 'string' ? value.name : '数据列表',
          props: componentPropsFromRecord(value, 'Table'),
          ...defaultBox(0),
        },
      ],
    };
  }
  const title = typeof value.title === 'string' ? value.title : 'AI 识别生成的后台页面';
  const summary = typeof value.summary === 'string' ? value.summary : '由视觉理解模型识别图片后生成。';
  if (!Array.isArray(value.nodes)) {
    const nodes = normalizeDesignTree(value);
    return nodes.length ? { title, summary, nodes } : undefined;
  }
  const nodes = value.nodes.flatMap((item, index): ImagePrototypePlan['nodes'] => {
    if (!isRecord(item)) return [];
    if (Array.isArray(item.children)) return normalizeDesignTree(item, index);
    const type = normalizedNodeType(typeof item.type === 'string' ? item.type : undefined, item);
    const name = typeof item.name === 'string' ? item.name : type;
    const fallback = defaultBox(index);
    const x = typeof item.x === 'number' ? item.x : fallback.x;
    const y = typeof item.y === 'number' ? item.y : fallback.y;
    const width = typeof item.width === 'number' ? item.width : fallback.width;
    const height = typeof item.height === 'number' ? item.height : fallback.height;
    const props = { ...componentPropsFromRecord(item, type), ...styleProps(item, type ?? '', { width, height }), ...toJsonRecord(item.props) };
    if (!type || !name) return [];
    return [{ type, name, props, x, y, width, height }];
  });
  if (!nodes.length) return undefined;
  return { title, summary, nodes };
}

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)?.[1];
  const raw = fenced ?? text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < start) return undefined;
  return raw.slice(start, end + 1);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
}

function readImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('读取图片失败'));
    image.src = dataUrl;
  });
}

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await readImage(dataUrl);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || maxSide, image.naturalHeight || maxSide));
  const width = Math.max(1, Math.round((image.naturalWidth || maxSide) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || maxSide) * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return dataUrl;
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.86);
}

async function readErrorMessage(response: Response) {
  const raw = await response.text();
  if (!raw) return `视觉理解模型请求失败：${response.status}`;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isRecord(parsed)) {
      const error = parsed.error;
      if (isRecord(error) && typeof error.message === 'string') return `视觉理解模型请求失败：${response.status} ${error.message}`;
      if (typeof parsed.message === 'string') return `视觉理解模型请求失败：${response.status} ${parsed.message}`;
    }
  } catch {
    // Use the raw body below.
  }
  return `视觉理解模型请求失败：${response.status} ${raw.slice(0, 300)}`;
}

export async function generatePrototypePlanWithVisionModel(config: AiModelConfig, file: File): Promise<ImagePrototypePlan | undefined> {
  const imageUrl = await fileToCompressedDataUrl(file);
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content:
            '你是后台原型截图识别助手。请识别图片中的完整页面结构，并只输出页面 JSON，不要输出解释文字。优先使用 page、frame、text、button、input、select、table、form、tabs、modal、drawer、image、icon、badge、divider 等基础节点；每个节点可包含 layout、style、props、children。坐标使用 1200x760 画板坐标。',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                '请把这张后台页面图片转换为可渲染页面 JSON，推荐格式为 {"type":"page","title":"...","children":[{"type":"frame","name":"筛选区","layout":{"x":40,"y":96,"width":960,"height":96},"style":{"background":"#fff"},"children":[{"type":"input","label":"名称","layout":{"x":24,"y":28,"width":180,"height":36}}]},{"type":"table","name":"数据列表","columns":["名称","状态","操作"],"actions":["详情"],"layout":{"x":40,"y":220,"width":960,"height":320}}]}。内容必须来自图片，包括标题、按钮文案、查询字段、表格列、表单字段和空状态。',
            },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  const data = (await response.json()) as ChatResponse;
  const content = data.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content : JSON.stringify(content ?? '');
  const json = extractJson(text);
  if (!json) return undefined;
  return normalizePlan(JSON.parse(json));
}

function summarizeImageAnalysis(analysis: ImagePrototypeAnalysis) {
  const regions = (analysis.regions ?? [])
    .map((region) => `${region.kind}: x=${Math.round(region.x)}, y=${Math.round(region.y)}, w=${Math.round(region.width)}, h=${Math.round(region.height)}, score=${region.score.toFixed(2)}`)
    .join('\n');
  const texts = (analysis.textItems ?? [])
    .slice(0, 80)
    .map((item) => `"${item.text}" at x=${Math.round(item.x)}, y=${Math.round(item.y)}, w=${Math.round(item.width)}, h=${Math.round(item.height)}`)
    .join('\n');
  return [
    `图片文件：${analysis.fileName}`,
    `图片尺寸：${analysis.width} x ${analysis.height}`,
    `OCR 全文：${analysis.text ?? ''}`,
    `检测到的视觉区域：\n${regions || '无'}`,
    `检测到的文字位置：\n${texts || '无'}`,
  ].join('\n\n');
}

export async function generatePrototypePlanWithTextModel(config: AiModelConfig, analysis: ImagePrototypeAnalysis): Promise<ImagePrototypePlan | undefined> {
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content:
            '你是后台原型结构规划助手。输入来自本地图片 OCR 和像素区域检测结果。请根据这些文本和区域推断完整后台页面，并只输出页面 JSON。优先使用 page、frame、text、button、input、select、table、form、tabs、modal、drawer、image、icon、badge、divider 等基础节点；每个节点可包含 layout、style、props、children。坐标使用 1200x760 画板坐标。',
        },
        {
          role: 'user',
          content: `请根据以下图片分析结果生成可渲染页面 JSON，推荐格式为 {"type":"page","title":"...","children":[{"type":"frame","name":"筛选区","layout":{"x":40,"y":96,"width":960,"height":96},"children":[{"type":"input","label":"名称","layout":{"x":24,"y":28,"width":180,"height":36}}]},{"type":"table","name":"数据列表","columns":["名称","状态","操作"],"actions":["详情"],"layout":{"x":40,"y":220,"width":960,"height":320}}]}。\n\n${summarizeImageAnalysis(analysis)}`,
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  const data = (await response.json()) as ChatResponse;
  const content = data.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content : JSON.stringify(content ?? '');
  const json = extractJson(text);
  if (!json) return undefined;
  return normalizePlan(JSON.parse(json));
}
