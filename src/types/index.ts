export interface Character {
  id: string;
  name: string;
  color: string; // 头像背景色
}

export interface Scene {
  id: string;
  name: string;
  background: string; // CSS 渐变或颜色字符串
}

export interface Choice {
  label: string;
  next: string;
}

export type NodeType = 'dialogue' | 'choice' | 'end';

export interface ScriptNode {
  id: string;
  type: NodeType;
  sceneId?: string;
  speaker?: string; // Character.id
  text: string;
  next?: string; // 下一节点 id（dialogue/end 用）
  choices?: Choice[]; // choice 节点用
}

export interface Script {
  id: string;
  title: string;
  characters: Character[];
  scenes: Scene[];
  nodes: ScriptNode[];
  startNodeId: string;
  createdAt: number;
  updatedAt: number;
}

export interface GameState {
  currentNodeId: string | null;
  history: string[]; // 已访问节点 id 列表
  isEnded: boolean;
}
