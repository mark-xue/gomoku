export type Player = 1 | 2;
export type CellValue = 0 | Player;

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  board: CellValue[][];
  currentPlayer: Player;
  moveHistory: Position[];
  gameStatus: 'playing' | 'won' | 'draw';
  winner: Player | null;
  winLine: Position[] | null;
  boardSize: number;
  lastMove: Position | null;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'ai' | 'local';

export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
  boardSize: number;
  timerEnabled: boolean;
  soundEnabled: boolean;
}

export interface Score {
  black: number;
  white: number;
  draws: number;
}

export const BOARD_SIZE = 15;
export const WIN_LENGTH = 5;

export const PLAYER_NAMES: Record<Player, string> = {
  1: 'Black',
  2: 'White',
};

export const PLAYER_SYMBOLS: Record<Player, string> = {
  1: '●',
  2: '○',
};
