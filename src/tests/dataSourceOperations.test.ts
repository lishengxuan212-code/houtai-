import { describe, expect, it } from 'vitest';
import { applyOperation } from '../domain/operations';
import { initialProject } from '../store/initialProject';

describe('data source operations', () => {
  it('updates mock records through a serializable operation', () => {
    const project = applyOperation(initialProject, {
      type: 'updateDataSourceRecords',
      dataSourceId: 'ds_orders',
      records: [{ id: 'order_new', orderNo: 'SO-NEW', status: '待发货' }],
    });

    const source = project.dataSources.find((item) => item.id === 'ds_orders');
    expect(source?.records).toEqual([{ id: 'order_new', orderNo: 'SO-NEW', status: '待发货' }]);
  });
});
