import { colorMap, typeMap } from "@/adapters/chessjs";
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
  const game = new Chess();

  try {
    game.load(fen); // loads full FEN (placement + fields)
  } catch {
    game.reset();
  }
  // game.board() returns a 2d array of Piece|null. 8x8 top->bottom is ranks 8..1
  return game.board().map((row) =>
    row.map((cell) => {
      if (!cell) return { piece: null };
      return {
        piece: { type: typeMap[cell.type], color: colorMap[cell.color] },
      };
    })
  );
}
