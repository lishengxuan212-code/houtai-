import { Button, Divider, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { JsonRecord } from '../../domain/types';
import type { LibraryComponentDescriptor } from '../../registry/antdManifest';
import { getComponentDefinition, getResolvedDefaultProps } from '../../registry/componentDefinitionRegistry';
import { createComponentPreset } from '../../registry/componentPresetRegistry';
import { getComponentDefaultOverrides, restoreComponentDefaultProps, saveComponentDefaultProps, saveComponentPreset } from '../../store/componentLibraryStore';
import { GeneratedInspector } from '../inspector/GeneratedInspector';

function registryType(component: LibraryComponentDescriptor): string {
  return component.source === 'pro-components' ? `pro.${component.key}` : component.key;
}

export function LibraryComponentDetailPanel({ component }: { component: LibraryComponentDescriptor | undefined }) {
  const type = component ? registryType(component) : '';
  const definition = useMemo(() => (type ? getComponentDefinition(type) : undefined), [type]);
  const initialProps = useMemo(() => (type ? getResolvedDefaultProps(type, getComponentDefaultOverrides()) : {}), [type]);
  const [draft, setDraft] = useState<{ type: string; props: JsonRecord }>({ type, props: initialProps });

  if (draft.type !== type) setDraft({ type, props: initialProps });
  const draftProps = draft.type === type ? draft.props : initialProps;
  const setDraftProps = (props: JsonRecord) => setDraft({ type, props });

  if (!component || !definition) return <Typography.Text type="secondary">选择组件后可编辑默认属性和保存预设。</Typography.Text>;

  return (
    <div className="library-detail-panel">
      <Typography.Text strong>{definition.nameZh}</Typography.Text>
      <Typography.Paragraph type="secondary">{definition.nameEn}</Typography.Paragraph>
      <Space wrap>
        <Tag>{definition.category}</Tag>
        <Tag>{definition.source === 'pro-components' ? 'ProComponents' : definition.source === 'mui' ? 'MUI v7' : 'Ant Design'}</Tag>
      </Space>
      <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
        {definition.description ?? component.description}
      </Typography.Paragraph>
      <Divider style={{ margin: '12px 0' }} />
      <GeneratedInspector node={{ props: draftProps }} definition={definition} updateProps={setDraftProps} />
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button block type="primary" onClick={() => saveComponentDefaultProps(type, draftProps)}>
          保存为默认配置
        </Button>
        <Button
          block
          onClick={() => {
            saveComponentPreset(
              createComponentPreset({
                name: `${definition.nameZh}预设`,
                baseComponentType: type,
                category: definition.category,
                props: draftProps,
              }),
            );
          }}
        >
          保存为组件预设
        </Button>
        <Button
          block
          onClick={() => {
            restoreComponentDefaultProps(type);
            setDraftProps(getResolvedDefaultProps(type, {}));
          }}
        >
          恢复系统默认
        </Button>
      </Space>
    </div>
  );
}
