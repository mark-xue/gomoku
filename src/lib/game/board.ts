import { CellValue, Player, Position, BOARD_SIZE, WIN_LENGTH } from './types';

export function createBoard(size: number = BOARD_SIZE): CellValue[][] {
  return Array.from({ length: size }, () => Array(size).fill(0) as CellValue[]);
}

export function cloneBoard(board: CellValue[][]): CellValue[][] {
  return board.map(row => [...row]);
}

export function isValidMove(board: CellValue[][], row: number, col: number): boolean {
  return (
    row >= 0 &&
    row < board.length &&
    col >= 0 &&
    col < board[0].length &&
    board[row][col] === 0
  );
}

export function makeMove(
  board: CellValue[][],
  row: number,
  col: number,
  player: Player
): CellValue[][] {
  const newBoard = cloneBoard(board);
  newBoard[row][col] = player;
  return newBoard;
}

export function checkWin(
  board: CellValue[][],
  row: number,
  col: number
): { won: boolean; line: Position[] } {
  const player = board[row][col];
  if (player === 0) return { won: false, line: [] };

  const directions: [number, number][] = [
    [0, 1],  // horizontal →
    [1, 0],  // vertical ↓
    [1, 1],  // diagonal ↘
    [1, -1], // diagonal ↙
  ];

  for (const [dr, dc] of directions) {
    const line: Position[] = [{ row, col }];

    // Forward
    for (let i = 1; i < WIN_LENGTH; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) break;
      if (board[r][c] !== player) break;
      line.push({ row: r, col: c });
    }

    // Backward
    for (let i = 1; i < WIN_LENGTH; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) break;
      if (board[r][c] !== player) break;
      line.unshift({ row: r, col: c });
    }

    if (line.length >= WIN_LENGTH) {
      return { won: true, line };
    }
  }

  return { won: false, line: [] };
}

export function checkDraw(board: CellValue[][]): boolean {
  return board.every(row => row.every(cell => cell !== 0));
}

export function getEmptyCells(board: CellValue[][]): Position[] {
  const cells: Position[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c] === 0) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
}
