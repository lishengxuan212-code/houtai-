import { describe, expect, it } from 'vitest';
import { imageInputFromClipboardData, imageInputFromDataTransfer, imageInputFromNavigatorClipboard } from '../ai/imageInput';

function file(name: string, type: string, content = 'content') {
  return new File([content], name, { type });
}

function transfer(files: File[] = [], data: Record<string, string> = {}) {
  return {
    files,
    types: Object.keys(data),
    getData: (type: string) => data[type] ?? '',
  };
}

describe('image input', () => {
  it('accepts dragged bitmap image files', async () => {
    const input = await imageInputFromDataTransfer(transfer([file('screen.png', 'image/png')]));

    expect(input).toMatchObject({
      source: 'drag',
      file: expect.objectContaining({ name: 'screen.png', type: 'image/png' }),
    });
  });

  it('accepts pasted clipboard image files', async () => {
    const input = await imageInputFromClipboardData(transfer([file('clipboard.webp', 'image/webp')]));

    expect(input).toMatchObject({
      source: 'clipboard',
      file: expect.objectContaining({ name: 'clipboard.webp', type: 'image/webp' }),
    });
  });

  it('converts pasted svg text into an image file', async () => {
    const input = await imageInputFromClipboardData(transfer([], {
      'text/plain': '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="32"><rect width="120" height="32"/></svg>',
    }));

    expect(input?.source).toBe('clipboard-svg');
    expect(input?.file.name).toBe('clipboard.svg');
    expect(input?.file.type).toBe('image/svg+xml');
    expect(input?.file.size).toBeGreaterThan(0);
  });

  it('extracts pasted svg from html clipboard content', async () => {
    const input = await imageInputFromClipboardData(transfer([], {
      'text/html': '<div><svg width="20" height="20"><circle cx="10" cy="10" r="8"></circle></svg></div>',
    }));

    expect(input?.source).toBe('clipboard-svg');
    expect(input?.file.size).toBeGreaterThan(0);
  });

  it('rejects unsafe pasted svg content', async () => {
    const input = await imageInputFromClipboardData(transfer([], {
      'text/plain': '<svg onload="alert(1)"><script>alert(1)</script></svg>',
    }));

    expect(input).toBeUndefined();
  });

  it('reads bitmap images from the async clipboard API', async () => {
    const clipboard = {
      read: async () => [
        {
          types: ['image/png'],
          getType: async () => new Blob(['png'], { type: 'image/png' }),
        },
      ],
    };

    const input = await imageInputFromNavigatorClipboard(clipboard);

    expect(input).toMatchObject({
      source: 'clipboard',
      file: expect.objectContaining({ name: 'clipboard.png', type: 'image/png' }),
    });
  });

  it('reads svg html from the async clipboard API', async () => {
    const clipboard = {
      read: async () => [
        {
          types: ['text/html'],
          getType: async () => ({ text: async () => '<div><svg width="16" height="16"><path d="M0 0h16v16z"/></svg></div>' }) as Blob,
        },
      ],
    };

    const input = await imageInputFromNavigatorClipboard(clipboard);

    expect(input).toMatchObject({
      source: 'clipboard-svg',
      file: expect.objectContaining({ name: 'clipboard.svg', type: 'image/svg+xml' }),
    });
  });

  it('falls back to readText for copied svg icon code', async () => {
    const clipboard = {
      read: async () => [],
      readText: async () => '<svg width="12" height="12"><path d="M1 1h10v10z"/></svg>',
    };

    const input = await imageInputFromNavigatorClipboard(clipboard);

    expect(input?.source).toBe('clipboard-svg');
    expect(input?.file.type).toBe('image/svg+xml');
  });
});
