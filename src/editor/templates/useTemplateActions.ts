import { recordRecentLibraryItem } from '../../store/componentLibraryStore';
import { useProjectStore } from '../../store/projectStore';
import { createPageFromTemplate, insertTemplateIntoPage } from '../../templates/templateOperations';
import type { UserTemplate } from '../../templates/userTemplateTypes';

function recentKindForTemplate(template: UserTemplate) {
  if (template.type === 'page' || template.type === 'pageFrame' || template.type === 'canvasBoard') return 'pageTemplate' as const;
  if (template.type === 'group') return 'groupTemplate' as const;
  if (template.type === 'componentPreset') return 'componentPreset' as const;
  return 'componentTemplate' as const;
}

export function useTemplateActions() {
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const currentFrameId = useProjectStore((state) => state.currentFrameId);
  const commitProject = useProjectStore((state) => state.commitProject);

  return {
    useTemplate(template: UserTemplate) {
      recordRecentLibraryItem({
        kind: recentKindForTemplate(template),
        sourceId: template.id,
        name: template.name,
        category: template.category,
        description: template.description,
      });
      if (template.type === 'page') {
        const next = createPageFromTemplate(project, template);
        const page = next.pages.at(-1);
        commitProject(next, page?.id, page?.rootNodeId);
        return;
      }
      const page = project.pages.find((item) => item.id === currentPageId);
      if (!page) return;
      const selected = selectedNodeId ? page.nodes[selectedNodeId] : undefined;
      const parentId = selected?.children ? selected.id : page.rootNodeId;
      const next = insertTemplateIntoPage(project, currentPageId, parentId, template, currentFrameId);
      commitProject(next, currentPageId, parentId);
    },
  };
}
