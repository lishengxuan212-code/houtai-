import { z } from 'zod';
import { ComponentNodeSchema, DataSourceSchema, InteractionSchema, PageFrameSchema } from '../domain/schemas';

export const UserTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['page', 'pageFrame', 'canvasBoard', 'block', 'group', 'component', 'componentPreset']),
  category: z.string(),
  thumbnail: z.string().optional(),
  content: z.object({
    nodes: z.record(z.string(), ComponentNodeSchema),
    rootNodeId: z.string(),
    frames: z.array(PageFrameSchema).optional(),
    interactions: z.array(InteractionSchema),
    dataSources: z.array(DataSourceSchema).optional(),
  }),
  saveOptions: z
    .object({
      includeProps: z.boolean(),
      includeContent: z.boolean(),
      includeData: z.boolean(),
      includeInternalInteractions: z.boolean(),
      includeExternalReferences: z.boolean(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
});

export const UserTemplateListSchema = z.array(UserTemplateSchema);
