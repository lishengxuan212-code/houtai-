import type { AiSuggestion, Project } from '../domain/types';
import { runAiRules } from './rules';

export type AiAdapter = {
  checkProject: (project: Project) => Promise<AiSuggestion[]>;
};

export const ruleBasedAiAdapter: AiAdapter = {
  checkProject: async (project) => runAiRules(project),
};
