import { Board, PieceColor, PieceType } from "@/types/chess";
import { Chess } from "chess.js";

export function getPieceSymbol(type: PieceType, color: PieceColor) {
  const symbols: Record<string, { w: string; b: string }> = {
    k: { w: "♔", b: "♚" },
    q: { w: "♕", b: "♛" },
    r: { w: "♖", b: "♜" },
    b: { w: "♗", b: "♝" },
    n: { w: "♘", b: "♞" },
    p: { w: "♙", b: "♟︎" },
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
        piece: { type: cell.type, color: cell.color },
      };
    })
  );
}
