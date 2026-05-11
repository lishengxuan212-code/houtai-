export type AiModelRole = 'visionStructure' | 'visionEmbedding';

export type AiModelConfig = {
  role: AiModelRole;
  label: string;
  responsibility: string;
  apiUrl: string;
  apiKey: string;
  model: string;
};

export type AiModelSettings = {
  visionStructure: AiModelConfig;
  visionEmbedding: AiModelConfig;
};

const STORAGE_KEY = 'admin-prototype-studio.ai-model-settings.v1';

export const defaultAiModelSettings: AiModelSettings = {
  visionStructure: {
    role: 'visionStructure',
    label: '视觉理解 / 结构生成',
    responsibility: '识别后台截图内容，输出页面类型、组件、坐标、属性、表格列、表单字段和按钮文案。',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiKey: '',
    model: '',
  },
  visionEmbedding: {
    role: 'visionEmbedding',
    label: '视觉向量 / 组件匹配',
    responsibility: '把截图区域或组件样例转成向量，用于匹配最接近的 Ant Design、ProComponents、自建组件或模板。',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/embeddings',
    apiKey: '',
    model: '',
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeConfig(role: AiModelRole, value: unknown): AiModelConfig {
  const fallback = defaultAiModelSettings[role];
  if (!isRecord(value)) return fallback;
  return {
    ...fallback,
    apiUrl: typeof value.apiUrl === 'string' ? value.apiUrl : fallback.apiUrl,
    apiKey: typeof value.apiKey === 'string' ? value.apiKey : fallback.apiKey,
    model: typeof value.model === 'string' ? value.model : fallback.model,
  };
}

export function loadAiModelSettings(): AiModelSettings {
  if (typeof localStorage === 'undefined') return defaultAiModelSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : undefined;
    if (!isRecord(parsed)) return defaultAiModelSettings;
    return {
      visionStructure: mergeConfig('visionStructure', parsed.visionStructure),
      visionEmbedding: mergeConfig('visionEmbedding', parsed.visionEmbedding),
    };
  } catch {
    return defaultAiModelSettings;
  }
}

export function saveAiModelSettings(settings: AiModelSettings) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function isModelConfigured(config: AiModelConfig) {
  return Boolean(config.apiUrl.trim() && config.apiKey.trim() && config.model.trim());
}
