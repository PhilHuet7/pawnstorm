export type PieceType =
  | "pawn"
  | "rook"
  | "knight"
  | "bishop"
  | "queen"
  | "king";

export type PieceColor = "white" | "black";

export type Piece = {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
};

export type Square = {
  piece: Piece | null;
};

export type Board = Square[][];

export type DragItem = {
  from: { row: number; col: number };
  piece: PieceType;
  type: "piece";
};

export type Coord = { row: number; col: number };
