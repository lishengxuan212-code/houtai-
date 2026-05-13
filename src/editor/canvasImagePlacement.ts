import type { ComponentNode, NodeCanvasConfig } from '../domain/types';
import { createNode } from '../registry/createNode';
import type { ImageInput } from '../ai/imageInput';

export type ImageNaturalSize = {
  width: number;
  height: number;
};

const DEFAULT_IMAGE_SIZE: ImageNaturalSize = { width: 320, height: 180 };
const MAX_IMAGE_SIZE: ImageNaturalSize = { width: 520, height: 360 };

export function fitCanvasImageSize(naturalSize?: Partial<ImageNaturalSize>): ImageNaturalSize {
  const naturalWidth = Number(naturalSize?.width);
  const naturalHeight = Number(naturalSize?.height);
  const width = Number.isFinite(naturalWidth) && naturalWidth > 0 ? naturalWidth : DEFAULT_IMAGE_SIZE.width;
  const height = Number.isFinite(naturalHeight) && naturalHeight > 0 ? naturalHeight : DEFAULT_IMAGE_SIZE.height;
  const scale = Math.min(MAX_IMAGE_SIZE.width / width, MAX_IMAGE_SIZE.height / height, 1);

  return {
    width: Math.max(80, Math.round(width * scale)),
    height: Math.max(45, Math.round(height * scale)),
  };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('图片读取失败'));
    };
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

export function readImageNaturalSize(src: string): Promise<ImageNaturalSize> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => reject(new Error('图片尺寸读取超时')), 300);
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('图片尺寸读取失败'));
    };
    image.src = src;
  });
}

export function createCanvasImageNode(params: {
  src: string;
  fileName?: string;
  canvas: NodeCanvasConfig;
}): ComponentNode {
  const fileName = params.fileName?.trim();
  const alt = fileName || '画布图片';
  const node = createNode('ImageWidget', {
    src: params.src,
    alt,
    fit: 'contain',
  });
  node.name = fileName ? `图片：${fileName}` : '画布图片';
  node.canvas = params.canvas;
  node.semantic = {
    moduleName: node.name,
    moduleType: 'media',
    description: '画布中放置的图片素材',
  };
  return node;
}

export async function imageInputToCanvasNode(params: {
  input: ImageInput;
  canvas: Omit<NodeCanvasConfig, 'width' | 'height'> & Partial<Pick<NodeCanvasConfig, 'width' | 'height'>>;
}): Promise<ComponentNode> {
  const src = await fileToDataUrl(params.input.file);
  const naturalSize = await readImageNaturalSize(src).catch(() => DEFAULT_IMAGE_SIZE);
  const size = fitCanvasImageSize({
    width: params.canvas.width ?? naturalSize.width,
    height: params.canvas.height ?? naturalSize.height,
  });

  return createCanvasImageNode({
    src,
    fileName: params.input.file.name,
    canvas: {
      ...params.canvas,
      width: params.canvas.width ?? size.width,
      height: params.canvas.height ?? size.height,
    },
  });
}
