import { Square } from "chess.js";

/* ── Codes ──────────────────────────────────────────────────────────────────
 * The chess.js vocabulary. This is what the store, the board, and the rules
 * layer speak, and it is the default across the app.
 */

export type PieceType = "p" | "r" | "n" | "b" | "q" | "k";

export type PieceColor = "w" | "b";

/* ── Names ──────────────────────────────────────────────────────────────────
 * Long-form vocabulary used only by the SVG render layer — the glyph map in
 * `components/chessboard/pieces/glyphs.tsx` is keyed by name, not by code.
 * Prefer the codes above everywhere else; convert at the render boundary.
 */

export type PieceName = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";

export type PieceShade = "white" | "black";

export const CODE_TO_NAME: Record<PieceType, PieceName> = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};

export const COLOR_TO_SHADE: Record<PieceColor, PieceShade> = {
  w: "white",
  b: "black",
};

/* ── Board ──────────────────────────────────────────────────────────────── */

export type Piece = {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
};

/** Render view-model: a piece with a stable id so moves animate rather than remount. */
export type PieceVM = {
  id: string;
  color: PieceColor;
  type: PieceType;
  square: Square;
};

export type BoardSquare = {
  piece: Piece | null;
};

export type Board = BoardSquare[][];

export type Coord = { row: number; col: number };
