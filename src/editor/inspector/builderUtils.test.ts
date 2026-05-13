import { describe, expect, it } from 'vitest';
import {
  addFormField,
  addTableColumn,
  deleteListItem,
  moveListItem,
  updateFormField,
  updateTableColumn,
} from './builderUtils';

describe('inspector builder utils', () => {
  it('adds, updates, deletes, and reorders table columns without mutating input', () => {
    const columns = [
      { key: 'orderNo', title: 'Order No' },
      { key: 'amount', title: 'Amount' },
    ];

    const added = addTableColumn(columns);
    expect(added).toHaveLength(3);
    expect(added[2]).toMatchObject({ key: 'column3', title: 'New Column' });
    expect(columns).toHaveLength(2);

    const updated = updateTableColumn(added, 'amount', { title: 'Total Amount' });
    expect(updated[1]).toMatchObject({ key: 'amount', title: 'Total Amount' });
    expect(added[1]).toMatchObject({ key: 'amount', title: 'Amount' });

    const moved = moveListItem(updated, 1, 'up');
    expect(moved.map((column) => (typeof column === 'string' ? column : column.key))).toEqual(['amount', 'orderNo', 'column3']);

    const deleted = deleteListItem(moved, 1);
    expect(deleted.map((column) => (typeof column === 'string' ? column : column.key))).toEqual(['amount', 'column3']);
  });

  it('adds, updates, deletes, and reorders form fields while preserving field details', () => {
    const fields = [
      { key: 'name', label: 'Name', type: 'text' as const, required: true },
      { key: 'status', label: 'Status', type: 'select' as const, options: ['Open', 'Closed'] },
    ];

    const added = addFormField(fields);
    expect(added[2]).toMatchObject({ key: 'field3', label: 'New Field', type: 'text' });

    const updated = updateFormField(added, 'status', { label: 'Current Status' });
    expect(updated[1]).toEqual({ key: 'status', label: 'Current Status', type: 'select', options: ['Open', 'Closed'] });

    const moved = moveListItem(updated, 2, 'up');
    expect(moved.map((field) => field.key)).toEqual(['name', 'field3', 'status']);

    const deleted = deleteListItem(moved, 0);
    expect(deleted.map((field) => field.key)).toEqual(['field3', 'status']);
  });
});
