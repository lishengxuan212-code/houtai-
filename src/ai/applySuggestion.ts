import { applyOperations } from '../domain/operations';
import type { AiSuggestion, Project } from '../domain/types';

export function applySuggestion(project: Project, suggestion: AiSuggestion): Project {
  if (!suggestion.canApplyAutomatically || !suggestion.operations?.length) return project;
  return applyOperations(project, suggestion.operations);
}
