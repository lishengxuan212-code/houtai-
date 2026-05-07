import { Empty } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { LibraryCategory, LibraryComponentDescriptor } from '../../registry/antdManifest';
import { antdLibraryManifest, filterLibraryComponents } from '../../registry/antdManifest';
import { useProjectStore } from '../../store/projectStore';
import { LibraryComponentDetailPanel } from '../library/LibraryComponentDetailPanel';
import { measureMetric } from '../performance/performanceMetrics';
import { ComponentCard } from './ComponentCard';
import { ComponentCategoryTree } from './ComponentCategoryTree';
import { ComponentSearch } from './ComponentSearch';

const SEARCH_DEBOUNCE_MS = 180;
const MAX_VISIBLE_COMPONENTS = 80;

export function ComponentLibraryPanel() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState<LibraryCategory | '全部'>('全部');
  const [selectedComponent, setSelectedComponent] = useState<LibraryComponentDescriptor | undefined>();
  const addComponent = useProjectStore((state) => state.addComponent);
  const components = useMemo(
    () => measureMetric('componentLibrarySearch', () => filterLibraryComponents(antdLibraryManifest, { query: debouncedQuery, category })),
    [debouncedQuery, category],
  );
  const visibleComponents = useMemo(() => components.slice(0, MAX_VISIBLE_COMPONENTS), [components]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);

  return (
    <div className="component-library-panel">
      <ComponentSearch value={query} onChange={setQuery} />
      <div className="component-library-body">
        <div className="component-library-categories">
          <ComponentCategoryTree value={category} onChange={setCategory} />
        </div>
        <div className="component-library-grid">
          {visibleComponents.map((component) => (
            <ComponentCard key={`${component.source}-${component.key}`} component={component} onAdd={addComponent} onInspect={setSelectedComponent} />
          ))}
          {components.length === 0 ? <Empty description="没有找到组件" /> : null}
          <LibraryComponentDetailPanel component={selectedComponent} />
        </div>
      </div>
    </div>
  );
}
