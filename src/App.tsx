import { WorkbenchShell } from './editor/workbench/WorkbenchShell';
import { ProjectHome } from './project/ProjectHome';
import { useState } from 'react';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'editor'>('home');
  if (screen === 'home') return <ProjectHome onOpenProject={() => setScreen('editor')} />;
  return <WorkbenchShell onBackHome={() => setScreen('home')} />;
}
