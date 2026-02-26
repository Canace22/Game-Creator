/**
 * 剧本富文本编辑器
 * - 底层是 <textarea>，无障碍、无依赖
 * - 叠加 <pre> 做语法高亮（pointer-events:none 不拦截输入）
 * - 实时解析，防抖 300ms 后同步到 store
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useScriptStore } from '../../store/scriptStore';
import { tokenizeLines, buildScriptFromTokens, scriptToText } from '../../engine/textParser';
import type { ParseLineToken } from '../../engine/textParser';

// ─── 语法颜色 ────────────────────────────────────────────
const LINE_STYLES: Record<ParseLineToken['type'], string> = {
  scene:          'text-cyan-400 font-bold',
  dialogue:       '',        // 根据 speaker 动态染色
  choice_prompt:  'text-amber-300',
  choice_option:  'text-amber-500/80',
  end:            'text-rose-400 font-bold',
  comment:        'text-white/25 italic',
  empty:          '',
};

// 从 speaker 名哈希出一种颜色（与角色列表保持一致感）
const SPEAKER_PALETTE = [
  'text-indigo-300', 'text-purple-300', 'text-pink-300', 'text-sky-300',
  'text-teal-300', 'text-lime-300', 'text-orange-300', 'text-rose-300',
];
const speakerColorCache = new Map<string, string>();
function speakerColor(name: string): string {
  if (!speakerColorCache.has(name)) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    speakerColorCache.set(name, SPEAKER_PALETTE[h % SPEAKER_PALETTE.length]);
  }
  return speakerColorCache.get(name)!;
}

/** 把 token 数组渲染成高亮的 HTML 字符串（给 <pre> 用） */
function tokenToHtml(tokens: ParseLineToken[]): string {
  return tokens.map((t) => {
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (t.type === 'empty') return '<span>\n</span>';
    if (t.type === 'comment') return `<span class="${LINE_STYLES.comment}">${esc(t.text)}</span>\n`;
    if (t.type === 'scene') return `<span class="${LINE_STYLES.scene}"># ${esc(t.text)}</span>\n`;
    if (t.type === 'end') return `<span class="${LINE_STYLES.end}">END ${esc(t.text)}</span>\n`;
    if (t.type === 'choice_prompt') return `<span class="${LINE_STYLES.choice_prompt}">? ${esc(t.text)}</span>\n`;
    if (t.type === 'choice_option') return `<span class="${LINE_STYLES.choice_option}">&gt; ${esc(t.text)}</span>\n`;

    // dialogue
    if (t.speaker) {
      const col = speakerColor(t.speaker);
      return `<span class="${col} font-medium">${esc(t.speaker)}：</span><span class="text-white/85">${esc(t.text)}</span>\n`;
    }
    return `<span class="text-white/50 italic">${esc(t.text)}</span>\n`;
  }).join('');
}

// 防抖
function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// ─── 主组件 ─────────────────────────────────────────────
export function ScriptTextEditor() {
  const { script, loadScript } = useScriptStore();

  // 初始化文本（从 script 反序列化）
  const [text, setText] = useState(() => scriptToText(script));
  const [nodeCount, setNodeCount] = useState(script.nodes.length);
  const [parseError, setParseError] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const isExternalUpdateRef = useRef(false);   // 标记是否是外部（store）更新触发的文本变化

  // 监听 AI 面板事件：追加 / 替换文本
  useEffect(() => {
    const onAppend = (e: Event) => {
      const appended = (e as CustomEvent<string>).detail;
      setText((prev) => prev + appended);
    };
    const onReplace = (e: Event) => {
      const replaced = (e as CustomEvent<string>).detail;
      setText(replaced);
    };
    window.addEventListener('ai-append-text', onAppend);
    window.addEventListener('ai-replace-text', onReplace);
    return () => {
      window.removeEventListener('ai-append-text', onAppend);
      window.removeEventListener('ai-replace-text', onReplace);
    };
  }, []);

  // 当 store 中的 script 被外部更新（AI解析、导入等）时，同步文本
  useEffect(() => {
    const newText = scriptToText(script);
    // 仅在外部更新时替换（避免死循环）
    if (isExternalUpdateRef.current) {
      isExternalUpdateRef.current = false;
      return;
    }
    setText(newText);
    setNodeCount(script.nodes.length);
  // 只在 script.id 或 script.updatedAt 变化时触发，不依赖 text
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script.id, script.updatedAt]);

  // tokens 实时计算（用于高亮，不 debounce）
  const tokens = tokenizeLines(text);
  const highlightHtml = tokenToHtml(tokens);

  // debounce 后同步到 store
  const debouncedText = useDebounce(text, 350);

  useEffect(() => {
    try {
      // 提取标题（第一行 # xxx）
      const firstToken = tokens.find((t) => t.type === 'scene');
      const title = firstToken?.text ?? script.title;

      const newScript = buildScriptFromTokens(
        tokens.filter((t) => !(t.type === 'scene' && t === firstToken)), // 第一行 # 作为标题
        title,
        script,
      );

      isExternalUpdateRef.current = true;
      loadScript(newScript);
      setNodeCount(newScript.nodes.length);
      setParseError('');
    } catch (e) {
      setParseError(e instanceof Error ? e.message : '解析错误');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText]);

  // 同步滚动（textarea → pre）
  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Tab 键插入 2 空格
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = text.slice(0, start) + '  ' + text.slice(end);
      setText(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10 flex-shrink-0 bg-gray-950">
        <span className="text-xs text-white/40">剧本编辑器</span>
        <div className="flex-1" />
        <span className="text-xs text-white/25">{nodeCount} 个节点</span>
        {parseError && (
          <span className="text-xs text-rose-400 truncate max-w-[180px]" title={parseError}>
            ⚠ {parseError}
          </span>
        )}
        <button
          onClick={() => {
            setText(SYNTAX_HELP);
          }}
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
          title="插入语法示例"
        >
          帮助
        </button>
      </div>

      {/* 编辑区：textarea + pre 叠加 */}
      <div className="relative flex-1 overflow-hidden font-mono text-sm leading-6">
        {/* 高亮层（只读展示） */}
        <pre
          ref={highlightRef}
          aria-hidden="true"
          className="absolute inset-0 m-0 p-4 overflow-auto pointer-events-none whitespace-pre-wrap break-words text-sm leading-6 select-none"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: highlightHtml }}
        />

        {/* 输入层（透明文字，位于高亮层上面） */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="absolute inset-0 w-full h-full resize-none bg-transparent border-0 p-4 text-transparent caret-white outline-none text-sm leading-6 overflow-auto"
          style={{ caretColor: '#fff', WebkitTextFillColor: 'transparent' }}
          placeholder=""
        />
      </div>

      {/* 底部语法提示 */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-t border-white/5 bg-gray-950 flex-shrink-0">
        <SyntaxBadge prefix="# 场景" color="text-cyan-400" />
        <SyntaxBadge prefix="角色：台词" color="text-indigo-300" />
        <SyntaxBadge prefix="? 选项提示" color="text-amber-300" />
        <SyntaxBadge prefix="> 选项A" color="text-amber-500" />
        <SyntaxBadge prefix="END 结局" color="text-rose-400" />
      </div>
    </div>
  );
}

function SyntaxBadge({ prefix, color }: { prefix: string; color: string }) {
  return (
    <span className={`text-[10px] ${color} opacity-60`}>{prefix}</span>
  );
}

const SYNTAX_HELP = `# 故事标题

// 这是注释行，会被忽略
// 使用 # 切换场景，角色名：台词，? 选项，> 选项文字，END 结局

# 第一章：开始

旁白：深夜，书房中蜡烛摇曳。

爱丽丝：（颤抖着打开信封）这……这是什么？

信纸上写着：「你的记忆是假的。」

? 爱丽丝：我应该怎么做？
> 立刻去找警察
> 独自调查

# 选择警察

警察局的走廊很长。

END 无论如何，真相即将揭晓。
`;
