export type ImageInputSource = 'upload' | 'drag' | 'clipboard' | 'clipboard-svg';

export type ImageInput = {
  file: File;
  source: ImageInputSource;
};

type TransferLike = {
  files?: ArrayLike<File>;
  types?: ArrayLike<string>;
  getData?: (type: string) => string;
};

type ClipboardLike = {
  read?: () => Promise<Array<{ types: readonly string[]; getType: (type: string) => Promise<Blob> }>>;
  readText?: () => Promise<string>;
};

const SVG_MIME = 'image/svg+xml';

function firstImageFile(files: ArrayLike<File> | undefined) {
  return Array.from(files ?? []).find((file) => file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.svg'));
}

function transferText(data: TransferLike, type: string) {
  if (!Array.from(data.types ?? []).includes(type)) return '';
  return data.getData?.(type) ?? '';
}

function extractSvg(value: string) {
  const match = value.match(/<svg\b[\s\S]*<\/svg>/i);
  return match?.[0];
}

function isSafeSvg(svg: string) {
  const normalized = svg.toLowerCase();
  if (!normalized.includes('<svg')) return false;
  if (/<script\b/i.test(svg)) return false;
  if (/\son[a-z]+\s*=/i.test(svg)) return false;
  if (/javascript\s*:/i.test(svg)) return false;
  if (/<foreignobject\b/i.test(svg)) return false;
  return true;
}

function svgFile(svg: string) {
  return new File([svg], 'clipboard.svg', { type: SVG_MIME });
}

function extensionForImageType(type: string) {
  if (type === SVG_MIME) return 'svg';
  const subtype = type.split('/')[1]?.replace('jpeg', 'jpg').replace(/[^a-z0-9]+/gi, '');
  return subtype || 'png';
}

async function blobText(blob: Blob) {
  if (typeof blob.text === 'function') return await blob.text();
  return await new Response(blob).text();
}

export async function imageInputFromDataTransfer(data: TransferLike): Promise<ImageInput | undefined> {
  const file = firstImageFile(data.files);
  if (file) return { file, source: 'drag' };
  const svg = extractSvg(transferText(data, 'text/html') || transferText(data, 'text/plain'));
  if (!svg || !isSafeSvg(svg)) return undefined;
  return { file: svgFile(svg), source: 'clipboard-svg' };
}

export async function imageInputFromClipboardData(data: TransferLike): Promise<ImageInput | undefined> {
  const file = firstImageFile(data.files);
  if (file) return { file, source: 'clipboard' };
  const svg = extractSvg(transferText(data, 'text/html') || transferText(data, 'text/plain'));
  if (!svg || !isSafeSvg(svg)) return undefined;
  return { file: svgFile(svg), source: 'clipboard-svg' };
}

export async function imageInputFromNavigatorClipboard(clipboard: ClipboardLike | undefined = typeof navigator === 'undefined' ? undefined : navigator.clipboard): Promise<ImageInput | undefined> {
  if (!clipboard?.read && !clipboard?.readText) return undefined;
  const items = clipboard.read ? await clipboard.read() : [];
  for (const item of items) {
    const imageType = item.types.find((type) => type.startsWith('image/'));
    if (imageType) {
      const blob = await item.getType(imageType);
      if (imageType === SVG_MIME) {
        const svg = await blobText(blob);
        if (!isSafeSvg(svg)) return undefined;
        return { file: svgFile(svg), source: 'clipboard-svg' };
      }
      return { file: new File([blob], `clipboard.${extensionForImageType(imageType)}`, { type: imageType }), source: 'clipboard' };
    }
    const textType = item.types.find((type) => type === 'text/html' || type === 'text/plain');
    if (textType) {
      const svg = extractSvg(await blobText(await item.getType(textType)));
      if (svg && isSafeSvg(svg)) return { file: svgFile(svg), source: 'clipboard-svg' };
    }
  }
  const svg = extractSvg(clipboard.readText ? await clipboard.readText() : '');
  if (svg && isSafeSvg(svg)) return { file: svgFile(svg), source: 'clipboard-svg' };
  return undefined;
}

export function imageInputFromUpload(file: File | undefined): ImageInput | undefined {
  if (!file || !firstImageFile([file])) return undefined;
  return { file, source: 'upload' };
}

export function imageInputSourceLabel(source: ImageInputSource) {
  if (source === 'drag') return '拖拽图片';
  if (source === 'clipboard') return '剪贴板图片';
  if (source === 'clipboard-svg') return '剪贴板 SVG';
  return '本地上传';
}
