import { useState } from 'react';
import { useScriptStore } from '../../store/scriptStore';
import type { Character, Scene } from '../../types';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
];

const PRESET_BACKGROUNDS = [
  { label: '深夜', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
  { label: '黄昏', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)' },
  { label: '森林', value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
  { label: '沙漠', value: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' },
  { label: '星空', value: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a3e 50%, #000 100%)' },
  { label: '清晨', value: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
  { label: '雨天', value: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)' },
  { label: '樱花', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
];

type Tab = 'characters' | 'scenes';

export function CharManager() {
  const [tab, setTab] = useState<Tab>('characters');
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [newCharName, setNewCharName] = useState('');
  const [newSceneName, setNewSceneName] = useState('');

  const { script, addCharacter, updateCharacter, deleteCharacter, addScene, updateScene, deleteScene } =
    useScriptStore();

  const handleAddChar = () => {
    if (!newCharName.trim()) return;
    addCharacter({ name: newCharName.trim(), color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] });
    setNewCharName('');
  };

  const handleAddScene = () => {
    if (!newSceneName.trim()) return;
    addScene({ name: newSceneName.trim(), background: PRESET_BACKGROUNDS[0].value });
    setNewSceneName('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-white/10">
        {(['characters', 'scenes'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              tab === t
                ? 'text-white border-b-2 border-indigo-400'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {t === 'characters' ? '角色' : '场景'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tab === 'characters' && (
          <>
            {script.characters.map((char) => (
              <CharItem
                key={char.id}
                char={char}
                isEditing={editingCharId === char.id}
                onEdit={() => setEditingCharId(char.id)}
                onSave={(patch) => {
                  updateCharacter(char.id, patch);
                  setEditingCharId(null);
                }}
                onDelete={() => deleteCharacter(char.id)}
              />
            ))}
            <div className="flex gap-2 mt-3">
              <input
                value={newCharName}
                onChange={(e) => setNewCharName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChar()}
                placeholder="新角色名称"
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-400"
              />
              <button
                onClick={handleAddChar}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded transition-colors"
              >
                添加
              </button>
            </div>
          </>
        )}

        {tab === 'scenes' && (
          <>
            {script.scenes.map((scene) => (
              <SceneItem
                key={scene.id}
                scene={scene}
                isEditing={editingSceneId === scene.id}
                onEdit={() => setEditingSceneId(scene.id)}
                onSave={(patch) => {
                  updateScene(scene.id, patch);
                  setEditingSceneId(null);
                }}
                onDelete={() => deleteScene(scene.id)}
              />
            ))}
            <div className="flex gap-2 mt-3">
              <input
                value={newSceneName}
                onChange={(e) => setNewSceneName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddScene()}
                placeholder="新场景名称"
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-400"
              />
              <button
                onClick={handleAddScene}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded transition-colors"
              >
                添加
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CharItem({
  char,
  isEditing,
  onEdit,
  onSave,
  onDelete,
}: {
  char: Character;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (patch: Partial<Character>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(char.name);
  const [color, setColor] = useState(char.color);

  if (isEditing) {
    return (
      <div className="bg-white/5 border border-indigo-400/30 rounded p-3 space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-400"
        />
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                color === c ? 'scale-125 border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave({ name, color })}
            className="flex-1 py-1 bg-indigo-600 text-white text-xs rounded"
          >
            保存
          </button>
          <button
            onClick={() => onSave({})}
            className="flex-1 py-1 bg-white/10 text-white/60 text-xs rounded"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 p-2.5 bg-white/5 border border-white/5 rounded-lg hover:border-white/15 transition-colors">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: char.color }}
      >
        {char.name.charAt(0)}
      </div>
      <span className="flex-1 text-sm text-white/80">{char.name}</span>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
        <button onClick={onEdit} className="text-white/40 hover:text-white text-xs px-1">
          编辑
        </button>
        <button onClick={onDelete} className="text-white/40 hover:text-rose-400 text-xs px-1">
          删除
        </button>
      </div>
    </div>
  );
}

function SceneItem({
  scene,
  isEditing,
  onEdit,
  onSave,
  onDelete,
}: {
  scene: Scene;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (patch: Partial<Scene>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(scene.name);
  const [bg, setBg] = useState(scene.background);

  if (isEditing) {
    return (
      <div className="bg-white/5 border border-indigo-400/30 rounded p-3 space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-400"
        />
        <div className="grid grid-cols-4 gap-1.5">
          {PRESET_BACKGROUNDS.map((b) => (
            <button
              key={b.value}
              onClick={() => setBg(b.value)}
              className={`h-8 rounded text-[10px] text-white/80 border-2 transition-all ${
                bg === b.value ? 'border-white scale-105' : 'border-transparent'
              }`}
              style={{ background: b.value }}
              title={b.label}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave({ name, background: bg })}
            className="flex-1 py-1 bg-indigo-600 text-white text-xs rounded"
          >
            保存
          </button>
          <button
            onClick={() => onSave({})}
            className="flex-1 py-1 bg-white/10 text-white/60 text-xs rounded"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 p-2.5 bg-white/5 border border-white/5 rounded-lg hover:border-white/15 transition-colors">
      <div
        className="w-10 h-7 rounded flex-shrink-0 border border-white/10"
        style={{ background: scene.background }}
      />
      <span className="flex-1 text-sm text-white/80">{scene.name}</span>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
        <button onClick={onEdit} className="text-white/40 hover:text-white text-xs px-1">
          编辑
        </button>
        <button onClick={onDelete} className="text-white/40 hover:text-rose-400 text-xs px-1">
          删除
        </button>
      </div>
    </div>
  );
}
