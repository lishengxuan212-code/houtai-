import type { JsonRecord, NodeCanvasConfig } from '../../domain/types';
import type { Interaction } from '../../domain/types';

export type ComponentPreset = {
  id: string;
  name: string;
  componentType: string;
  baseComponentType: string;
  description?: string;
  category?: string;
  props: JsonRecord;
  canvas?: NodeCanvasConfig;
  interactions?: Interaction[];
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CreateComponentPresetInput = {
  id?: string;
  name: string;
  componentType?: string;
  baseComponentType?: string;
  category?: string;
  description?: string;
  props?: JsonRecord;
  canvas?: NodeCanvasConfig;
  interactions?: Interaction[];
  now?: string;
};
