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
  'variant',
  'status',
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
  if (!Array.isArray(value.nodes)) return undefined;
  const title = typeof value.title === 'string' ? value.title : 'AI 识别生成的后台页面';
  const summary = typeof value.summary === 'string' ? value.summary : '由视觉理解模型识别图片后生成。';
  const nodes = value.nodes.flatMap((item, index): ImagePrototypePlan['nodes'] => {
    if (!isRecord(item)) return [];
    const type = typeof item.type === 'string' ? item.type : undefined;
    const name = typeof item.name === 'string' ? item.name : type;
    const props = { ...componentPropsFromRecord(item, type), ...toJsonRecord(item.props) };
    const fallback = defaultBox(index);
    const x = typeof item.x === 'number' ? item.x : fallback.x;
    const y = typeof item.y === 'number' ? item.y : fallback.y;
    const width = typeof item.width === 'number' ? item.width : fallback.width;
    const height = typeof item.height === 'number' ? item.height : fallback.height;
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
            '你是后台原型截图识别助手。请识别图片中的后台页面结构，并只输出 JSON。节点 type 只能使用 PageTitle、SearchBar、Button、Table、Form、Tabs、Modal、Drawer、Image、AmountText、StatusLabel、BodyText。坐标使用 1200x760 画板坐标。不要输出解释文字。',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                '请把这张后台页面图片转换为组件计划 JSON，格式为 {"title":"...","summary":"...","nodes":[{"type":"Table","name":"数据列表","props":{},"x":40,"y":220,"width":900,"height":320}]}。props 需要包含真实识别到的标题、按钮文案、查询字段、表格列和表单字段。',
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
            '你是后台原型结构规划助手。输入来自本地图片 OCR 和像素区域检测结果。请根据这些文本和区域推断后台页面组件，并只输出 JSON。节点 type 只能使用 PageTitle、SearchBar、Button、Table、Form、Tabs、Modal、Drawer、Image、AmountText、StatusLabel、BodyText。坐标使用 1200x760 画板坐标。',
        },
        {
          role: 'user',
          content: `请根据以下图片分析结果生成组件计划 JSON，格式为 {"title":"...","summary":"...","nodes":[{"type":"Table","name":"数据列表","props":{},"x":40,"y":220,"width":900,"height":320}]}。\n\n${summarizeImageAnalysis(analysis)}`,
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
