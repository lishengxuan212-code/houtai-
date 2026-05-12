import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { antdLibraryManifest, muiV7LibraryManifest } from '../registry/antdManifest';
import { createNode } from '../registry/createNode';
import { getComponentDefinition, listComponentDefinitions } from '../registry/componentDefinitionRegistry';
import { RenderNode } from '../registry/renderers';

const expectedMuiTypes = [
  'MuiAutocomplete',
  'MuiButton',
  'MuiButtonGroup',
  'MuiCheckbox',
  'MuiFab',
  'MuiRadioGroup',
  'MuiRating',
  'MuiSelect',
  'MuiSlider',
  'MuiSwitch',
  'MuiTextField',
  'MuiTransferList',
  'MuiToggleButton',
  'MuiAvatar',
  'MuiBadge',
  'MuiChip',
  'MuiDivider',
  'MuiIcons',
  'MuiMaterialIcons',
  'MuiList',
  'MuiTable',
  'MuiTooltip',
  'MuiTypography',
  'MuiAlert',
  'MuiBackdrop',
  'MuiDialog',
  'MuiProgress',
  'MuiSkeleton',
  'MuiSnackbar',
  'MuiAccordion',
  'MuiAppBar',
  'MuiCard',
  'MuiPaper',
  'MuiBottomNavigation',
  'MuiBreadcrumbs',
  'MuiDrawer',
  'MuiLink',
  'MuiMenu',
  'MuiPagination',
  'MuiSpeedDial',
  'MuiStepper',
  'MuiTabs',
  'MuiBox',
  'MuiContainer',
  'MuiGrid',
  'MuiGridLegacy',
  'MuiStack',
  'MuiImageList',
  'MuiClickAwayListener',
  'MuiCssBaseline',
  'MuiModal',
  'MuiNoSsr',
  'MuiPopover',
  'MuiPopper',
  'MuiPortal',
  'MuiTextareaAutosize',
  'MuiTransitions',
  'MuiUseMediaQuery',
  'MuiMasonry',
  'MuiTimeline',
  'MuiLoadingButton',
  'MuiDateTimePickers',
  'MuiTreeView',
];

describe('MUI v7 component registry', () => {
  it('adds every MUI v7 getting-started component to the library manifest', () => {
    expect(muiV7LibraryManifest.map((component) => component.key)).toEqual(expectedMuiTypes);
    expect(antdLibraryManifest.filter((component) => component.source === 'mui').map((component) => component.key)).toEqual(expectedMuiTypes);
  });

  it('registers every MUI component as a creatable local definition', () => {
    const definitionTypes = listComponentDefinitions().filter((definition) => definition.source === 'mui').map((definition) => definition.type);

    expect(definitionTypes).toEqual(expect.arrayContaining(expectedMuiTypes));
    expect(definitionTypes).toHaveLength(expectedMuiTypes.length);
    for (const type of expectedMuiTypes) {
      expect(getComponentDefinition(type)?.nameZh).toBeTruthy();
      expect(createNode(type).type).toBe(type);
    }
  });

  it('renders MUI Accordion and MUI TextField through localized adapters', () => {
    const dispatch = vi.fn();

    render(
      <>
        <RenderNode node={createNode('MuiAccordion', { summary: '费用规则', details: '按订单金额计算。', defaultExpanded: true })} context={{ mode: 'edit', dispatch }} />
        <RenderNode node={createNode('MuiTextField', { label: '客户名称', placeholder: '请输入客户名称' })} context={{ mode: 'edit', dispatch }} />
      </>,
    );

    expect(screen.getByText('费用规则')).toBeInTheDocument();
    expect(screen.getByText('按订单金额计算。')).toBeInTheDocument();
    expect(screen.getByText('客户名称')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入客户名称')).toBeInTheDocument();
  });
});
