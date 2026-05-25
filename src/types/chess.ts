import { Square } from "chess.js";

export type PieceType = "p" | "r" | "n" | "b" | "q" | "k";

export type PieceColor = "w" | "b";

export type Piece = {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
};

export type PieceVM = {
  id: string;
  color: "w" | "b";
  type: string; // 'p','n','b','r','q','k'
  square: Square;
};

export type BoardSquare = {
  piece: Piece | null;
};

export type Board = BoardSquare[][];

export type Coord = { row: number; col: number };
