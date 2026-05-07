import { z } from 'zod';
import { ComponentNodeSchema, DataSourceSchema, InteractionSchema } from '../domain/schemas';

export const UserTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['page', 'block', 'component']),
  category: z.string(),
  thumbnail: z.string().optional(),
  content: z.object({
    nodes: z.record(z.string(), ComponentNodeSchema),
    rootNodeId: z.string(),
    interactions: z.array(InteractionSchema),
    dataSources: z.array(DataSourceSchema).optional(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().positive(),
});

export const UserTemplateListSchema = z.array(UserTemplateSchema);
