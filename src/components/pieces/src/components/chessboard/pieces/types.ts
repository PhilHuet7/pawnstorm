export type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
export type PieceColor = "white" | "black";
export type PieceCode = "k" | "q" | "r" | "b" | "n" | "p";
export const CODE_TO_TYPE: Record<PieceCode, PieceType> = {
  k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn",
};
