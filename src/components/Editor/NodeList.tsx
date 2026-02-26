import { useScriptStore } from '../../store/scriptStore';
import type { ScriptNode } from '../../types';

const NODE_TYPE_LABEL: Record<ScriptNode['type'], string> = {
  dialogue: '对话',
  choice: '选项',
  end: '结局',
};

const NODE_TYPE_COLOR: Record<ScriptNode['type'], string> = {
  dialogue: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  choice: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  end: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export function NodeList() {
  const { script, selectedNodeId, selectNode, addNode, deleteNode } = useScriptStore();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <span className="text-sm font-medium text-white/70">节点列表</span>
        <button
          onClick={() => addNode(selectedNodeId ?? undefined)}
          className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
        >
          + 添加
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {script.nodes.map((node) => {
          const char = script.characters.find((c) => c.id === node.speaker);
          const isSelected = node.id === selectedNodeId;
          const isStart = node.id === script.startNodeId;

          return (
            <div
              key={node.id}
              onClick={() => selectNode(node.id)}
              className={`group relative p-2.5 rounded-lg cursor-pointer border transition-all ${
                isSelected
                  ? 'bg-white/10 border-indigo-400/50'
                  : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {isStart && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded">
                    START
                  </span>
                )}
                <span
                  className={`text-[10px] px-1.5 py-0.5 border rounded ${NODE_TYPE_COLOR[node.type]}`}
                >
                  {NODE_TYPE_LABEL[node.type]}
                </span>
                {char && (
                  <span className="text-[10px] text-white/50 truncate">{char.name}</span>
                )}
              </div>
              <p className="text-xs text-white/80 truncate leading-relaxed">
                {node.text || '(空)'}
              </p>
              {node.id !== script.startNodeId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(node.id);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 transition-all text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
