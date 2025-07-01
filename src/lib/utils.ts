import { PieceColor, PieceType } from "@/types/chess";

export const getPieceSymbol = (type: PieceType, color: PieceColor) => {
  const symbols: Record<string, { white: string; black: string }> = {
    king: { white: "♔", black: "♚" },
    queen: { white: "♕", black: "♛" },
    rook: { white: "♖", black: "♜" },
    bishop: { white: "♗", black: "♝" },
    knight: { white: "♘", black: "♞" },
    pawn: { white: "♙", black: "♟︎" },
  };

  return symbols[type]?.[color] ?? "";
};
