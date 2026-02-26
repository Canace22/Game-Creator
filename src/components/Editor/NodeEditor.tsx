import { useScriptStore } from '../../store/scriptStore';
import type { ScriptNode, Choice } from '../../types';

export function NodeEditor() {
  const { script, selectedNodeId, updateNode, addNode } = useScriptStore();
  const node = script.nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-white/30 text-sm">
        选择一个节点开始编辑
      </div>
    );
  }

  const update = (patch: Partial<ScriptNode>) => updateNode(node.id, patch);

  const addChoice = () => {
    const choices = node.choices ?? [];
    // 自动创建一个新节点作为选项目标
    addNode(node.id);
    // 用 setTimeout 确保 store 更新后读取最新节点
    setTimeout(() => {
      const { script: s } = useScriptStore.getState();
      const lastNode = s.nodes[s.nodes.findIndex((n) => n.id === node.id) + 1];
      if (lastNode) {
        update({
          type: 'choice',
          next: undefined,
          choices: [...choices, { label: `选项 ${choices.length + 1}`, next: lastNode.id }],
        });
      }
    }, 0);
  };

  const updateChoice = (idx: number, patch: Partial<Choice>) => {
    const choices = (node.choices ?? []).map((c, i) => (i === idx ? { ...c, ...patch } : c));
    update({ choices });
  };

  const removeChoice = (idx: number) => {
    const choices = (node.choices ?? []).filter((_, i) => i !== idx);
    update({ choices, type: choices.length === 0 ? 'dialogue' : 'choice' });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div className="text-xs text-white/40 font-mono">{node.id}</div>

      {/* 节点类型 */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">节点类型</label>
        <div className="flex gap-2">
          {(['dialogue', 'choice', 'end'] as ScriptNode['type'][]).map((t) => (
            <button
              key={t}
              onClick={() => update({ type: t })}
              className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                node.type === t
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              }`}
            >
              {t === 'dialogue' ? '对话' : t === 'choice' ? '选项' : '结局'}
            </button>
          ))}
        </div>
      </div>

      {/* 场景 */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">场景</label>
        <select
          value={node.sceneId ?? ''}
          onChange={(e) => update({ sceneId: e.target.value || undefined })}
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400"
        >
          <option value="">— 无场景 —</option>
          {script.scenes.map((sc) => (
            <option key={sc.id} value={sc.id}>
              {sc.name}
            </option>
          ))}
        </select>
      </div>

      {/* 说话角色 */}
      {node.type !== 'end' && (
        <div>
          <label className="block text-xs text-white/50 mb-1.5">说话角色</label>
          <select
            value={node.speaker ?? ''}
            onChange={(e) => update({ speaker: e.target.value || undefined })}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400"
          >
            <option value="">— 无旁白 —</option>
            {script.characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 对话文本 */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">
          {node.type === 'end' ? '结局描述' : '对话内容'}
        </label>
        <textarea
          value={node.text}
          onChange={(e) => update({ text: e.target.value })}
          rows={4}
          placeholder="输入内容..."
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-400 resize-none"
        />
      </div>

      {/* 下一节点（对话节点） */}
      {node.type === 'dialogue' && (
        <div>
          <label className="block text-xs text-white/50 mb-1.5">下一节点</label>
          <select
            value={node.next ?? ''}
            onChange={(e) => update({ next: e.target.value || undefined })}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400"
          >
            <option value="">— 故事结束 —</option>
            {script.nodes
              .filter((n) => n.id !== node.id)
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.text.slice(0, 30) || n.id}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* 选项节点 */}
      {node.type === 'choice' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-white/50">选项列表</label>
            <button
              onClick={addChoice}
              className="text-xs px-2 py-1 bg-amber-600/50 hover:bg-amber-500/50 text-amber-300 rounded transition-colors"
            >
              + 添加选项
            </button>
          </div>
          <div className="space-y-2">
            {(node.choices ?? []).map((choice, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={choice.label}
                    onChange={(e) => updateChoice(idx, { label: e.target.value })}
                    placeholder="选项文字"
                    className="flex-1 bg-transparent border-b border-white/20 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-400 pb-0.5"
                  />
                  <button
                    onClick={() => removeChoice(idx)}
                    className="text-white/30 hover:text-rose-400 text-xs transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <select
                  value={choice.next}
                  onChange={(e) => updateChoice(idx, { next: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                >
                  {script.nodes
                    .filter((n) => n.id !== node.id)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.text.slice(0, 30) || n.id}
                      </option>
                    ))}
                </select>
              </div>
            ))}
            {(node.choices ?? []).length === 0 && (
              <p className="text-xs text-white/30 text-center py-2">点击"添加选项"创建分支</p>
            )}
          </div>
        </div>
      )}

      {/* 快捷转换为选项节点 */}
      {node.type === 'dialogue' && (
        <button
          onClick={addChoice}
          className="w-full py-2 text-xs text-amber-400/60 hover:text-amber-400 border border-dashed border-amber-400/20 hover:border-amber-400/40 rounded transition-colors"
        >
          + 转换为选项节点
        </button>
      )}
    </div>
  );
}
