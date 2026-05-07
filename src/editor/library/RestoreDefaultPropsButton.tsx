import { Button } from 'antd';
import { restoreComponentDefaultProps } from '../../store/componentLibraryStore';

export function RestoreDefaultPropsButton({ componentType, onRestored }: { componentType: string; onRestored?: () => void }) {
  return <Button onClick={() => { restoreComponentDefaultProps(componentType); onRestored?.(); }}>恢复系统默认</Button>;
}
