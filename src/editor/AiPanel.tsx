import { Alert, Button, Divider, Input, List, Space, Tag, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { useState } from 'react';
import { generatePrototypePlanWithTextModel, generatePrototypePlanWithVisionModel } from '../ai/doubaoPrototypeApi';
import { applyImagePrototypePlan, inferImagePrototypePlan, type ImagePrototypeAnalysis, type ImagePrototypePlan, type ImageRegion, type ImageTextItem } from '../ai/imagePrototype';
import { isModelConfigured, loadAiModelSettings, saveAiModelSettings, type AiModelSettings } from '../ai/modelSettings';
import { runAiRules } from '../ai/rules';
import type { AiSuggestion } from '../domain/types';
import { useProjectStore } from '../store/projectStore';

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

function clusterIndexes(values: number[], gap = 3) {
  const clusters: Array<{ start: number; end: number }> = [];
  for (const value of values) {
    const last = clusters.at(-1);
    if (last && value - last.end <= gap) last.end = value;
    else clusters.push({ start: value, end: value });
  }
  return clusters;
}

function detectVisualRegions(image: HTMLImageElement): ImageRegion[] {
  const sourceWidth = image.naturalWidth || 1440;
  const sourceHeight = image.naturalHeight || 900;
  const sampleWidth = 360;
  const sampleHeight = Math.max(180, Math.round((sourceHeight / sourceWidth) * sampleWidth));
  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return [];
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const data = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const rowDensity: number[] = [];
  const saturatedPixels: Array<{ x: number; y: number }> = [];

  for (let y = 0; y < sampleHeight; y += 1) {
    let rowActive = 0;
    for (let x = 0; x < sampleWidth; x += 1) {
      const offset = (y * sampleWidth + x) * 4;
      const red = data[offset] ?? 255;
      const green = data[offset + 1] ?? 255;
      const blue = data[offset + 2] ?? 255;
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const dark = max < 225;
      const saturated = max - min > 50 && max > 80;
      if (dark) rowActive += 1;
      if (saturated && y > sampleHeight * 0.12) saturatedPixels.push({ x, y });
    }
    rowDensity.push(rowActive / sampleWidth);
  }

  const scaleX = sourceWidth / sampleWidth;
  const scaleY = sourceHeight / sampleHeight;
  const denseRows = rowDensity.map((density, y) => (density > 0.2 ? y : -1)).filter((y) => y >= 0);
  const rowClusters = clusterIndexes(denseRows, 4).filter((cluster) => cluster.end - cluster.start >= 1);
  const regions: ImageRegion[] = [];

  const topCluster = rowClusters.find((cluster) => cluster.start < sampleHeight * 0.18);
  if (topCluster) {
    regions.push({ kind: 'header', x: 0, y: Math.max(0, topCluster.start - 12) * scaleY, width: sourceWidth, height: Math.max(64, (topCluster.end - topCluster.start + 24) * scaleY), score: 0.8 });
  }

  const tableRows = rowClusters.filter((cluster) => cluster.start > sampleHeight * 0.28 && cluster.end - cluster.start <= 4);
  if (tableRows.length >= 4) {
    const first = tableRows[0]!;
    const last = tableRows.at(-1)!;
    regions.push({ kind: 'table', x: sourceWidth * 0.04, y: Math.max(0, first.start - 16) * scaleY, width: sourceWidth * 0.78, height: Math.max(220, (last.end - first.start + 36) * scaleY), score: Math.min(1, tableRows.length / 8) });
  }

  const topDense = rowClusters.find((cluster) => cluster.start > sampleHeight * 0.12 && cluster.start < sampleHeight * 0.36 && cluster.end - cluster.start > 6);
  if (topDense) {
    regions.push({ kind: 'search', x: sourceWidth * 0.04, y: Math.max(0, topDense.start - 12) * scaleY, width: sourceWidth * 0.78, height: Math.max(80, (topDense.end - topDense.start + 24) * scaleY), score: 0.72 });
  }

  const buttonClusters = clusterIndexes(saturatedPixels.map((point) => point.y).sort((left, right) => left - right), 5).slice(0, 4);
  for (const cluster of buttonClusters) {
    const points = saturatedPixels.filter((point) => point.y >= cluster.start && point.y <= cluster.end);
    if (points.length < 30) continue;
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    if (maxX - minX < 12 || maxX - minX > sampleWidth * 0.35) continue;
    regions.push({ kind: 'button', x: minX * scaleX, y: cluster.start * scaleY, width: Math.max(72, (maxX - minX) * scaleX), height: Math.max(32, (cluster.end - cluster.start) * scaleY), score: 0.7 });
  }

  const cardRows = rowClusters.filter((cluster) => cluster.start > sampleHeight * 0.14 && cluster.start < sampleHeight * 0.45 && cluster.end - cluster.start > 8);
  if (cardRows.length >= 3) {
    cardRows.slice(0, 4).forEach((cluster, index) => {
      regions.push({ kind: 'card', x: sourceWidth * (0.04 + index * 0.2), y: Math.max(0, cluster.start - 8) * scaleY, width: sourceWidth * 0.18, height: Math.max(90, (cluster.end - cluster.start + 16) * scaleY), score: 0.65 });
    });
  }

  if (!regions.some((region) => region.kind === 'table' || region.kind === 'form')) {
    regions.push({ kind: sourceHeight > sourceWidth * 1.1 ? 'form' : 'content', x: sourceWidth * 0.04, y: sourceHeight * 0.18, width: sourceWidth * 0.78, height: sourceHeight * 0.58, score: 0.45 });
  }

  return regions;
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
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [plan, setPlan] = useState<ImagePrototypePlan | undefined>();
  const [modelSettings, setModelSettings] = useState<AiModelSettings>(() => loadAiModelSettings());
  const [modelStatus, setModelStatus] = useState<string | undefined>();
  const [generating, setGenerating] = useState(false);

  function updateModelSettings(next: AiModelSettings) {
    setModelSettings(next);
    saveAiModelSettings(next);
  }

  async function generateFromUpload() {
    const file = fileList[0]?.originFileObj;
    if (!file) return;
    setGenerating(true);
    setModelStatus(undefined);
    try {
      let nextPlan: ImagePrototypePlan | undefined;
      let localAnalysis: ImagePrototypeAnalysis | undefined;
      if (isModelConfigured(modelSettings.visionStructure)) {
        try {
          nextPlan = await generatePrototypePlanWithVisionModel(modelSettings.visionStructure, file);
          setModelStatus(nextPlan ? '已使用视觉理解模型生成组件结构。' : '视觉理解模型未返回有效结构，已切换为本地识别。');
        } catch (error) {
          const message = error instanceof Error ? error.message : '视觉理解模型调用失败';
          if (message.includes('can only support text')) {
            localAnalysis = await analyzeImageFile(file);
            try {
              nextPlan = await generatePrototypePlanWithTextModel(modelSettings.visionStructure, localAnalysis);
              setModelStatus('当前接入点只支持文本，已改用“本地图片分析 + 文本模型规划”生成组件结构。');
            } catch (textError) {
              setModelStatus(textError instanceof Error ? `${textError.message}，已切换为本地识别。` : '文本模型规划失败，已切换为本地识别。');
            }
          } else {
            setModelStatus(`${message}，已切换为本地识别。`);
          }
        }
      } else {
        setModelStatus('未配置视觉理解模型，已使用本地 OCR 和像素识别。');
      }
      if (!nextPlan) {
        const analysis = localAnalysis ?? await analyzeImageFile(file);
        nextPlan = inferImagePrototypePlan(analysis);
      }
      const nextProject = applyImagePrototypePlan(project, currentPageId, currentFrameId, nextPlan);
      commitProject(nextProject, currentPageId);
      setPlan(nextPlan);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <section>
        <Typography.Text strong>规则检查</Typography.Text>
        <Button type="primary" block style={{ marginTop: 8 }} onClick={() => setSuggestions(runAiRules(project))}>
          检查当前项目
        </Button>
        <Alert style={{ margin: '12px 0' }} type="info" showIcon message="点击按钮后运行规则检查，编辑过程不会自动触发 AI 检查。" />
        <List
          size="small"
          dataSource={suggestions}
          locale={{ emptyText: '点击按钮运行检查' }}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <>
                    <Tag color={item.severity === 'error' ? 'red' : item.severity === 'warning' ? 'orange' : 'blue'}>{item.severity}</Tag>
                    {item.title}
                  </>
                }
                description={item.description}
              />
            </List.Item>
          )}
        />
      </section>

      <section>
        <Typography.Text strong>AI 模型配置</Typography.Text>
        <Alert
          style={{ marginTop: 8 }}
          type="info"
          showIcon
          message="模型分工"
          description="视觉理解 / 结构生成用于识别图片并输出组件 JSON；视觉向量 / 组件匹配用于把截图区域匹配到最接近的组件库资产。API Key 和模型名只保存在本机浏览器。"
        />
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
            placeholder="例如填写你的 Doubao-Seed-2.0-pro 模型接入点名称"
            onChange={(event) => updateModelSettings({ ...modelSettings, visionStructure: { ...modelSettings.visionStructure, model: event.target.value } })}
          />
          <Typography.Text type="secondary">{modelSettings.visionStructure.responsibility}</Typography.Text>
        </Space>
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
            placeholder="填写你的视觉向量模型 API Key"
            onChange={(event) => updateModelSettings({ ...modelSettings, visionEmbedding: { ...modelSettings.visionEmbedding, apiKey: event.target.value } })}
          />
          <Input
            addonBefore="模型名"
            value={modelSettings.visionEmbedding.model}
            placeholder="例如填写你的 Doubao-embedding-vision 模型接入点名称"
            onChange={(event) => updateModelSettings({ ...modelSettings, visionEmbedding: { ...modelSettings.visionEmbedding, model: event.target.value } })}
          />
          <Typography.Text type="secondary">{modelSettings.visionEmbedding.responsibility}</Typography.Text>
        </Space>
      </section>

      <Divider style={{ margin: 0 }} />

      <section>
        <Typography.Text strong>图片生成后台</Typography.Text>
        <Upload.Dragger
          accept="image/*"
          maxCount={1}
          fileList={fileList}
          beforeUpload={() => false}
          onChange={({ fileList: nextFileList }) => setFileList(nextFileList.slice(-1))}
        >
          <p>上传后台截图、草图或页面图片</p>
          <p className="ant-upload-hint">系统会在浏览器内识别页面类型，自动匹配组件并放置到当前画板。</p>
        </Upload.Dragger>
        <Button type="primary" block style={{ marginTop: 8 }} loading={generating} disabled={fileList.length === 0} onClick={() => void generateFromUpload()}>
          识别图片并生成后台原型
        </Button>
        {modelStatus ? <Alert style={{ marginTop: 12 }} type={modelStatus.includes('失败') ? 'warning' : 'info'} showIcon message={modelStatus} /> : null}
        {plan ? <Alert style={{ marginTop: 12 }} type="success" showIcon message={plan.title} description={plan.summary} /> : null}
      </section>
    </Space>
  );
}
