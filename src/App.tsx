import { useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { ScriptTextEditor } from './components/Editor/ScriptTextEditor';
import { NodeList } from './components/Editor/NodeList';
import { NodeEditor } from './components/Editor/NodeEditor';
import { CharManager } from './components/Editor/CharManager';
import { GameRenderer } from './components/Game/GameRenderer';
import { AiPanel } from './components/AiPanel';
import { ProjectsPage } from './components/ProjectsPanel';
import { useScriptStore } from './store/scriptStore';
import { useProjectsStore } from './store/projectsStore';

type RightTab = 'nodes' | 'chars' | 'preview';

export default function App() {
  const [rightTab, setRightTab] = useState<RightTab>('preview');
  const { aiPanelOpen } = useScriptStore();
  const { panelOpen } = useProjectsStore();

  // 首页：项目管理
  if (panelOpen) {
    return <ProjectsPage />;
  }

  // 编辑器页
  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：剧本富文本编辑器 */}
        <div className="flex-1 min-w-0 border-r border-white/10 overflow-hidden bg-gray-900">
          <ScriptTextEditor />
        </div>

        {/* 千问 AI 面板（可收起） */}
        {aiPanelOpen && (
          <div className="w-[300px] flex-shrink-0 border-r border-white/10 overflow-hidden flex flex-col bg-gray-950">
            <AiPanel />
          </div>
        )}

        {/* 右侧面板 */}
        <div className="w-[380px] flex-shrink-0 flex flex-col overflow-hidden">
          <div className="flex border-b border-white/10 flex-shrink-0 bg-gray-950">
            {(['preview', 'nodes', 'chars'] as RightTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setRightTab(t)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  rightTab === t
                    ? 'text-white border-b-2 border-indigo-400 bg-white/3'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {t === 'preview' ? '▶ 游戏预览' : t === 'nodes' ? '节点' : '角色 / 场景'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {rightTab === 'preview' && <GameRenderer />}
            {rightTab === 'nodes' && (
              <div className="flex flex-col h-full">
                <div className="h-[220px] flex-shrink-0 border-b border-white/10 overflow-hidden">
                  <NodeList />
                </div>
                <div className="flex-1 overflow-hidden">
                  <NodeEditor />
                </div>
              </div>
            )}
            {rightTab === 'chars' && <CharManager />}
          </div>
        </div>
      </div>
    </div>
  );
}
