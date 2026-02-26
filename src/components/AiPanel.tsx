/**
 * 千问 AI 辅助面板
 *
 * 两个功能：
 * 1. 生成剧情文本 —— 输入提示，AI 返回剧本语法格式文本，追加到编辑器
 * 2. 润色扩写 —— 把当前编辑器全文发给 AI，返回扩写/改写后的完整文本替换
 */
import { useState } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { scriptToText } from '../engine/textParser';

const QWEN_BASE = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const QWEN_MODEL = 'qwen-plus';

async function callQwen(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch(`${QWEN_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.85,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? `请求失败 ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

// ─── 生成剧情文本（返回符合剧本语法的纯文本，追加到编辑器） ───────
const GENERATE_SYSTEM = `你是视觉小说剧本创作助手。根据用户的提示，生成一段符合以下语法格式的剧本文本。

语法规则：
- # 场景名      → 切换场景
- 角色名：台词  → 对话（角色名与台词用中文冒号分隔）
- 旁白内容      → 无角色名的独白/旁白
- ? 提示语      → 选项节点
- > 选项文字    → 选项内容（紧跟在 ? 行之后）
- END 结局      → 结局节点
- // 注释

要求：
- 只输出剧本文本，不加任何说明
- 生成 5-15 行
- 角色名保持一致，不超过 6 字
- 如有分支，选项后另起一个场景继续`;

// ─── 润色/扩写（替换整个文本） ────────────────────────────────────
const REWRITE_SYSTEM = `你是视觉小说剧本润色师。用户会给你一段剧本草稿，请在保持原有剧情走向和语法格式不变的前提下：
- 使台词更生动、有情感
- 补充场景细节描写（旁白）
- 保持所有角色名、场景名、选项结构不变
- 只输出修改后的完整剧本文本，不加说明`;

type PanelTab = 'generate' | 'rewrite';

// ─── 组件共享事件：把文本追加/替换到编辑器 ───────────────────────
// 通过自定义事件桥接（避免 prop drilling）
export function emitAppendText(text: string) {
  window.dispatchEvent(new CustomEvent('ai-append-text', { detail: text }));
}
export function emitReplaceText(text: string) {
  window.dispatchEvent(new CustomEvent('ai-replace-text', { detail: text }));
}

export function AiPanel() {
  const [tab, setTab] = useState<PanelTab>('generate');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('qwen_key') ?? '');
  const [prompt, setPrompt] = useState('');
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { script } = useScriptStore();

  const saveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('qwen_key', key);
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) { setError('请先填写千问 API Key'); return; }
    if (!prompt.trim()) { setError('请输入故事提示'); return; }
    setError('');
    setLoading(true);
    try {
      const charList = script.characters.map((c) => c.name).join('、');
      const userMsg = `现有角色：${charList || '（无）'}\n\n${prompt}`;
      const result = await callQwen(apiKey, GENERATE_SYSTEM, userMsg);
      emitAppendText('\n\n' + result.trim());
      setPrompt('');
      showSuccess('已追加到编辑器');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async () => {
    if (!apiKey.trim()) { setError('请先填写千问 API Key'); return; }
    if (!confirm('润色将替换当前整个剧本文本，确认继续？')) return;
    setError('');
    setLoading(true);
    try {
      const currentText = scriptToText(script);
      const instruction = rewriteInstruction.trim()
        ? `\n\n额外要求：${rewriteInstruction}`
        : '';
      const userMsg = `请润色以下剧本${instruction}\n\n---\n${currentText}`;
      const result = await callQwen(apiKey, REWRITE_SYSTEM, userMsg);
      emitReplaceText(result.trim());
      showSuccess('润色完成');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab */}
      <div className="flex border-b border-white/10 flex-shrink-0">
        {(['generate', 'rewrite'] as PanelTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              tab === t
                ? 'text-purple-300 border-b-2 border-purple-400'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {t === 'generate' ? '✨ 续写剧情' : '🪄 润色扩写'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* API Key */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            千问 API Key
            <a
              href="https://bailian.console.aliyun.com/"
              target="_blank"
              rel="noreferrer"
              className="ml-2 text-purple-400 hover:text-purple-300"
            >
              获取 →
            </a>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => saveKey(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-purple-400 font-mono"
          />
          <p className="text-[10px] text-white/20 mt-1">Key 仅存储在本地浏览器，使用 {QWEN_MODEL}</p>
        </div>

        {/* 续写模式 */}
        {tab === 'generate' && (
          <>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">续写提示</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={7}
                placeholder={`描述接下来的剧情走向，例如：\n\n主角在地下室发现了一台古老的机器，机器上刻着一行字。他必须做出选择：启动它，或者永远离开。`}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-purple-400 resize-none leading-relaxed"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? '生成中...' : '✨ 生成并追加到编辑器'}
            </button>
            <div className="text-xs text-white/20 space-y-1 bg-white/3 rounded p-3">
              <p>生成的文本将追加到剧本编辑器末尾</p>
              <p>自动使用剧本语法格式（角色名：台词）</p>
            </div>
          </>
        )}

        {/* 润色模式 */}
        {tab === 'rewrite' && (
          <>
            <div className="bg-white/5 border border-white/10 rounded p-3 text-xs text-white/40 space-y-1">
              <p className="text-white/60 font-medium">当前剧本概览</p>
              <p>{script.title}</p>
              <p>{script.nodes.length} 个节点 · {script.characters.length} 个角色</p>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">润色方向（可选）</label>
              <textarea
                value={rewriteInstruction}
                onChange={(e) => setRewriteInstruction(e.target.value)}
                rows={3}
                placeholder="例如：让台词更有古风韵味；增加更多心理描写；加入悬疑气氛..."
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-purple-400 resize-none"
              />
            </div>
            <button
              onClick={handleRewrite}
              disabled={loading}
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? '润色中...' : '🪄 润色整个剧本'}
            </button>
            <div className="text-xs text-white/20 space-y-1 bg-white/3 rounded p-3">
              <p>会将当前剧本文本发给千问润色</p>
              <p>保持角色名、场景名、选项结构不变</p>
              <p>⚠ 操作前建议先导出保存</p>
            </div>
          </>
        )}

        {/* 反馈 */}
        {error && (
          <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
            ✓ {success}
          </div>
        )}
      </div>
    </div>
  );
}
