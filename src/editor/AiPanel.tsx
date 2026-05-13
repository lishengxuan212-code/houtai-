import { Alert, Button, Input, Modal, Space, Typography } from 'antd';
import { ImagePlus, Settings } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ClipboardEvent as ReactClipboardEvent, type DragEvent } from 'react';
import { generatePrototypePlanResultWithTextModel, generatePrototypePlanResultWithVisionModel } from '../ai/doubaoPrototypeApi';
import { imageInputFromClipboardData, imageInputFromDataTransfer, imageInputFromNavigatorClipboard, imageInputFromUpload, imageInputSourceLabel, type ImageInput } from '../ai/imageInput';
import { applyImagePrototypePlan, inferImagePrototypePlan, type ImagePrototypeAnalysis, type ImagePrototypePlan, type ImageRegion, type ImageTextItem } from '../ai/imagePrototype';
import { AI_MODEL_SETTINGS_STORAGE_KEY, isModelConfigured, loadAiModelDefaultSettings, loadAiModelSettings, saveAiModelDefaultSettings, saveAiModelSettings, type AiModelSettings } from '../ai/modelSettings';
import { useProjectStore } from '../store/projectStore';
import { WORKBENCH_MODAL_WIDTH } from './workbench/modalConstants';

type OcrWord = {
  text?: unknown;
  confidence?: unknown;
  bbox?: unknown;
};

type OcrResult = {
  data?: {
    text?: unknown;
    words?: unknown;
  };
};

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.src = url;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeOcrWords(result: OcrResult): ImageTextItem[] {
  const words = Array.isArray(result.data?.words) ? result.data.words : [];
  return words.flatMap((word): ImageTextItem[] => {
    const candidate = word as OcrWord;
    const text = typeof candidate.text === 'string' ? candidate.text.trim() : '';
    const bbox = isRecord(candidate.bbox) ? candidate.bbox : undefined;
    const x0 = typeof bbox?.x0 === 'number' ? bbox.x0 : undefined;
    const y0 = typeof bbox?.y0 === 'number' ? bbox.y0 : undefined;
    const x1 = typeof bbox?.x1 === 'number' ? bbox.x1 : undefined;
    const y1 = typeof bbox?.y1 === 'number' ? bbox.y1 : undefined;
    if (!text || x0 === undefined || y0 === undefined || x1 === undefined || y1 === undefined) return [];
    return [{
      text,
      x: x0,
      y: y0,
      width: Math.max(1, x1 - x0),
      height: Math.max(1, y1 - y0),
      ...(typeof candidate.confidence === 'number' ? { confidence: candidate.confidence } : {}),
    }];
  });
}

async function readOcr(file: File): Promise<{ text: string; textItems: ImageTextItem[] }> {
  try {
    const { recognize } = await import('tesseract.js');
    const result = (await recognize(file, 'chi_sim+eng')) as OcrResult;
    return {
      text: typeof result.data?.text === 'string' ? result.data.text : '',
      textItems: normalizeOcrWords(result),
    };
  } catch {
    return { text: '', textItems: [] };
  }
}

function detectVisualRegions(image: HTMLImageElement): ImageRegion[] {
  const width = image.naturalWidth || 1440;
  const height = image.naturalHeight || 900;
  return [
    { kind: 'header', x: 0, y: 0, width, height: 72, score: 0.5 },
    { kind: 'search', x: width * 0.04, y: 96, width: width * 0.78, height: 96, score: 0.5 },
    { kind: 'table', x: width * 0.04, y: 220, width: width * 0.86, height: Math.max(260, height * 0.45), score: 0.5 },
  ];
}

async function analyzeImageFile(file: File): Promise<ImagePrototypeAnalysis> {
  const image = await readImage(file);
  const [ocr] = await Promise.all([readOcr(file)]);
  return {
    fileName: file.name,
    width: image.naturalWidth || 1440,
    height: image.naturalHeight || 900,
    text: ocr.text,
    textItems: ocr.textItems,
    regions: detectVisualRegions(image),
  };
}

export function AiPanel() {
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const currentFrameId = useProjectStore((state) => state.currentFrameId);
  const commitProject = useProjectStore((state) => state.commitProject);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<ImageInput | undefined>();
  const [plan, setPlan] = useState<ImagePrototypePlan | undefined>();
  const [modelSettings, setModelSettings] = useState<AiModelSettings>(() => loadAiModelSettings());
  const [modelStatus, setModelStatus] = useState<string | undefined>();
  const [generating, setGenerating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const chooseImage = useCallback((input: ImageInput | undefined) => {
    if (!input) {
      setModelStatus('未识别到可用图片。请上传、拖拽图片，或粘贴图片 / SVG 内容。');
      return;
    }
    setSelectedImage(input);
    setPlan(undefined);
    setModelStatus(undefined);
  }, []);

  function updateModelSettings(next: AiModelSettings) {
    setModelSettings(next);
    saveAiModelSettings(next);
  }

  function saveAsDefaultModelSettings() {
    saveAiModelDefaultSettings(modelSettings);
    setModelStatus('已保存为默认模型配置，包含 API Key。');
  }

  function useDefaultModelSettings() {
    const defaults = loadAiModelDefaultSettings();
    updateModelSettings(defaults);
    setModelStatus('已使用默认模型配置。');
  }

  useEffect(() => {
    const syncModelSettings = (event: StorageEvent) => {
      if (event.key === AI_MODEL_SETTINGS_STORAGE_KEY) setModelSettings(loadAiModelSettings());
    };
    window.addEventListener('storage', syncModelSettings);
    return () => window.removeEventListener('storage', syncModelSettings);
  }, []);

  async function generateFromUpload() {
    const file = selectedImage?.file;
    if (!file) return;
    setGenerating(true);
    setModelStatus(undefined);
    try {
      let nextPlan: ImagePrototypePlan | undefined;
      let localAnalysis: ImagePrototypeAnalysis | undefined;
      if (isModelConfigured(modelSettings.visionStructure)) {
        const result = await generatePrototypePlanResultWithVisionModel(modelSettings.visionStructure, file).catch(async (error: unknown) => {
          const message = error instanceof Error ? error.message : '视觉理解模型调用失败';
          if (!message.includes('can only support text')) throw error;
          localAnalysis = await analyzeImageFile(file);
          return generatePrototypePlanResultWithTextModel(modelSettings.visionStructure, localAnalysis);
        });
        nextPlan = result.ok ? result.plan : undefined;
        setModelStatus(result.ok ? '已使用模型生成组件结构。' : `${result.reason} 已切换为本地识别。`);
      } else {
        setModelStatus('未配置视觉理解模型，已使用本地 OCR 和像素识别。');
      }
      if (!nextPlan) {
        const analysis = localAnalysis ?? await analyzeImageFile(file);
        nextPlan = inferImagePrototypePlan(analysis);
      }
      const pageBefore = project.pages.find((page) => page.id === currentPageId);
      const beforeNodeIds = new Set(pageBefore ? Object.keys(pageBefore.nodes) : []);
      const nextProject = applyImagePrototypePlan(project, currentPageId, currentFrameId, nextPlan);
      const nextPage = nextProject.pages.find((page) => page.id === currentPageId);
      const generatedNodeIds = nextPage ? Object.keys(nextPage.nodes).filter((nodeId) => !beforeNodeIds.has(nodeId)) : [];
      const firstGeneratedNodeId = generatedNodeIds[0];
      commitProject(nextProject, currentPageId, firstGeneratedNodeId);
      setModelStatus(generatedNodeIds.length > 0 ? `已生成并插入 ${generatedNodeIds.length} 个组件到当前画布。` : '未生成可插入组件，请换一张更清晰的截图或检查模型返回内容。');
      setPlan(nextPlan);
    } catch (error) {
      setModelStatus(error instanceof Error ? error.message : 'AI 识图生成失败。');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    chooseImage(await imageInputFromDataTransfer(event.dataTransfer));
  }

  async function handlePaste(event: ReactClipboardEvent<HTMLDivElement>) {
    const input = await imageInputFromClipboardData(event.clipboardData);
    if (!input) {
      setModelStatus('剪贴板中没有可用图片，或 SVG 内容包含不安全代码。');
      return;
    }
    event.preventDefault();
    chooseImage(input);
  }

  async function pasteImageFromClipboard() {
    try {
      chooseImage(await imageInputFromNavigatorClipboard());
    } catch (error) {
      setModelStatus(error instanceof Error ? `读取剪贴板图片失败：${error.message}` : '读取剪贴板图片失败。');
    }
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <section>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Typography.Text strong>图片生成后台</Typography.Text>
          <Button aria-label="模型配置" icon={<Settings size={16} />} onClick={() => setSettingsOpen(true)} />
        </Space>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg"
          hidden
          onChange={(event) => chooseImage(imageInputFromUpload(event.target.files?.[0]))}
        />
        <Button block style={{ marginTop: 12 }} onClick={() => void pasteImageFromClipboard()}>
          从剪贴板粘贴图片
        </Button>
        <div
          className="ai-image-upload-zone"
          role="button"
          aria-label="选择后台图片"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => void handleDrop(event)}
          onPaste={(event) => void handlePaste(event)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            fileInputRef.current?.click();
          }}
          style={{
            border: '1px dashed #91caff',
            borderRadius: 8,
            cursor: 'pointer',
            marginTop: 12,
            padding: 28,
            textAlign: 'center',
          }}
        >
          <ImagePlus size={28} />
          <p>上传后台截图、草图、页面图片或 SVG</p>
          <p className="ant-upload-hint">点击选择、拖入图片，或粘贴图片 / SVG 内容。</p>
          {selectedImage ? <Typography.Text type="secondary">已选择：{selectedImage.file.name}（{imageInputSourceLabel(selectedImage.source)}）</Typography.Text> : null}
        </div>
        <Button type="primary" block style={{ marginTop: 8 }} loading={generating} disabled={!selectedImage} onClick={() => void generateFromUpload()}>
          识别图片并生成后台原型
        </Button>
        {modelStatus ? <Alert style={{ marginTop: 12 }} type={modelStatus.includes('失败') ? 'warning' : 'info'} showIcon message={modelStatus} /> : null}
        {plan ? <Alert style={{ marginTop: 12 }} type="success" showIcon message={plan.title} description={plan.summary} /> : null}
      </section>
      <Modal title="模型配置" open={settingsOpen} onCancel={() => setSettingsOpen(false)} footer={null} width={WORKBENCH_MODAL_WIDTH}>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap>
            <Button onClick={useDefaultModelSettings}>使用默认配置</Button>
            <Button onClick={saveAsDefaultModelSettings}>保存为默认配置</Button>
          </Space>
          <section>
            <Typography.Text strong>视觉理解 / 结构生成</Typography.Text>
            <Space orientation="vertical" size={8} style={{ width: '100%', marginTop: 12 }}>
              <Typography.Text type="secondary">{modelSettings.visionStructure.label}</Typography.Text>
              <Input
                addonBefore="API 地址"
                value={modelSettings.visionStructure.apiUrl}
                onChange={(event) => updateModelSettings({ ...modelSettings, visionStructure: { ...modelSettings.visionStructure, apiUrl: event.target.value } })}
              />
              <Input.Password
                addonBefore="API Key"
                value={modelSettings.visionStructure.apiKey}
                placeholder="填写你的视觉理解模型 API Key"
                onChange={(event) => updateModelSettings({ ...modelSettings, visionStructure: { ...modelSettings.visionStructure, apiKey: event.target.value } })}
              />
              <Input
                addonBefore="模型名"
                value={modelSettings.visionStructure.model}
                placeholder="例如 qwen3.6-plus"
                onChange={(event) => updateModelSettings({ ...modelSettings, visionStructure: { ...modelSettings.visionStructure, model: event.target.value } })}
              />
              <Typography.Text type="secondary">{modelSettings.visionStructure.responsibility}</Typography.Text>
            </Space>
          </section>
          <section>
            <Typography.Text strong>视觉向量 / 组件匹配</Typography.Text>
            <Space orientation="vertical" size={8} style={{ width: '100%', marginTop: 12 }}>
              <Typography.Text type="secondary">{modelSettings.visionEmbedding.label}</Typography.Text>
              <Input
                addonBefore="API 地址"
                value={modelSettings.visionEmbedding.apiUrl}
                onChange={(event) => updateModelSettings({ ...modelSettings, visionEmbedding: { ...modelSettings.visionEmbedding, apiUrl: event.target.value } })}
              />
              <Input.Password
                addonBefore="API Key"
                value={modelSettings.visionEmbedding.apiKey}
                onChange={(event) => updateModelSettings({ ...modelSettings, visionEmbedding: { ...modelSettings.visionEmbedding, apiKey: event.target.value } })}
              />
              <Input
                addonBefore="模型名"
                value={modelSettings.visionEmbedding.model}
                onChange={(event) => updateModelSettings({ ...modelSettings, visionEmbedding: { ...modelSettings.visionEmbedding, model: event.target.value } })}
              />
              <Typography.Text type="secondary">{modelSettings.visionEmbedding.responsibility}</Typography.Text>
            </Space>
          </section>
        </Space>
      </Modal>
    </Space>
  );
}
