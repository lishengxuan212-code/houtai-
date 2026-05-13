import { describe, expect, it } from 'vitest';
import type { ComponentNode, JsonRecord } from '../domain/types';
import { patchArrayItemLabel, patchScalarProp, patchScopedArrayItemLabel, patchScopedText, patchTableCell } from '../editor/inlineEdit/inlineEditProps';

describe('inline edit prop patches', () => {
  it('patches scalar props without touching unrelated props', () => {
    const props: JsonRecord = { text: 'Old', variant: 'primary', danger: false };
    expect(patchScalarProp(props, 'text', 'New')).toEqual({ text: 'New' });
    expect(props).toEqual({ text: 'Old', variant: 'primary', danger: false });
  });

  it('patches table column title by stable key', () => {
    const props: JsonRecord = {
      columns: [
        { key: 'orderNo', title: 'Order No' },
        { key: 'amount', title: 'Amount' },
      ],
    };

    expect(patchArrayItemLabel(props, 'columns', 'amount', 'title', 'Total')).toEqual({
      columns: [
        { key: 'orderNo', title: 'Order No' },
        { key: 'amount', title: 'Total' },
      ],
    });
  });

  it('patches string table column labels while preserving the original data key', () => {
    const props: JsonRecord = {
      columns: ['限制方式', '概率', '排序'],
    };

    expect(patchArrayItemLabel(props, 'columns', '排序', 'title', '排序规则')).toEqual({
      columns: ['限制方式', '概率', { key: '排序', title: '排序规则' }],
    });
  });

  it('patches form/search field labels while preserving field details', () => {
    const props: JsonRecord = {
      fields: [
        { key: 'status', label: 'Status', type: 'select', required: true, options: ['Open'] },
      ],
    };

    expect(patchArrayItemLabel(props, 'fields', 'status', 'label', 'Current Status')).toEqual({
      fields: [{ key: 'status', label: 'Current Status', type: 'select', required: true, options: ['Open'] }],
    });
  });

  it('returns an empty patch for a missing array item', () => {
    const props: JsonRecord = { fields: [{ key: 'name', label: 'Name', type: 'text' }] };
    expect(patchArrayItemLabel(props, 'fields', 'missing', 'label', 'Missing')).toEqual({});
  });

  it('patches content fields when inline editing a content-backed form', () => {
    const node: ComponentNode = {
      id: 'form_1',
      type: 'pro.ProForm',
      name: 'Form',
      props: {},
      content: { fields: [{ key: 'status', label: 'Status', type: 'select', options: ['Open'] }] },
    };

    expect(patchScopedArrayItemLabel(node, 'fields', 'status', 'label', 'Current Status')).toEqual({
      scope: 'content',
      patch: { fields: [{ key: 'status', label: 'Current Status', type: 'select', options: ['Open'] }] },
    });
  });

  it('patches nested content text for modal body inline editing', () => {
    const node: ComponentNode = {
      id: 'modal_1',
      type: 'Modal',
      name: 'Modal',
      props: { title: 'Confirm' },
      content: { body: 'Old body' },
    };

    expect(patchScopedText(node, 'content.body', 'New body')).toEqual({
      scope: 'content',
      patch: { body: 'New body' },
    });
  });

  it('creates a row when inline editing an example table cell', () => {
    expect(patchTableCell([], 0, 'name', 'Edited', { id: 'preview_row_1', name: 'Example' })).toEqual([{ id: 'preview_row_1', name: 'Edited' }]);
  });
});
