import { Board, PieceColor, PieceType } from "@/types/chess";
import { Chess } from "chess.js";

export function getPieceSymbol(type: PieceType, color: PieceColor) {
  const symbols: Record<string, { white: string; black: string }> = {
    king: { white: "♔", black: "♚" },
    queen: { white: "♕", black: "♛" },
    rook: { white: "♖", black: "♜" },
    bishop: { white: "♗", black: "♝" },
    knight: { white: "♘", black: "♞" },
    pawn: { white: "♙", black: "♟︎" },
  };

  return symbols[type]?.[color] ?? "";
}

export function toAlgebraic({
  row,
  col,
}: {
  row: number;
  col: number;
}): string {
  const files = "abcdefgh";
  const file = files[col];
  const rank = 8 - row;
  return `${file}${rank}`;
}

export function createBoardFromFEN(fen: string): Board {
  const game = new Chess(fen);
  // game.board() returns a 2d array of Piece|null
  return game.board().map((row) =>
    row.map((cell) => {
      const piece = cell
        ? ({
            type: cell.type as PieceType,
            color: cell.color === "w" ? "white" : "black",
          } as const)
        : null;
      return { piece };
    })
  );
}
