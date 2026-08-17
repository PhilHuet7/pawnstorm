import type { Square } from "chess.js";
import type { PieceColor } from "@/types/chess";

/**
 * Board coordinate math, in two deliberately separate families.
 *
 * There are two different grids in play and they only coincide when white is at
 * the bottom — which is why conflating them silently breaks board flip:
 *
 *   BOARD grid   the matrix from `createBoardFromFEN` (chess.js `board()`).
 *                Always rank 8 at row 0, file a at col 0. Never flips.
 *
 *   DISPLAY grid what the user sees. Row 0 is the top *as rendered*, so it is
 *                rank 8 when white is at the bottom and rank 1 when black is.
 *
 * Rule of thumb: indexing the board matrix → `*BoardIdx`. Positioning something
 * on screen → the orientation-aware helpers.
 */

export const FILES = "abcdefgh";

/** Which colour sits at the bottom of the board. */
export type Orientation = PieceColor;

// ── BOARD grid (orientation-independent) ────────────────────────────────────

/** Index into the `createBoardFromFEN` matrix. */
export const squareToBoardIdx = (sq: Square) => ({
  row: 8 - Number(sq[1]),
  col: FILES.indexOf(sq[0]),
});

/** Square at a given position in the `createBoardFromFEN` matrix. */
export const boardIdxToSquare = (row: number, col: number): Square =>
  `${FILES[col]}${8 - row}` as Square;

// ── DISPLAY grid (orientation-aware) ────────────────────────────────────────

/** Square rendered at a given on-screen row/col. */
export const idxToSquare = (
  row: number,
  col: number,
  orientation: Orientation = "w",
): Square => {
  const fileIdx = orientation === "w" ? col : 7 - col;
  const rankIdx = orientation === "w" ? 7 - row : row; // 0 === rank 1
  return `${FILES[fileIdx]}${rankIdx + 1}` as Square;
};

/** Where a square is rendered on screen. */
export const squareToIdx = (sq: Square, orientation: Orientation = "w") => {
  const fileIdx = FILES.indexOf(sq[0]);
  const rankIdx = Number(sq[1]) - 1; // 0 === rank 1
  return {
    row: orientation === "w" ? 7 - rankIdx : rankIdx,
    col: orientation === "w" ? fileIdx : 7 - fileIdx,
  };
};

/** Pixel offset of a square within the board rect, plus the cell size. */
export const squareToXY = (
  sq: Square,
  rect: { width: number; height: number },
  orientation: Orientation = "w",
) => {
  const { row, col } = squareToIdx(sq, orientation);
  const cellX = rect.width / 8;
  const cellY = rect.height / 8;
  return { x: col * cellX, y: row * cellY, cell: Math.min(cellX, cellY) };
};

// ── Rules helpers ───────────────────────────────────────────────────────────

/** True when moving this piece to `to` promotes it. Orientation-independent. */
export const isPromotionMove = (
  piece: { type: string; color: PieceColor } | null | undefined,
  to: Square,
): boolean => {
  if (!piece || piece.type !== "p") return false;
  const destRank = Number(to[1]);
  return (
    (piece.color === "w" && destRank === 8) ||
    (piece.color === "b" && destRank === 1)
  );
};
