import { Tree } from 'antd';
import type { LibraryCategory } from '../../registry/antdManifest';
import { libraryCategories } from '../../registry/antdManifest';

export function ComponentCategoryTree({ value, onChange }: { value: LibraryCategory | '全部'; onChange: (value: LibraryCategory | '全部') => void }) {
  return (
    <Tree
      blockNode
      selectedKeys={[value]}
      treeData={[{ key: '全部', title: '全部组件' }, ...libraryCategories.map((category) => ({ key: category, title: category }))]}
      onSelect={(keys) => onChange((keys[0] as LibraryCategory | '全部') ?? '全部')}
    />
  );
}
