/**
 * 剧本文本语法：
 *
 *   # 场景名                 → 后续节点使用该场景
 *   角色名：台词             → dialogue 节点，speaker=角色名
 *   旁白内容（无冒号前缀）   → dialogue 节点，无 speaker
 *   ? 提示语                 → choice 节点开始
 *   > A. 选项文字            → choice 节点的选项
 *   END 结局描述             → end 节点
 *   // 注释行                → 忽略
 *   空行                     → 忽略
 */

import type { Script, ScriptNode, Character, Scene } from '../types';
import { nanoid } from '../utils/nanoid';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
];

const DEFAULT_BG = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

export interface ParseLineToken {
  lineIndex: number;   // 对应原始行号（0-based）
  type: 'scene' | 'dialogue' | 'choice_prompt' | 'choice_option' | 'end' | 'comment' | 'empty';
  speaker?: string;
  text: string;
}

/** 逐行词法分析，返回带类型的 token 数组 */
export function tokenizeLines(raw: string): ParseLineToken[] {
  return raw.split('\n').map((line, lineIndex) => {
    const trimmed = line.trim();

    if (!trimmed) return { lineIndex, type: 'empty', text: '' };
    if (trimmed.startsWith('//')) return { lineIndex, type: 'comment', text: trimmed };
    if (trimmed.startsWith('#')) return { lineIndex, type: 'scene', text: trimmed.slice(1).trim() };
    if (trimmed.startsWith('>')) return { lineIndex, type: 'choice_option', text: trimmed.slice(1).trim() };
    if (trimmed.startsWith('?')) return { lineIndex, type: 'choice_prompt', text: trimmed.slice(1).trim() };
    if (/^END\b/i.test(trimmed)) return { lineIndex, type: 'end', text: trimmed.replace(/^END\s*/i, '').trim() };

    // 匹配 "角色名：内容"（支持中英文冒号）
    const colonIdx = trimmed.search(/[：:]/);
    if (colonIdx > 0 && colonIdx < 20) {
      const speaker = trimmed.slice(0, colonIdx).trim();
      const text = trimmed.slice(colonIdx + 1).trim();
      // 排除时间戳或网址之类（speaker 不含空格，纯文字）
      if (/^[\u4e00-\u9fa5a-zA-Z0-9_·]{1,15}$/.test(speaker)) {
        return { lineIndex, type: 'dialogue', speaker, text };
      }
    }

    // 无角色名 → 旁白
    return { lineIndex, type: 'dialogue', text: trimmed };
  });
}

/** tokens → Script 完整结构 */
export function buildScriptFromTokens(
  tokens: ParseLineToken[],
  title = '未命名故事',
  existingScript?: Script,
): Script {
  // 收集角色名
  const charNames = new Set<string>();
  tokens.forEach((t) => t.speaker && charNames.add(t.speaker));

  // 复用现有角色（保持颜色一致），新角色自动分配颜色
  const existingChars = existingScript?.characters ?? [];
  const charByName = new Map(existingChars.map((c) => [c.name, c]));
  let colorIdx = existingChars.length;
  const characters: Character[] = [];
  for (const name of charNames) {
    if (!charByName.has(name)) {
      const c: Character = { id: `char-${nanoid()}`, name, color: PRESET_COLORS[colorIdx++ % PRESET_COLORS.length] };
      charByName.set(name, c);
      characters.push(c);
    }
  }
  const allChars = [...existingChars.filter((c) => charNames.has(c.name)), ...characters];

  // 复用现有场景，新场景自动创建
  const existingScenes = existingScript?.scenes ?? [];
  const sceneByName = new Map(existingScenes.map((s) => [s.name, s]));
  const allScenes: Scene[] = [...existingScenes];

  const getOrCreateScene = (name: string): Scene => {
    if (sceneByName.has(name)) return sceneByName.get(name)!;
    const s: Scene = { id: `scene-${nanoid()}`, name, background: DEFAULT_BG };
    sceneByName.set(name, s);
    allScenes.push(s);
    return s;
  };

  // 默认场景
  const defaultScene = existingScenes[0] ?? getOrCreateScene('默认场景');

  // 构建节点
  const nodes: ScriptNode[] = [];
  let currentSceneId = defaultScene.id;

  // 收集 choice 选项行（连续的 > 行归属于前一个 choice_prompt）
  let pendingChoiceNode: ScriptNode | null = null;

  const flush = () => { pendingChoiceNode = null; };

  for (const token of tokens) {
    if (token.type === 'empty' || token.type === 'comment') continue;

    if (token.type === 'scene') {
      flush();
      const scene = getOrCreateScene(token.text);
      currentSceneId = scene.id;
      continue;
    }

    if (token.type === 'choice_option') {
      if (pendingChoiceNode) {
        pendingChoiceNode.choices = [
          ...(pendingChoiceNode.choices ?? []),
          { label: token.text, next: '' },
        ];
      }
      continue;
    }

    flush();

    if (token.type === 'dialogue') {
      const char = token.speaker ? charByName.get(token.speaker) : undefined;
      nodes.push({
        id: `node-${nanoid()}`,
        type: 'dialogue',
        sceneId: currentSceneId,
        speaker: char?.id,
        text: token.text,
      });
    } else if (token.type === 'choice_prompt') {
      const char = token.speaker ? charByName.get(token.speaker) : undefined;
      const choiceNode: ScriptNode = {
        id: `node-${nanoid()}`,
        type: 'choice',
        sceneId: currentSceneId,
        speaker: char?.id,
        text: token.text,
        choices: [],
      };
      nodes.push(choiceNode);
      pendingChoiceNode = choiceNode;
    } else if (token.type === 'end') {
      nodes.push({
        id: `node-${nanoid()}`,
        type: 'end',
        sceneId: currentSceneId,
        text: token.text || '故事结束',
      });
    }
  }

  // 自动链接 dialogue 节点（不跨越 choice/end）
  for (let i = 0; i < nodes.length - 1; i++) {
    if (nodes[i].type === 'dialogue') {
      nodes[i].next = nodes[i + 1].id;
    }
  }

  return {
    id: existingScript?.id ?? nanoid(),
    title,
    characters: allChars,
    scenes: allScenes,
    nodes,
    startNodeId: nodes[0]?.id ?? '',
    createdAt: existingScript?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
}

/** Script → 纯文本（反序列化，用于编辑器初始化） */
export function scriptToText(script: Script): string {
  const charById = new Map(script.characters.map((c) => [c.id, c]));
  const sceneById = new Map(script.scenes.map((s) => [s.id, s]));

  const lines: string[] = [`# ${script.title}`, ''];
  let lastSceneId: string | undefined;

  for (const node of script.nodes) {
    // 场景切换
    if (node.sceneId && node.sceneId !== lastSceneId) {
      const scene = sceneById.get(node.sceneId);
      if (scene && scene.name !== '默认场景') {
        lines.push(`# ${scene.name}`);
      }
      lastSceneId = node.sceneId;
    }

    if (node.type === 'dialogue') {
      const char = node.speaker ? charById.get(node.speaker) : undefined;
      lines.push(char ? `${char.name}：${node.text}` : node.text);
    } else if (node.type === 'choice') {
      const char = node.speaker ? charById.get(node.speaker) : undefined;
      lines.push(char ? `? ${char.name}：${node.text}` : `? ${node.text}`);
      for (const c of node.choices ?? []) {
        lines.push(`> ${c.label}`);
      }
      lines.push('');
    } else if (node.type === 'end') {
      lines.push(`END ${node.text}`);
    }
  }

  return lines.join('\n');
}
