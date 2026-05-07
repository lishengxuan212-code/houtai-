import {
  EditableProTableAdapter,
  ProCardAdapter,
  ProDescriptionsAdapter,
  ProFormAdapter,
  ProLayoutAdapter,
  ProListAdapter,
  ProPageContainerAdapter,
  ProTableAdapter,
} from './proComponentAdapters';

export const proComponentRenderers = {
  'pro.ProTable': ProTableAdapter,
  'pro.EditableProTable': EditableProTableAdapter,
  'pro.ProForm': ProFormAdapter,
  'pro.ProLayout': ProLayoutAdapter,
  'pro.PageContainer': ProPageContainerAdapter,
  'pro.ProCard': ProCardAdapter,
  'pro.ProDescriptions': ProDescriptionsAdapter,
  'pro.ProList': ProListAdapter,
};
