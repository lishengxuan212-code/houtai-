import { describe, expect, it } from 'vitest';
import type { JsonRecord } from '../domain/types';
import { patchArrayItemLabel, patchScalarProp } from '../editor/inlineEdit/inlineEditProps';

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
});
