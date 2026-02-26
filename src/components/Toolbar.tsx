import { useRef } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useProjectsStore } from '../store/projectsStore';
import type { Script } from '../types';

export function Toolbar() {
  const { script, saveScript, loadScript, setAiPanelOpen, aiPanelOpen } = useScriptStore();
  const { openPanel, upsertProject } = useProjectsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    saveScript();
    upsertProject({ ...script, updatedAt: Date.now() });
    const btn = document.getElementById('save-btn');
    if (btn) {
      btn.textContent = '已保存 ✓';
      setTimeout(() => (btn.textContent = '保存'), 1200);
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(script, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Script;
        loadScript(data);
        upsertProject(data);
      } catch {
        alert('文件格式错误，请选择有效的剧本 JSON 文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="flex items-center gap-3 px-4 py-2.5 bg-gray-950 border-b border-white/10 flex-shrink-0">
      {/* Logo → 打开项目面板 */}
      <button
        onClick={openPanel}
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/8 transition-colors group mr-1"
        title="返回项目列表"
      >
        <span className="text-lg">🎭</span>
        <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors hidden sm:block">
          剧本创作器
        </span>
        <span className="text-[10px] text-white/25 group-hover:text-white/50 transition-colors hidden sm:block">
          ◂ 项目
        </span>
      </button>

      {/* 分隔 */}
      <div className="w-px h-4 bg-white/10" />

      {/* 当前项目标题 */}
      <input
        value={script.title}
        onChange={(e) => useScriptStore.getState().setScriptTitle(e.target.value)}
        className="flex-1 max-w-xs bg-transparent border-b border-white/20 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 pb-0.5"
        placeholder="故事标题..."
      />

      <div className="flex-1" />

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <button
          id="save-btn"
          onClick={handleSave}
          className="px-3 py-1.5 text-xs text-white bg-indigo-700 hover:bg-indigo-600 rounded transition-colors"
        >
          保存
        </button>

        <button
          onClick={handleExport}
          className="px-3 py-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
        >
          导出
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
        >
          导入
        </button>

        <button
          onClick={() => setAiPanelOpen(!aiPanelOpen)}
          className={`px-3 py-1.5 text-xs rounded transition-colors border ${
            aiPanelOpen
              ? 'bg-purple-600/30 border-purple-500/40 text-purple-300'
              : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          ✨ 千问 AI
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
    </header>
  );
}
