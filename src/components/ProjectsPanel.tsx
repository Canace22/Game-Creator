import { useRef } from 'react';
import { useProjectsStore } from '../store/projectsStore';
import { useScriptStore } from '../store/scriptStore';
import type { Script } from '../types';

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function coverBg(s: Script) {
  return s.scenes[0]?.background ?? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
}

function nodeCount(s: Script) { return s.nodes.length; }
function branchCount(s: Script) { return s.nodes.filter((n) => n.type === 'choice').length; }
function endingCount(s: Script) { return s.nodes.filter((n) => n.type === 'end').length; }

export function ProjectsPage() {
  const { projects, closePanel, deleteProject, duplicateProject, importProject, upsertProject } =
    useProjectsStore();
  const { script, loadScript } = useScriptStore();
  const importRef = useRef<HTMLInputElement>(null);

  const handleOpen = (p: Script) => {
    upsertProject({ ...script, updatedAt: Date.now() });
    loadScript(p);
    closePanel();
  };

  const handleNew = () => {
    upsertProject({ ...script, updatedAt: Date.now() });
    useScriptStore.getState().newScript();
    // 新建后新脚本没有存入列表，先存一次
    setTimeout(() => {
      const s = useScriptStore.getState().script;
      upsertProject(s);
    }, 0);
    closePanel();
  };

  const handleDelete = (id: string) => {
    if (projects.length <= 1) { alert('至少保留一个项目'); return; }
    if (confirm('确认删除该项目？此操作不可撤销。')) {
      deleteProject(id);
      if (script.id === id) {
        const next = useProjectsStore.getState().projects[0];
        if (next) loadScript(next);
      }
    }
  };

  const handleExport = (p: Script) => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.title}.json`;
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
        const saved = importProject(data);
        loadScript(saved);
        closePanel();
      } catch {
        alert('文件格式错误，请选择有效的剧本 JSON 文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* 顶部导航 */}
      <header className="flex items-center gap-4 px-8 py-5 border-b border-white/10 flex-shrink-0">
        <span className="text-2xl">🎭</span>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">剧本游戏创作器</h1>
          <p className="text-xs text-white/30 mt-0.5">选择一个项目开始创作，或新建项目</p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => importRef.current?.click()}
          className="px-3 py-2 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
        >
          导入 JSON
        </button>
        <button
          onClick={handleNew}
          className="px-4 py-2 text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-600 rounded-lg transition-colors"
        >
          + 新建项目
        </button>
      </header>

      {/* 项目网格 */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 gap-4">
            <span className="text-5xl">📂</span>
            <p className="text-sm">还没有项目，点击「新建项目」开始创作</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-white/30 mb-4">{projects.length} 个项目</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {/* 新建卡片 */}
              <button
                onClick={handleNew}
                className="flex flex-col items-center justify-center h-[200px] rounded-xl border-2 border-dashed border-white/15 hover:border-indigo-400/50 hover:bg-white/3 text-white/30 hover:text-indigo-400 transition-all gap-2 group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">+</span>
                <span className="text-xs">新建项目</span>
              </button>

              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isCurrent={p.id === script.id}
                  onOpen={() => handleOpen(p)}
                  onDuplicate={() => duplicateProject(p.id)}
                  onDelete={() => handleDelete(p.id)}
                  onExport={() => handleExport(p)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
    </div>
  );
}

function ProjectCard({
  project, isCurrent, onOpen, onDuplicate, onDelete, onExport,
}: {
  project: Script;
  isCurrent: boolean;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  return (
    <div
      className={`group relative flex flex-col rounded-xl border overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${
        isCurrent
          ? 'border-indigo-400/60 shadow-lg shadow-indigo-500/20'
          : 'border-white/10 hover:border-white/30'
      }`}
      onClick={onOpen}
    >
      {/* 封面 */}
      <div
        className="h-28 relative flex items-end p-3 flex-shrink-0"
        style={{ background: coverBg(project) }}
      >
        {/* 角色气泡 */}
        <div className="flex gap-1.5 flex-wrap">
          {project.characters.slice(0, 4).map((c) => (
            <div
              key={c.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-black/40 shadow"
              style={{ backgroundColor: c.color }}
              title={c.name}
            >
              {c.name.charAt(0)}
            </div>
          ))}
          {project.characters.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white border-2 border-black/30">
              +{project.characters.length - 4}
            </div>
          )}
        </div>

        {isCurrent && (
          <span className="absolute top-2 left-2 text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-medium shadow">
            编辑中
          </span>
        )}
      </div>

      {/* 信息区 */}
      <div className="bg-gray-900 p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-medium text-white truncate leading-snug">{project.title}</h3>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-white/35">
          <span>{nodeCount(project)} 节点</span>
          {branchCount(project) > 0 && <span>{branchCount(project)} 分支</span>}
          {endingCount(project) > 0 && <span>{endingCount(project)} 结局</span>}
        </div>
        <p className="text-[10px] text-white/20 mt-auto pt-1">{formatDate(project.updatedAt)}</p>
      </div>

      {/* 悬浮操作 */}
      <div
        className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onDuplicate}
          title="复制"
          className="w-6 h-6 rounded bg-black/60 backdrop-blur text-white/60 hover:text-white flex items-center justify-center text-xs transition-colors"
        >
          ⎘
        </button>
        <button
          onClick={onExport}
          title="导出 JSON"
          className="w-6 h-6 rounded bg-black/60 backdrop-blur text-white/60 hover:text-white flex items-center justify-center text-xs transition-colors"
        >
          ↓
        </button>
        <button
          onClick={onDelete}
          title="删除"
          className="w-6 h-6 rounded bg-black/60 backdrop-blur text-white/40 hover:text-rose-400 flex items-center justify-center text-xs transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
