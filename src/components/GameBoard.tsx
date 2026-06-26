'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useGame } from '@/lib/game/useGame';
import { Position, Difficulty, GameMode } from '@/lib/game/types';
import { motion, AnimatePresence } from 'framer-motion';

const BOARD_SIZE = 15;
const STAR_POINTS = [
  { row: 3, col: 3 }, { row: 3, col: 7 }, { row: 3, col: 11 },
  { row: 7, col: 3 }, { row: 7, col: 7 }, { row: 7, col: 11 },
  { row: 11, col: 3 }, { row: 11, col: 7 }, { row: 11, col: 11 },
];

/* ─── Stone Component ─── */
function Stone({
  player,
  isLastMove,
  isWinLine,
  delay,
}: {
  player: 1 | 2;
  isLastMove: boolean;
  isWinLine: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        ...(isWinLine ? {
          boxShadow: player === 1
            ? ['0 0 4px rgba(255,255,255,0.3)', '0 0 12px rgba(255,255,200,0.6)', '0 0 4px rgba(255,255,255,0.3)']
            : ['0 0 4px rgba(255,255,255,0.3)', '0 0 12px rgba(255,255,255,0.8)', '0 0 4px rgba(255,255,255,0.3)'],
        } : {}),
      }}
      transition={{
        scale: { type: 'spring', stiffness: 500, damping: 25, delay },
        boxShadow: isWinLine ? { repeat: Infinity, duration: 1.5 } : {},
      }}
      className={`
        relative w-full h-full rounded-full cursor-pointer
        ${player === 1
          ? 'bg-gradient-to-br from-gray-700 via-gray-800 to-black shadow-lg shadow-black/40'
          : 'bg-gradient-to-br from-white via-gray-100 to-gray-200 shadow-lg shadow-black/20'
        }
        ${isWinLine ? 'ring-2 ring-yellow-400/80 ring-offset-1 ring-offset-transparent z-10' : ''}
      `}
    >
      {/* Stone gloss effect */}
      <div
        className={`
          absolute top-[12%] left-[18%] w-[35%] h-[30%] rounded-full
          ${player === 1 ? 'bg-white/10' : 'bg-white/40'}
        `}
      />
      {/* Last move indicator */}
      {isLastMove && (
        <div
          className={`
            absolute inset-0 flex items-center justify-center
            after:content-[''] after:w-[6px] after:h-[6px] after:rounded-full
            ${player === 1 ? 'after:bg-white/80' : 'after:bg-red-500/80'}
          `}
        />
      )}
    </motion.div>
  );
}

/* ─── Confetti Particle ─── */
function ConfettiParticle({ index }: { index: number }) {
  const color = ['bg-yellow-400', 'bg-pink-500', 'bg-blue-400', 'bg-green-400', 'bg-purple-500', 'bg-orange-400'][index % 6];
  const angle = (index * 37) % 360;
  const x = Math.cos((angle * Math.PI) / 180) * (80 + Math.random() * 60);
  const y = Math.sin((angle * Math.PI) / 180) * (80 + Math.random() * 60);
  const size = 4 + Math.random() * 6;

  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
      animate={{
        x, y, scale: 1, opacity: 0, rotate: 360 + Math.random() * 360,
      }}
      transition={{ duration: 1.5 + Math.random() * 1, ease: 'easeOut' }}
      className={`absolute ${color} rounded-sm`}
      style={{ width: size, height: size }}
    />
  );
}

/* ─── Mode Select Screen ─── */
function ModeSelectScreen({ onSelect }: { onSelect: (mode: GameMode, difficulty: Difficulty) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[500px] gap-8 px-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-center"
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
          Gomoku
        </h1>
        <p className="text-sm md:text-base text-[var(--text-secondary)] mt-2">
          Five in a Row — Classic Strategy Game
        </p>
      </motion.div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)] text-center font-medium">
          Choose Your Mode
        </p>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect('ai', 'easy')}
          className="group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 hover:border-blue-400/60 transition-colors"
        >
          <div className="relative z-10 flex items-center gap-4">
            <span className="text-3xl">🤖</span>
            <div className="text-left">
              <p className="font-semibold text-[var(--text)]">vs Computer</p>
              <p className="text-xs text-[var(--text-secondary)]">Play against AI opponent</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect('local', 'medium')}
          className="group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-500/30 hover:border-emerald-400/60 transition-colors"
        >
          <div className="relative z-10 flex items-center gap-4">
            <span className="text-3xl">👥</span>
            <div className="text-left">
              <p className="font-semibold text-[var(--text)]">Local 2 Players</p>
              <p className="text-xs text-[var(--text-secondary)]">Play with a friend</p>
            </div>
          </div>
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-6 text-xs text-[var(--text-secondary)]"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-br from-gray-700 to-black shadow-sm inline-block" />
          <span>Black goes first</span>
        </div>
        <div className="w-px h-3 bg-[var(--border)]" />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-br from-white to-gray-200 shadow-sm inline-block" />
          <span>15×15 board</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Game Header ─── */
function GameHeader({
  mode,
  difficulty,
  soundEnabled,
  theme,
  onToggleSound,
  onToggleTheme,
  onBack,
}: {
  mode: GameMode;
  difficulty: Difficulty;
  soundEnabled: boolean;
  theme: string;
  onToggleSound: () => void;
  onToggleTheme: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-2 py-3 border-b border-[var(--border)]">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--hover-bg)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Menu
      </button>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[var(--text-secondary)] hidden sm:inline">
          {mode === 'ai' ? `vs AI (${difficulty})` : '2 Players'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onToggleSound}
          className={`p-1.5 rounded-md transition-colors ${soundEnabled ? 'text-[var(--text)] hover:bg-[var(--hover-bg)]' : 'text-[var(--text-secondary)]/40 hover:bg-[var(--hover-bg)]'}`}
          title={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 010 14.14" />
              <path d="M15.54 8.46a5 5 0 010 7.07" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)] transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Difficulty Selector ─── */
function DifficultySelector({
  difficulty,
  onChange,
}: {
  difficulty: Difficulty;
  onChange: (d: Difficulty) => void;
}) {
  const difficulties: { key: Difficulty; label: string }[] = [
    { key: 'easy', label: 'Easy' },
    { key: 'medium', label: 'Medium' },
    { key: 'hard', label: 'Hard' },
  ];

  return (
    <div className="flex items-center gap-1 bg-[var(--card-bg)] rounded-lg p-0.5 border border-[var(--border)]">
      {difficulties.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
            difficulty === key
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ─── Win Overlay ─── */
function WinOverlay({
  winner,
  isDraw,
  onPlayAgain,
  onBackToMenu,
  mode,
}: {
  winner: 1 | 2 | null;
  isDraw: boolean;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  mode: GameMode;
}) {
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => i), []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl"
    >
      {!isDraw && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map(i => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>
      )}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
        className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-[var(--card-bg)]/95 backdrop-blur border border-[var(--border)] shadow-2xl"
      >
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-6xl"
        >
          {isDraw ? '🤝' : winner === 1 ? '🏆' : mode === 'ai' ? '😔' : '🏆'}
        </motion.div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--text)]">
            {isDraw
              ? "It's a Draw!"
              : mode === 'ai'
                ? winner === 1
                  ? 'You Win!'
                  : 'AI Wins!'
                : `${winner === 1 ? 'Black' : 'White'} Wins!`}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isDraw
              ? 'The board is full — no more moves!'
              : mode === 'ai' && winner !== 1
                ? 'Better luck next time!'
                : 'Congratulations!'}
          </p>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlayAgain}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            Play Again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToMenu}
            className="px-6 py-2.5 bg-[var(--card-bg)] text-[var(--text)] font-medium rounded-xl border border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors"
          >
            Menu
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Game Component ─── */
export default function GameBoard() {
  const {
    gameState, config, score, isAIThinking,
    placeStone, undo, newGame, setMode, setDifficulty,
    toggleSound, toggleTimer,
  } = useGame();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showScreen, setShowScreen] = useState<'menu' | 'game'>('menu');
  const [hoverPos, setHoverPos] = useState<Position | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Board dimensions
  const spacing = useMemo(() => {
    if (typeof window === 'undefined') return 36;
    const vw = window.innerWidth;
    if (vw < 380) return 20;
    if (vw < 480) return 24;
    if (vw < 640) return 28;
    if (vw < 768) return 32;
    return 36;
  }, []);

  const padding = spacing * 1.2;
  const stoneSize = spacing * 0.88;
  const halfStone = stoneSize / 2;
  const boardPixelSize = padding * 2 + (BOARD_SIZE - 1) * spacing;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Theme toggle (local, separate from GameBoard's own state)
  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('gomoku-theme', next);
      return next;
    });
  }, []);

  // Sync theme on mount
  useEffect(() => {
    const stored = localStorage.getItem('gomoku-theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    }
  }, []);

  const handleModeSelect = useCallback((mode: GameMode, difficulty: Difficulty) => {
    setMode(mode);
    setDifficulty(difficulty);
    setShowScreen('game');
  }, [setMode, setDifficulty]);

  const handleBackToMenu = useCallback(() => {
    setShowScreen('menu');
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    placeStone(row, col);
  }, [placeStone]);

  // Detect if win line positions
  const isWinPosition = useCallback(
    (row: number, col: number) => {
      return gameState.winLine?.some(p => p.row === row && p.col === col) ?? false;
    },
    [gameState.winLine]
  );

  if (showScreen === 'menu') {
    return <ModeSelectScreen onSelect={handleModeSelect} />;
  }

  const { board, currentPlayer, gameStatus, moveHistory, lastMove } = gameState;
  const isGameOver = gameStatus !== 'playing';

  // Render the board
  const renderBoard = () => {
    const cells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cellRow = r;
        const cellCol = c;
        const cellValue = board[cellRow][cellCol];
        const isEmpty = cellValue === 0;
        const isHovered = hoverPos?.row === cellRow && hoverPos?.col === cellCol;
        const isLast = lastMove?.row === cellRow && lastMove?.col === cellCol;

        const left = padding + cellCol * spacing - halfStone;
        const top = padding + cellRow * spacing - halfStone;

        cells.push(
          <div
            key={`${cellRow}-${cellCol}`}
            className="absolute"
            style={{
              left,
              top,
              width: stoneSize,
              height: stoneSize,
            }}
          >
            {/* Clickable area */}
            <div
              onClick={() => handleCellClick(cellRow, cellCol)}
              onMouseEnter={() => setHoverPos({ row: cellRow, col: cellCol })}
              onMouseLeave={() => setHoverPos(null)}
              className="absolute inset-0 z-10"
              style={{
                margin: -spacing * 0.3,
                padding: spacing * 0.3,
              }}
            />

            {/* Stone */}
            {cellValue !== 0 && (
              <Stone
                player={cellValue as 1 | 2}
                isLastMove={isLast}
                isWinLine={isWinPosition(cellRow, cellCol)}
                delay={0}
              />
            )}

            {/* Hover Preview */}
            {isEmpty && isHovered && gameStatus === 'playing' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`
                  w-full h-full rounded-full
                  ${currentPlayer === 1
                    ? 'bg-gradient-to-br from-gray-700/50 to-black/50'
                    : 'bg-gradient-to-br from-white/50 to-gray-200/50'
                  }
                `}
              />
            )}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center w-full max-w-2xl mx-auto"
    >
      {/* Header */}
      <GameHeader
        mode={config.mode}
        difficulty={config.difficulty}
        soundEnabled={config.soundEnabled}
        theme={theme}
        onToggleSound={toggleSound}
        onToggleTheme={toggleTheme}
        onBack={handleBackToMenu}
      />

      {/* Game Info Bar */}
      <div className="flex items-center justify-between w-full px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Black player info */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${currentPlayer === 1 && !isGameOver ? 'bg-[var(--active-bg)] ring-1 ring-amber-500/30' : ''}`}>
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-700 to-black shadow-sm flex-shrink-0" />
            <span className="text-xs font-medium text-[var(--text)]">
              {config.mode === 'ai' ? 'You' : 'Black'}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-mono">{score.black}</span>
          </div>
          <span className="text-[var(--text-secondary)] text-xs">—</span>
          {/* White player info */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${currentPlayer === 2 && !isGameOver ? 'bg-[var(--active-bg)] ring-1 ring-amber-500/30' : ''}`}>
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-white to-gray-200 shadow-sm flex-shrink-0" />
            <span className="text-xs font-medium text-[var(--text)]">
              {config.mode === 'ai' ? 'AI' : 'White'}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-mono">{score.white}</span>
          </div>
          {/* Draws */}
          {score.draws > 0 && (
            <span className="text-xs text-[var(--text-secondary)] font-mono">({score.draws})</span>
          )}
        </div>

        {/* Move count */}
        <div className="text-xs text-[var(--text-secondary)]">
          Move {Math.ceil(moveHistory.length / 2)} • Round {moveHistory.length}
        </div>
      </div>

      {/* AI Difficulty Selector */}
      {config.mode === 'ai' && (
        <div className="w-full px-4 pb-2">
          <DifficultySelector difficulty={config.difficulty} onChange={setDifficulty} />
        </div>
      )}

      {/* Board Container */}
      <div className="relative w-full flex justify-center px-4">
        <div
          ref={boardRef}
          className="relative select-none"
          style={{
            width: boardPixelSize,
            height: boardPixelSize,
            maxWidth: '100%',
            aspectRatio: '1',
          }}
        >
          {/* Board Background */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: theme === 'dark'
                ? 'linear-gradient(145deg, #1a1a2e, #16213e, #0f3460)'
                : 'linear-gradient(145deg, #d4a76a, #c49a5e, #b8894e)',
              boxShadow: theme === 'dark'
                ? 'inset 0 0 60px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.3)'
                : 'inset 0 0 40px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.15)',
            }}
          />

          {/* Grid Lines SVG */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ padding: padding, width: boardPixelSize, height: boardPixelSize }}
          >
            {/* Horizontal lines */}
            {Array.from({ length: BOARD_SIZE }, (_, i) => (
              <line
                key={`h${i}`}
                x1={0}
                y1={i * spacing}
                x2={(BOARD_SIZE - 1) * spacing}
                y2={i * spacing}
                stroke={theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)'}
                strokeWidth="1"
              />
            ))}
            {/* Vertical lines */}
            {Array.from({ length: BOARD_SIZE }, (_, i) => (
              <line
                key={`v${i}`}
                x1={i * spacing}
                y1={0}
                x2={i * spacing}
                y2={(BOARD_SIZE - 1) * spacing}
                stroke={theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)'}
                strokeWidth="1"
              />
            ))}
            {/* Star points */}
            {STAR_POINTS.map((p, i) => (
              <circle
                key={i}
                cx={p.col * spacing}
                cy={p.row * spacing}
                r={3}
                fill={theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)'}
              />
            ))}
            {/* Win line highlight */}
            {gameState.winLine && gameState.winLine.length > 1 && (
              <line
                x1={gameState.winLine[0].col * spacing}
                y1={gameState.winLine[0].row * spacing}
                x2={gameState.winLine[gameState.winLine.length - 1].col * spacing}
                y2={gameState.winLine[gameState.winLine.length - 1].row * spacing}
                stroke="rgba(250, 204, 21, 0.6)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="6 4"
              />
            )}
          </svg>

          {/* Stones & Clickable Intersections */}
          <div
            className="absolute inset-0"
            style={{
              width: boardPixelSize,
              height: boardPixelSize,
            }}
          >
            {renderBoard()}
          </div>

          {/* AI Thinking Indicator */}
          {isAIThinking && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] text-white/80 font-medium">AI thinking</span>
            </div>
          )}

          {/* Win Overlay */}
          <AnimatePresence>
            {isGameOver && (
              <WinOverlay
                winner={gameState.winner}
                isDraw={gameStatus === 'draw'}
                onPlayAgain={newGame}
                onBackToMenu={handleBackToMenu}
                mode={config.mode}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-4">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={undo}
          disabled={moveHistory.length === 0 || isAIThinking}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
          </svg>
          Undo
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={newGame}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          New Game
        </motion.button>
      </div>

      {/* Move History Footer */}
      <div className="w-full px-4 pb-4">
        <details className="group">
          <summary className="cursor-pointer text-xs text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors list-none flex items-center gap-1">
            <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Move History ({moveHistory.length})
          </summary>
          <div className="mt-2 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {moveHistory.map((move, i) => {
              const colLabel = String.fromCharCode(65 + move.col);
              const rowLabel = BOARD_SIZE - move.row;
              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded ${
                    i % 2 === 0
                      ? 'bg-gray-800/30 text-gray-300'
                      : 'bg-gray-100/20 text-gray-400'
                  }`}
                >
                  <span className={i % 2 === 0 ? 'text-gray-200' : 'text-gray-300'}>
                    {i + 1}.
                  </span>
                  {colLabel}{rowLabel}
                </span>
              );
            })}
          </div>
        </details>
      </div>

      {/* Footer */}
      <div className="w-full px-4 pb-3 text-center">
        <p className="text-[10px] text-[var(--text-secondary)] opacity-50">
          Click an intersection to place your stone • Five in a row wins
        </p>
      </div>
    </motion.div>
  );
}
