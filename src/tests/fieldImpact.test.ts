import { describe, expect, it } from 'vitest';
import { buildFieldKeyImpact } from '../domain/fieldImpact';
import { applyOperation } from '../domain/operations';
import { initialProject } from '../store/initialProject';

describe('field key impact', () => {
  it('does not alter interactions when only a field label changes', () => {
    const source = initialProject.dataSources.find((item) => item.id === 'ds_orders')!;
    const project = applyOperation(initialProject, {
      type: 'updateDataSourceFields',
      dataSourceId: 'ds_orders',
      fields: source.fields.map((field) => (field.key === 'orderNo' ? { ...field, label: '订单编号' } : field)),
    });

    expect(project.interactions).toEqual(initialProject.interactions);
  });

  it('previews records and table columns affected by a field key rename', () => {
    const impact = buildFieldKeyImpact(initialProject, { dataSourceId: 'ds_orders', fromKey: 'orderNo', toKey: 'orderCode' });
    expect(impact.items.map((item) => item.type)).toEqual(expect.arrayContaining(['dataSourceField', 'recordValue', 'tableColumn']));
    expect(impact.canAutoSync).toBe(true);
  });

  it('syncs field key references while preserving labels', () => {
    const project = applyOperation(initialProject, {
      type: 'renameDataSourceFieldKey',
      dataSourceId: 'ds_orders',
      fromKey: 'orderNo',
      toKey: 'orderCode',
    });
    const source = project.dataSources.find((item) => item.id === 'ds_orders')!;
    const table = project.pages[0]!.nodes.node_orders_table!;

    expect(source.fields.some((field) => field.key === 'orderCode' && field.label === '订单号')).toBe(true);
    expect(source.records[0]?.orderCode).toBeDefined();
    expect(source.records[0]?.orderNo).toBeUndefined();
    expect(table.props.columns).toContainEqual({ key: 'orderCode', title: '订单号' });
  });
});
