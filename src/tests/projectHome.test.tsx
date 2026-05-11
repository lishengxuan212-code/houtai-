import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectHome } from '../project/ProjectHome';
import { createProjectFromTemplate, saveProjectRecord } from '../project/ProjectManager';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
});

describe('ProjectHome', () => {
  it('renders project thumbnail cards and opens a selected project', () => {
    const project = createProjectFromTemplate({
      name: 'Visual Project',
      businessType: 'blank',
      template: 'blank',
      canvasWidth: 1366,
      canvasHeight: 768,
    });
    saveProjectRecord(project);
    const onOpen = vi.fn();

    render(<ProjectHome onOpenProject={onOpen} />);

    expect(screen.getByText('Visual Project')).toBeInTheDocument();
    expect(screen.getByText('1366 x 768')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Open Visual Project/ }));

    expect(onOpen).toHaveBeenCalledWith(project.id);
  });
});
