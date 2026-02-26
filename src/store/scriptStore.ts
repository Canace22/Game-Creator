import { create } from 'zustand';
import type { Script, ScriptNode, Character, Scene, GameState } from '../types';
import { nanoid } from '../utils/nanoid';

function createNewScript(): Script {
  const now = Date.now();
  const sceneId = 'scene-default';
  const charId = 'char-narrator';
  const nodeId = `node-${nanoid()}`;
  return {
    id: nanoid(),
    title: '未命名故事',
    characters: [{ id: charId, name: '旁白', color: '#6366f1' }],
    scenes: [{ id: sceneId, name: '默认场景', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }],
    nodes: [{ id: nodeId, type: 'dialogue', sceneId, speaker: charId, text: '故事从这里开始...' }],
    startNodeId: nodeId,
    createdAt: now,
    updatedAt: now,
  };
}

export function createDemoScript(): Script {
  const now = Date.now();

  const scenes: Scene[] = [
    {
      id: 'scene-night',
      name: '深夜书房',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    },
    {
      id: 'scene-dawn',
      name: '黎明窗前',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)',
    },
    {
      id: 'scene-forest',
      name: '幽暗森林',
      background: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    },
    {
      id: 'scene-end',
      name: '真相之地',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a3e 50%, #000 100%)',
    },
  ];

  const characters: Character[] = [
    { id: 'char-narrator', name: '旁白',   color: '#6366f1' },
    { id: 'char-alice',   name: '爱丽丝', color: '#ec4899' },
    { id: 'char-shadow',  name: '影子',   color: '#8b5cf6' },
  ];

  // 节点 ID 预先定义，方便交叉引用
  const IDS = {
    n0:  'demo-n0',
    n1:  'demo-n1',
    n2:  'demo-n2',
    n3:  'demo-n3',
    n4:  'demo-n4',  // choice
    n5:  'demo-n5',  // 选A: 警察
    n6:  'demo-n6',
    n7:  'demo-n7',  // end A
    n8:  'demo-n8',  // 选B: 独自调查
    n9:  'demo-n9',
    n10: 'demo-n10',
    n11: 'demo-n11', // choice 2
    n12: 'demo-n12', // 相信影子
    n13: 'demo-n13', // end B
    n14: 'demo-n14', // 不相信
    n15: 'demo-n15', // end C
  };

  const nodes: ScriptNode[] = [
    // ── 开场：深夜书房 ──
    {
      id: IDS.n0, type: 'dialogue',
      sceneId: 'scene-night', speaker: 'char-narrator',
      text: '深夜，书房中蜡烛无风自灭。爱丽丝发现桌上多了一封陌生的信件。',
      next: IDS.n1,
    },
    {
      id: IDS.n1, type: 'dialogue',
      sceneId: 'scene-night', speaker: 'char-alice',
      text: '（颤抖着打开信封）这……这是什么？',
      next: IDS.n2,
    },
    {
      id: IDS.n2, type: 'dialogue',
      sceneId: 'scene-night', speaker: 'char-narrator',
      text: '信纸上只写了一行字——「你的记忆是假的。」',
      next: IDS.n3,
    },
    {
      id: IDS.n3, type: 'dialogue',
      sceneId: 'scene-night', speaker: 'char-alice',
      text: '谁……谁写的？这不可能是真的。',
      next: IDS.n4,
    },
    // ── 第一个选择 ──
    {
      id: IDS.n4, type: 'choice',
      sceneId: 'scene-night', speaker: 'char-alice',
      text: '我应该怎么做？',
      choices: [
        { label: '立刻去找警察', next: IDS.n5 },
        { label: '独自追查真相', next: IDS.n8 },
      ],
    },

    // ── 路线 A：警察 ──
    {
      id: IDS.n5, type: 'dialogue',
      sceneId: 'scene-dawn', speaker: 'char-narrator',
      text: '天刚破晓，爱丽丝赶到警察局。然而警官看了看信纸，轻描淡写地说——',
      next: IDS.n6,
    },
    {
      id: IDS.n6, type: 'dialogue',
      sceneId: 'scene-dawn', speaker: 'char-narrator',
      text: '「女士，这只是一个玩笑。」爱丽丝望着窗外渐亮的天空，心里明白——有些真相，体制帮不了你。',
      next: IDS.n7,
    },
    {
      id: IDS.n7, type: 'end',
      sceneId: 'scene-dawn',
      text: '结局 A：爱丽丝选择相信体制，却永远带着那个疑问入眠。',
    },

    // ── 路线 B：独自调查 ──
    {
      id: IDS.n8, type: 'dialogue',
      sceneId: 'scene-forest', speaker: 'char-narrator',
      text: '爱丽丝循着信封上的墨迹气味，走进了城郊的幽暗森林。',
      next: IDS.n9,
    },
    {
      id: IDS.n9, type: 'dialogue',
      sceneId: 'scene-forest', speaker: 'char-narrator',
      text: '树影深处，一个与爱丽丝一模一样的身影站在那里。',
      next: IDS.n10,
    },
    {
      id: IDS.n10, type: 'dialogue',
      sceneId: 'scene-forest', speaker: 'char-shadow',
      text: '终于来了。我等你很久了……另一个我。',
      next: IDS.n11,
    },
    // ── 第二个选择 ──
    {
      id: IDS.n11, type: 'choice',
      sceneId: 'scene-forest', speaker: 'char-alice',
      text: '你……你是谁？',
      choices: [
        { label: '「我相信你，告诉我真相。」', next: IDS.n12 },
        { label: '「你是幻觉，我不会上当。」', next: IDS.n14 },
      ],
    },

    // ── 路线 B-1：相信影子 ──
    {
      id: IDS.n12, type: 'dialogue',
      sceneId: 'scene-end', speaker: 'char-shadow',
      text: '我是你被抹去的那部分记忆。我们原本是一个人——在那场事故之后，他们把我们分开了。',
      next: IDS.n13,
    },
    {
      id: IDS.n13, type: 'end',
      sceneId: 'scene-end',
      text: '结局 B：爱丽丝与影子合而为一，找回了完整的自己。真相，有时比遗忘更沉重。',
    },

    // ── 路线 B-2：拒绝影子 ──
    {
      id: IDS.n14, type: 'dialogue',
      sceneId: 'scene-forest', speaker: 'char-shadow',
      text: '（叹气）好吧。等你想起来的那天……记得回来找我。',
      next: IDS.n15,
    },
    {
      id: IDS.n15, type: 'end',
      sceneId: 'scene-forest',
      text: '结局 C：爱丽丝独自走出森林，那个影子消散在晨雾里。遗忘，也是一种选择。',
    },
  ];

  return {
    id: 'demo-script',
    title: '记忆碎片',
    characters,
    scenes,
    nodes,
    startNodeId: IDS.n0,
    createdAt: now,
    updatedAt: now,
  };
}

interface ScriptStore {
  script: Script;
  selectedNodeId: string | null;
  gameState: GameState;
  isPreviewMode: boolean;
  aiPanelOpen: boolean;

  // 剧本操作
  setScriptTitle: (title: string) => void;
  addNode: (afterNodeId?: string) => void;
  updateNode: (id: string, patch: Partial<ScriptNode>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  addCharacter: (char: Omit<Character, 'id'>) => void;
  updateCharacter: (id: string, patch: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  addScene: (scene: Omit<Scene, 'id'>) => void;
  updateScene: (id: string, patch: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  newScript: () => void;
  saveScript: () => void;
  loadScript: (data: Script) => void;

  // 游戏操作
  startGame: () => void;
  advanceGame: (nextNodeId: string) => void;
  resetGame: () => void;

  // UI 状态
  setPreviewMode: (on: boolean) => void;
  setAiPanelOpen: (on: boolean) => void;
}

const STORAGE_KEY = 'game_creator_script';

function loadInitialScript(): Script {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Script;
      // 旧的空白占位剧本 → 升级为 Demo
      if (parsed.title === '未命名故事' && parsed.nodes.length <= 1) {
        return createDemoScript();
      }
      return parsed;
    }
  } catch {}
  return createDemoScript();
}

export const useScriptStore = create<ScriptStore>((set, get) => ({
  script: loadInitialScript(),
  selectedNodeId: 'demo-n0',
  gameState: { currentNodeId: null, history: [], isEnded: false },
  isPreviewMode: false,
  aiPanelOpen: false,

  setScriptTitle: (title) =>
    set((s) => ({ script: { ...s.script, title, updatedAt: Date.now() } })),

  addNode: (afterNodeId) => {
    const { script } = get();
    const newNode: ScriptNode = {
      id: `node-${nanoid()}`,
      type: 'dialogue',
      sceneId: script.scenes[0]?.id,
      speaker: script.characters[0]?.id,
      text: '新对话...',
    };
    const nodes = [...script.nodes];
    if (afterNodeId) {
      const idx = nodes.findIndex((n) => n.id === afterNodeId);
      if (idx !== -1) {
        // 自动链接：把前一个节点的 next 指向新节点，新节点 next 指向原来的 next
        const prev = nodes[idx];
        newNode.next = prev.next;
        nodes[idx] = { ...prev, next: newNode.id };
        nodes.splice(idx + 1, 0, newNode);
      } else {
        nodes.push(newNode);
      }
    } else {
      nodes.push(newNode);
    }
    set((s) => ({
      script: { ...s.script, nodes, updatedAt: Date.now() },
      selectedNodeId: newNode.id,
    }));
  },

  updateNode: (id, patch) =>
    set((s) => ({
      script: {
        ...s.script,
        nodes: s.script.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        updatedAt: Date.now(),
      },
    })),

  deleteNode: (id) => {
    const { script, selectedNodeId } = get();
    const nodes = script.nodes
      .filter((n) => n.id !== id)
      .map((n) => {
        const patches: Partial<ScriptNode> = {};
        if (n.next === id) patches.next = undefined;
        if (n.choices) {
          patches.choices = n.choices.filter((c) => c.next !== id);
        }
        return Object.keys(patches).length ? { ...n, ...patches } : n;
      });
    set((s) => ({
      script: { ...s.script, nodes, updatedAt: Date.now() },
      selectedNodeId: selectedNodeId === id ? (nodes[0]?.id ?? null) : selectedNodeId,
    }));
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  addCharacter: (char) => {
    const newChar: Character = { ...char, id: `char-${nanoid()}` };
    set((s) => ({
      script: {
        ...s.script,
        characters: [...s.script.characters, newChar],
        updatedAt: Date.now(),
      },
    }));
  },

  updateCharacter: (id, patch) =>
    set((s) => ({
      script: {
        ...s.script,
        characters: s.script.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        updatedAt: Date.now(),
      },
    })),

  deleteCharacter: (id) =>
    set((s) => ({
      script: {
        ...s.script,
        characters: s.script.characters.filter((c) => c.id !== id),
        updatedAt: Date.now(),
      },
    })),

  addScene: (scene) => {
    const newScene: Scene = { ...scene, id: `scene-${nanoid()}` };
    set((s) => ({
      script: {
        ...s.script,
        scenes: [...s.script.scenes, newScene],
        updatedAt: Date.now(),
      },
    }));
  },

  updateScene: (id, patch) =>
    set((s) => ({
      script: {
        ...s.script,
        scenes: s.script.scenes.map((sc) => (sc.id === id ? { ...sc, ...patch } : sc)),
        updatedAt: Date.now(),
      },
    })),

  deleteScene: (id) =>
    set((s) => ({
      script: {
        ...s.script,
        scenes: s.script.scenes.filter((sc) => sc.id !== id),
        updatedAt: Date.now(),
      },
    })),

  newScript: () => {
    const fresh = createNewScript();
    localStorage.removeItem(STORAGE_KEY);
    set({
      script: fresh,
      selectedNodeId: fresh.nodes[0].id,
      gameState: { currentNodeId: null, history: [], isEnded: false },
      isPreviewMode: false,
    });
  },

  saveScript: () => {
    const { script } = get();
    const updated = { ...script, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ script: updated });
  },

  loadScript: (data) =>
    set({
      script: data,
      selectedNodeId: data.nodes[0]?.id ?? null,
      gameState: { currentNodeId: null, history: [], isEnded: false },
      isPreviewMode: false,
    }),

  startGame: () => {
    const { script } = get();
    set({
      gameState: {
        currentNodeId: script.startNodeId,
        history: [script.startNodeId],
        isEnded: false,
      },
      isPreviewMode: true,
    });
  },

  advanceGame: (nextNodeId) => {
    const { script } = get();
    const node = script.nodes.find((n) => n.id === nextNodeId);
    set((s) => ({
      gameState: {
        currentNodeId: nextNodeId,
        history: [...s.gameState.history, nextNodeId],
        isEnded: node?.type === 'end' || !node,
      },
    }));
  },

  resetGame: () =>
    set({
      gameState: { currentNodeId: null, history: [], isEnded: false },
      isPreviewMode: false,
    }),

  setPreviewMode: (on) => set({ isPreviewMode: on }),
  setAiPanelOpen: (on) => set({ aiPanelOpen: on }),
}));
