import type { PieceType, PieceColor } from "@/types/chess";

export const typeMap: Record<"p" | "n" | "b" | "r" | "q" | "k", PieceType> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

export const colorMap: Record<"b" | "w", PieceColor> = {
  b: "black",
  w: "white",
};

export const invTypeMap: Record<PieceType, "p" | "n" | "b" | "r" | "q" | "k"> =
  {
    pawn: "p",
    knight: "n",
    bishop: "b",
    rook: "r",
    queen: "q",
    king: "k",
  };

export const invColorMap: Record<PieceColor, "b" | "w"> = {
  black: "b",
  white: "w",
};
