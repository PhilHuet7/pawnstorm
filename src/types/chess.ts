export type PieceType = "p" | "r" | "n" | "b" | "q" | "k";

export type PieceColor = "w" | "b";

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
