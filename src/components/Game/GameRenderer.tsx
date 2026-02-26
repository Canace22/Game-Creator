import { useEffect, useState } from 'react';
import { useScriptStore } from '../../store/scriptStore';
import { getNodeById, getCharacterById, getSceneById } from '../../engine/parser';

export function GameRenderer() {
  const { script, gameState, isPreviewMode, startGame, advanceGame, resetGame } =
    useScriptStore();
  const [textVisible, setTextVisible] = useState('');
  const [typing, setTyping] = useState(false);

  const currentNode = gameState.currentNodeId
    ? getNodeById(script, gameState.currentNodeId)
    : null;

  const character = currentNode?.speaker
    ? getCharacterById(script, currentNode.speaker)
    : null;

  const scene = currentNode?.sceneId
    ? getSceneById(script, currentNode.sceneId)
    : script.scenes[0];

  // 打字机效果
  useEffect(() => {
    if (!currentNode) return;
    setTextVisible('');
    setTyping(true);
    let i = 0;
    const text = currentNode.text;
    const timer = setInterval(() => {
      i++;
      setTextVisible(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setTyping(false);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [currentNode?.id]);

  const handleAdvance = () => {
    if (!currentNode) return;
    if (typing) {
      // 跳过打字机效果
      setTextVisible(currentNode.text);
      setTyping(false);
      return;
    }
    if (currentNode.type === 'dialogue' && currentNode.next) {
      advanceGame(currentNode.next);
    }
  };

  if (!isPreviewMode) {
    return (
      <div
        className="relative flex flex-col items-center justify-center h-full"
        style={{ background: scene?.background ?? '#1a1a2e' }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center space-y-4">
          <div className="text-5xl mb-4">🎭</div>
          <h2 className="text-2xl font-bold text-white">{script.title}</h2>
          <p className="text-white/50 text-sm">
            {script.nodes.length} 个节点 · {script.characters.length} 个角色
          </p>
          <button
            onClick={startGame}
            className="mt-6 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full transition-all hover:scale-105 shadow-lg shadow-indigo-500/30"
          >
            开始游戏
          </button>
        </div>
      </div>
    );
  }

  if (gameState.isEnded || (!currentNode && gameState.currentNodeId)) {
    return (
      <div
        className="relative flex flex-col items-center justify-center h-full"
        style={{ background: scene?.background ?? '#1a1a2e' }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center space-y-4">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-xl font-bold text-white">故事结束</h2>
          {currentNode?.text && (
            <p className="text-white/70 text-sm max-w-xs mx-auto">{currentNode.text}</p>
          )}
          <button
            onClick={resetGame}
            className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/20"
          >
            返回编辑
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden cursor-pointer select-none"
      style={{ background: scene?.background ?? '#1a1a2e' }}
      onClick={currentNode?.type === 'dialogue' ? handleAdvance : undefined}
    >
      {/* 场景名 */}
      {scene && (
        <div className="absolute top-4 left-4 z-10 text-xs text-white/40 bg-black/30 px-2 py-1 rounded">
          {scene.name}
        </div>
      )}

      {/* 返回按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          resetGame();
        }}
        className="absolute top-4 right-4 z-10 text-xs text-white/40 hover:text-white/70 bg-black/30 px-2 py-1 rounded transition-colors"
      >
        退出
      </button>

      {/* 角色立绘（色块代替） */}
      {character && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <div
            className="w-20 h-28 rounded-2xl flex items-end justify-center pb-3 shadow-2xl"
            style={{
              background: `linear-gradient(180deg, ${character.color}88 0%, ${character.color} 100%)`,
              boxShadow: `0 8px 32px ${character.color}44`,
            }}
          >
            <span className="text-white font-bold text-lg">
              {character.name.charAt(0)}
            </span>
          </div>
        </div>
      )}

      {/* 对话区域 */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* 选项节点 */}
        {currentNode?.type === 'choice' && (
          <div className="p-4 space-y-2 bg-gradient-to-t from-black/80 to-transparent pt-12">
            {character && (
              <div className="mb-3">
                <span
                  className="text-sm font-bold px-2 py-0.5 rounded"
                  style={{ color: character.color }}
                >
                  {character.name}
                </span>
              </div>
            )}
            <p className="text-white text-sm mb-4 leading-relaxed">{currentNode.text}</p>
            <div className="grid gap-2">
              {(currentNode.choices ?? []).map((choice, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    advanceGame(choice.next);
                  }}
                  className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white text-sm rounded-xl transition-all hover:scale-[1.02] text-left"
                >
                  <span className="text-white/40 mr-2">{idx + 1}.</span>
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 对话节点 */}
        {currentNode?.type === 'dialogue' && (
          <div className="bg-black/70 backdrop-blur-sm border-t border-white/10 p-4">
            {character && (
              <div className="mb-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: character.color }}
                >
                  {character.name}
                </span>
              </div>
            )}
            <p className="text-white text-sm leading-relaxed min-h-[3rem]">
              {textVisible}
              {typing && <span className="animate-pulse">▌</span>}
            </p>
            <div className="flex justify-end mt-3">
              {!typing && currentNode.next ? (
                <span className="text-white/30 text-xs animate-bounce">点击继续 ▶</span>
              ) : !typing && !currentNode.next ? (
                <span className="text-white/30 text-xs">— 故事结束 —</span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* 进度指示 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-xs text-white/20">
        {gameState.history.length} / {script.nodes.length}
      </div>
    </div>
  );
}
