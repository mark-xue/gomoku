import { CellValue, Player, Position, Difficulty, BOARD_SIZE } from './types';
import { isValidMove, makeMove, checkWin, cloneBoard, getEmptyCells } from './board';

type Direction = [number, number];
const DIRECTIONS: Direction[] = [[0, 1], [1, 0], [1, 1], [1, -1]];

function opponent(player: Player): Player {
  return player === 1 ? 2 : 1;
}

/**
 * Score a pattern based on consecutive stones and open ends.
 */
function scorePattern(count: number, openEnds: number): number {
  if (count >= 5) return 10_000_000;
  if (openEnds === 0) return 0;

  switch (count) {
    case 4:
      return openEnds === 2 ? 500_000 : 50_000;
    case 3:
      return openEnds === 2 ? 50_000 : 5_000;
    case 2:
      return openEnds === 2 ? 5_000 : 500;
    case 1:
      return openEnds === 2 ? 500 : 50;
    default:
      return 0;
  }
}

/**
 * Evaluate a single position in one direction for a given player.
 */
function evaluateDirection(
  board: CellValue[][],
  row: number,
  col: number,
  dr: number,
  dc: number,
  player: Player
): number {
  const size = board.length;
  let count = 1;
  let openEnds = 0;

  // Forward
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) {
    count++;
    r += dr;
    c += dc;
  }
  if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === 0) {
    openEnds++;
  }

  // Backward
  r = row - dr;
  c = col - dc;
  while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) {
    count++;
    r -= dr;
    c -= dc;
  }
  if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === 0) {
    openEnds++;
  }

  return scorePattern(count, openEnds);
}

/**
 * Score a cell for a given player.
 */
function evaluateCell(board: CellValue[][], row: number, col: number, player: Player): number {
  let score = 0;
  const opp = opponent(player);

  for (const [dr, dc] of DIRECTIONS) {
    // Offensive score
    score += evaluateDirection(board, row, col, dr, dc, player) * 1.1;
    // Defensive score (block opponent)
    score += evaluateDirection(board, row, col, dr, dc, opp) * 1.0;
  }

  // Center preference
  const center = (board.length - 1) / 2;
  const distFromCenter = Math.abs(row - center) + Math.abs(col - center);
  score += (board.length - distFromCenter) * 3;

  return score;
}

/**
 * Get all candidate moves sorted by score (descending).
 */
function getCandidateMoves(
  board: CellValue[][],
  player: Player,
  topN: number = 20
): { pos: Position; score: number }[] {
  const candidates: { pos: Position; score: number }[] = [];

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c] !== 0) continue;

      // Only consider cells adjacent to existing stones
      let hasNeighbor = false;
      for (let dr = -2; dr <= 2 && !hasNeighbor; dr++) {
        for (let dc = -2; dc <= 2 && !hasNeighbor; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length && board[nr][nc] !== 0) {
            hasNeighbor = true;
          }
        }
      }
      if (!hasNeighbor) continue;

      const score = evaluateCell(board, r, c, player);
      candidates.push({ pos: { row: r, col: c }, score });
    }
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // If no candidates near stones, return center
  if (candidates.length === 0) {
    const center = Math.floor(board.length / 2);
    if (board[center][center] === 0) {
      candidates.push({ pos: { row: center, col: center }, score: 0 });
    } else {
      // Return first empty cell
      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[0].length; c++) {
          if (board[r][c] === 0) {
            candidates.push({ pos: { row: r, col: c }, score: 0 });
            return candidates.slice(0, topN);
          }
        }
      }
    }
  }

  return candidates.slice(0, topN);
}

/**
 * Evaluate the entire board for a given player.
 */
function evaluateBoard(board: CellValue[][], player: Player): number {
  let totalScore = 0;
  const opp = opponent(player);

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c] === 0) {
        totalScore += evaluateCell(board, r, c, player) * 0.1;
      }
    }
  }

  return totalScore;
}

/**
 * Minimax with alpha-beta pruning.
 */
function minimax(
  board: CellValue[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Player
): number {
  // Check terminal states
  const emptyCells = getEmptyCells(board);
  if (emptyCells.length === 0) return 0; // Draw

  if (depth === 0) {
    return evaluateBoard(board, aiPlayer);
  }

  const currentPlayer = isMaximizing ? aiPlayer : opponent(aiPlayer);
  const candidates = getCandidateMoves(board, currentPlayer, 15);

  if (candidates.length === 0) return evaluateBoard(board, aiPlayer);

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const { pos } of candidates) {
      const newBoard = makeMove(board, pos.row, pos.col, currentPlayer);
      const { won } = checkWin(newBoard, pos.row, pos.col);
      if (won) return 10_000_000 + depth; // Win as fast as possible

      const score = minimax(newBoard, depth - 1, alpha, beta, false, aiPlayer);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const { pos } of candidates) {
      const newBoard = makeMove(board, pos.row, pos.col, currentPlayer);
      const { won } = checkWin(newBoard, pos.row, pos.col);
      if (won) return -10_000_000 - depth; // Delay loss

      const score = minimax(newBoard, depth - 1, alpha, beta, true, aiPlayer);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

/**
 * AI: Get the best move for the given difficulty.
 */
export function getAIMove(
  board: CellValue[][],
  player: Player,
  difficulty: Difficulty
): Position | null {
  const emptyCells = getEmptyCells(board);
  if (emptyCells.length === 0) return null;

  // First move: play center
  const center = Math.floor(board.length / 2);
  if (emptyCells.length === board.length * board[0].length) {
    // First move slight randomness for variety
    if (difficulty === 'easy' && Math.random() < 0.3) {
      const offsets = [
        [0, 0], [0, 1], [1, 0], [0, -1], [-1, 0],
        [1, 1], [-1, -1], [1, -1], [-1, 1],
      ];
      const [dr, dc] = offsets[Math.floor(Math.random() * offsets.length)];
      const r = Math.max(0, Math.min(board.length - 1, center + dr));
      const c = Math.max(0, Math.min(board[0].length - 1, center + dc));
      return { row: r, col: c };
    }
    return { row: center, col: center };
  }

  const opp = opponent(player);

  switch (difficulty) {
    case 'easy': {
      // Greedy with randomness
      const candidates = getCandidateMoves(board, player, 15);
      if (candidates.length === 0) return emptyCells[0];

      // Check for immediate wins first
      for (const { pos } of candidates) {
        const newBoard = makeMove(board, pos.row, pos.col, player);
        const { won } = checkWin(newBoard, pos.row, pos.col);
        if (won) return pos;
      }
      // Block opponent wins
      for (const { pos } of candidates) {
        const newBoard = makeMove(board, pos.row, pos.col, opp);
        const { won } = checkWin(newBoard, pos.row, pos.col);
        if (won) return pos;
      }

      // Random from top 5
      const topN = Math.min(5, candidates.length);
      const randomIndex = Math.floor(Math.random() * topN);
      return candidates[randomIndex].pos;
    }

    case 'medium': {
      // Greedy best move
      const candidates = getCandidateMoves(board, player, 20);
      if (candidates.length === 0) return emptyCells[0];

      // Immediate win
      for (const { pos } of candidates) {
        const newBoard = makeMove(board, pos.row, pos.col, player);
        const { won } = checkWin(newBoard, pos.row, pos.col);
        if (won) return pos;
      }
      // Block opponent win
      for (const { pos } of candidates) {
        const newBoard = makeMove(board, pos.row, pos.col, opp);
        const { won } = checkWin(newBoard, pos.row, pos.col);
        if (won) return pos;
      }

      return candidates[0].pos;
    }

    case 'hard': {
      // Minimax with alpha-beta
      const candidates = getCandidateMoves(board, player, 15);
      if (candidates.length === 0) return emptyCells[0];

      // Immediate win
      for (const { pos } of candidates) {
        const newBoard = makeMove(board, pos.row, pos.col, player);
        const { won } = checkWin(newBoard, pos.row, pos.col);
        if (won) return pos;
      }
      // Block opponent immediate win
      for (const { pos } of candidates) {
        const testBoard = makeMove(board, pos.row, pos.col, opp);
        const { won } = checkWin(testBoard, pos.row, pos.col);
        if (won) return pos;
      }

      // Use minimax with depth 2 for Hard
      let bestScore = -Infinity;
      let bestMoves: Position[] = [];

      for (const { pos } of candidates) {
        const newBoard = makeMove(board, pos.row, pos.col, player);
        const score = minimax(newBoard, 2, -Infinity, Infinity, false, player);

        if (score > bestScore) {
          bestScore = score;
          bestMoves = [pos];
        } else if (score === bestScore) {
          bestMoves.push(pos);
        }
      }

      return bestMoves.length > 0
        ? bestMoves[Math.floor(Math.random() * bestMoves.length)]
        : candidates[0].pos;
    }
  }
}
