import { useProjectStore } from '../../store/projectStore';
import { createPageFromTemplate, insertTemplateIntoPage } from '../../templates/templateOperations';
import type { UserTemplate } from '../../templates/userTemplateTypes';

export function useTemplateActions() {
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const replaceProject = useProjectStore((state) => state.replaceProject);

  return {
    useTemplate(template: UserTemplate) {
      if (template.type === 'page') {
        const next = createPageFromTemplate(project, template);
        const page = next.pages.at(-1);
        replaceProject(next, page?.id, page?.rootNodeId);
        return;
      }
      const page = project.pages.find((item) => item.id === currentPageId);
      if (!page) return;
      const selected = selectedNodeId ? page.nodes[selectedNodeId] : undefined;
      const parentId = selected?.children ? selected.id : page.rootNodeId;
      replaceProject(insertTemplateIntoPage(project, currentPageId, parentId, template), currentPageId, parentId);
    },
  };
}
