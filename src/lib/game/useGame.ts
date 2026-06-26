'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  CellValue, Player, Position, GameState, Difficulty, GameMode,
  Score, GameConfig, BOARD_SIZE,
} from './types';
import { createBoard, isValidMove, makeMove, checkWin, checkDraw } from './board';
import { getAIMove } from './ai';
import {
  playPlaceSound, playWinSound, playDrawSound, playLoseSound,
  playInvalidSound, playStartSound, playUndoSound,
} from './sounds';

const INITIAL_CONFIG: GameConfig = {
  mode: 'ai',
  difficulty: 'medium',
  boardSize: BOARD_SIZE,
  timerEnabled: false,
  soundEnabled: true,
};

export interface GameController {
  gameState: GameState;
  config: GameConfig;
  score: Score;
  isAIThinking: boolean;
  placeStone: (row: number, col: number) => void;
  undo: () => void;
  newGame: () => void;
  setMode: (mode: GameMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  toggleSound: () => void;
  toggleTimer: () => void;
  setConfig: (config: Partial<GameConfig>) => void;
}

function createInitialState(size: number = BOARD_SIZE): GameState {
  return {
    board: createBoard(size),
    currentPlayer: 1 as Player,
    moveHistory: [],
    gameStatus: 'playing',
    winner: null,
    winLine: null,
    boardSize: size,
    lastMove: null,
  };
}

export function useGame(): GameController {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [config, setConfig] = useState<GameConfig>(INITIAL_CONFIG);
  const [score, setScore] = useState<Score>({ black: 0, white: 0, draws: 0 });
  const [isAIThinking, setIsAIThinking] = useState(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup AI timeout on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, []);

  const playMoveSound = useCallback((status: string) => {
    if (!config.soundEnabled) return;
    if (status === 'won') {
      playWinSound();
    } else if (status === 'draw') {
      playDrawSound();
    } else {
      playPlaceSound();
    }
  }, [config.soundEnabled]);

  const placeStone = useCallback(
    (row: number, col: number) => {
      if (gameState.gameStatus !== 'playing') return;
      if (!isValidMove(gameState.board, row, col)) {
        if (config.soundEnabled) playInvalidSound();
        return;
      }
      if (config.mode === 'ai' && gameState.currentPlayer !== 1) return;
      if (isAIThinking) return;

      const player = gameState.currentPlayer;
      const newBoard = makeMove(gameState.board, row, col, player);
      const { won, line } = checkWin(newBoard, row, col);
      const draw = !won && checkDraw(newBoard);

      const newMoveHistory = [...gameState.moveHistory, { row, col }];

      let newStatus: GameState['gameStatus'] = 'playing';
      let winner: Player | null = null;
      let winLine: Position[] | null = null;

      if (won) {
        newStatus = 'won';
        winner = player;
        winLine = line;
        setScore(prev => ({
          ...prev,
          [player === 1 ? 'black' : 'white']: prev[player === 1 ? 'black' : 'white'] + 1,
        }));
      } else if (draw) {
        newStatus = 'draw';
        setScore(prev => ({ ...prev, draws: prev.draws + 1 }));
      }

      const nextPlayer: Player = player === 1 ? 2 : 1;

      setGameState({
        board: newBoard,
        currentPlayer: newStatus === 'playing' ? nextPlayer : player,
        moveHistory: newMoveHistory,
        gameStatus: newStatus,
        winner,
        winLine,
        boardSize: gameState.boardSize,
        lastMove: { row, col },
      });

      playMoveSound(newStatus);

      // Trigger AI move if needed
      if (
        config.mode === 'ai' &&
        newStatus === 'playing' &&
        nextPlayer === 2
      ) {
        triggerAIMove(newBoard, nextPlayer, config.difficulty);
      }
    },
    [gameState, config, isAIThinking, playMoveSound]
  );

  const triggerAIMove = useCallback(
    (board: CellValue[][], player: Player, difficulty: Difficulty) => {
      setIsAIThinking(true);

      // Small delay to make AI feel more natural
      aiTimeoutRef.current = setTimeout(() => {
        const move = getAIMove(board, player, difficulty);
        if (!move) {
          setIsAIThinking(false);
          return;
        }

        setGameState(prev => {
          if (prev.gameStatus !== 'playing') {
            setIsAIThinking(false);
            return prev;
          }

          const newBoard = makeMove(board, move.row, move.col, player);
          const { won, line } = checkWin(newBoard, move.row, move.col);
          const draw = !won && checkDraw(newBoard);

          const newMoveHistory = [...prev.moveHistory, move];

          let newStatus: GameState['gameStatus'] = 'playing';
          let winner: Player | null = null;
          let winLine: Position[] | null = null;

          if (won) {
            newStatus = 'won';
            winner = player;
            winLine = line;
            setScore(s => ({
              ...s,
              [player === 1 ? 'black' : 'white']: s[player === 1 ? 'black' : 'white'] + 1,
            }));
            if (config.soundEnabled) playLoseSound();
          } else if (draw) {
            newStatus = 'draw';
            setScore(s => ({ ...s, draws: s.draws + 1 }));
            if (config.soundEnabled) playDrawSound();
          } else {
            if (config.soundEnabled) playPlaceSound();
          }

          setIsAIThinking(false);
          return {
            ...prev,
            board: newBoard,
            currentPlayer: newStatus === 'playing' ? (player === 1 ? 2 : 1) : player,
            moveHistory: newMoveHistory,
            gameStatus: newStatus,
            winner,
            winLine,
            lastMove: move,
          };
        });
      }, 300 + Math.random() * 200);
    },
    [config.soundEnabled]
  );

  const undo = useCallback(() => {
    if (gameState.moveHistory.length === 0) return;
    if (isAIThinking) return;

    // In AI mode, undo 2 moves (player + AI)
    const stepsToUndo = config.mode === 'ai' ? 2 : 1;
    const newHistory = [...gameState.moveHistory];

    if (config.mode === 'ai' && newHistory.length < 2) return;

    let board = createBoard(gameState.boardSize);
    const movesToKeep = newHistory.slice(0, newHistory.length - stepsToUndo);

    for (const move of movesToKeep) {
      board = makeMove(board, move.row, move.col, board[move.row][move.col] !== 0 ? board[move.row][move.col] as Player : 1);
    }

    // Replay moves to reconstruct board
    let replayBoard = createBoard(gameState.boardSize);
    const replayHistory: Position[] = [];
    let currentPlayer: Player = 1;

    for (const move of movesToKeep) {
      replayBoard = makeMove(replayBoard, move.row, move.col, currentPlayer);
      replayHistory.push(move);
      currentPlayer = currentPlayer === 1 ? 2 : 1;
    }

    const lastMove = replayHistory.length > 0 ? replayHistory[replayHistory.length - 1] : null;

    setGameState({
      board: replayBoard,
      currentPlayer: movesToKeep.length % 2 === 0 ? (1 as Player) : (2 as Player),
      moveHistory: replayHistory,
      gameStatus: 'playing',
      winner: null,
      winLine: null,
      boardSize: gameState.boardSize,
      lastMove,
    });

    if (config.soundEnabled) playUndoSound();

    // If it's now AI's turn, trigger AI
    if (config.mode === 'ai' && movesToKeep.length % 2 === 1) {
      triggerAIMove(replayBoard, 2, config.difficulty);
    }
  }, [gameState, config, isAIThinking, triggerAIMove]);

  const newGame = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setIsAIThinking(false);

    const initialState = createInitialState(gameState.boardSize);
    setGameState(initialState);

    if (config.soundEnabled) playStartSound();
  }, [gameState.boardSize, config.soundEnabled]);

  const setMode = useCallback((mode: GameMode) => {
    setConfig(prev => ({ ...prev, mode }));
    setGameState(createInitialState());
    setScore({ black: 0, white: 0, draws: 0 });
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setIsAIThinking(false);
  }, []);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setConfig(prev => ({ ...prev, difficulty }));
  }, []);

  const toggleSound = useCallback(() => {
    setConfig(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleTimer = useCallback(() => {
    setConfig(prev => ({ ...prev, timerEnabled: !prev.timerEnabled }));
  }, []);

  return {
    gameState,
    config,
    score,
    isAIThinking,
    placeStone,
    undo,
    newGame,
    setMode,
    setDifficulty,
    toggleSound,
    toggleTimer,
    setConfig: (c: Partial<GameConfig>) => setConfig(prev => ({ ...prev, ...c })),
  };
}
