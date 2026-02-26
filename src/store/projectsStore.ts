/**
 * 项目列表管理
 * - 所有项目存在 localStorage key: game_creator_projects（JSON 数组，存完整 Script）
 * - 当前打开的 script 仍由 scriptStore 管理
 * - 打开/保存时同步到项目列表
 */
import { create } from 'zustand';
import type { Script } from '../types';
import { createDemoScript } from './scriptStore';

const PROJECTS_KEY = 'game_creator_projects';

function loadProjects(): Script[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (raw) return JSON.parse(raw) as Script[];
  } catch {}
  // 首次打开：把 demo 放进列表
  const demo = createDemoScript();
  saveProjectsToStorage([demo]);
  return [demo];
}

function saveProjectsToStorage(projects: Script[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

interface ProjectsStore {
  projects: Script[];
  panelOpen: boolean;

  openPanel: () => void;
  closePanel: () => void;

  /** 保存（新建或更新）一个项目 */
  upsertProject: (script: Script) => void;

  /** 删除项目 */
  deleteProject: (id: string) => void;

  /** 从 JSON 文件导入项目，返回最终保存的 script */
  importProject: (script: Script) => Script;

  /** 复制项目 */
  duplicateProject: (id: string) => Script | null;
}

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: loadProjects(),
  panelOpen: true,  // 首页即项目列表

  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),

  upsertProject: (script) => {
    const { projects } = get();
    const idx = projects.findIndex((p) => p.id === script.id);
    const updated =
      idx >= 0
        ? projects.map((p) => (p.id === script.id ? script : p))
        : [script, ...projects];
    saveProjectsToStorage(updated);
    set({ projects: updated });
  },

  deleteProject: (id) => {
    const updated = get().projects.filter((p) => p.id !== id);
    saveProjectsToStorage(updated);
    set({ projects: updated });
  },

  importProject: (script) => {
    const { projects } = get();
    const exists = projects.some((p) => p.id === script.id);
    const toSave = exists
      ? { ...script, id: `imported-${Date.now()}`, title: script.title + '（导入）' }
      : script;
    const updated = [toSave, ...projects];
    saveProjectsToStorage(updated);
    set({ projects: updated });
    return toSave;
  },

  duplicateProject: (id) => {
    const { projects } = get();
    const src = projects.find((p) => p.id === id);
    if (!src) return null;
    const copy: Script = {
      ...src,
      id: `copy-${Date.now()}`,
      title: src.title + '（副本）',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [copy, ...projects];
    saveProjectsToStorage(updated);
    set({ projects: updated });
    return copy;
  },
}));
