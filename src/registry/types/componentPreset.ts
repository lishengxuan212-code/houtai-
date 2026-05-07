import type { JsonRecord } from '../../domain/types';
import type { Interaction } from '../../domain/types';

export type ComponentPreset = {
  id: string;
  name: string;
  componentType: string;
  baseComponentType: string;
  description?: string;
  category?: string;
  props: JsonRecord;
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
  interactions?: Interaction[];
  now?: string;
};
