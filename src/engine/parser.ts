import type { Script, ScriptNode, Character, Scene } from '../types';

export function getNodeById(script: Script, id: string): ScriptNode | undefined {
  return script.nodes.find((n) => n.id === id);
}

export function getCharacterById(script: Script, id: string): Character | undefined {
  return script.characters.find((c) => c.id === id);
}

export function getSceneById(script: Script, id: string): Scene | undefined {
  return script.scenes.find((s) => s.id === id);
}

export function getStartNode(script: Script): ScriptNode | undefined {
  return getNodeById(script, script.startNodeId);
}

export function resolveNextNode(node: ScriptNode): string | undefined {
  if (node.type === 'dialogue') return node.next;
  if (node.type === 'end') return undefined;
  return undefined;
}

export function validateScript(script: Script): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(script.nodes.map((n) => n.id));

  if (!nodeIds.has(script.startNodeId)) {
    errors.push(`开始节点 "${script.startNodeId}" 不存在`);
  }

  for (const node of script.nodes) {
    if (node.next && !nodeIds.has(node.next)) {
      errors.push(`节点 "${node.id}" 的 next 指向不存在的节点 "${node.next}"`);
    }
    if (node.choices) {
      for (const choice of node.choices) {
        if (!nodeIds.has(choice.next)) {
          errors.push(`节点 "${node.id}" 选项 "${choice.label}" 指向不存在的节点 "${choice.next}"`);
        }
      }
    }
  }

  return errors;
}
