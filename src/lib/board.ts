import { Board, Piece } from "@/types/chess";

export const createInitialBoard = (): Board => {
  const createEmptyRow = () =>
    Array(8)
      .fill(null)
      .map(() => ({ piece: null }));

  const createPawnRow = (color: Piece["color"]) =>
    Array(8)
      .fill(null)
      .map(() => ({
        piece: {
          type: "pawn" as Piece["type"],
          color,
          hasMoved: false,
        },
      }));

  const backRankOrder: Piece["type"][] = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook",
  ];

  const board: Board = [];

  // Black back rank
  board.push(
    backRankOrder.map((type) => ({
      piece: { type, color: "black", hasMoved: false },
    }))
  );

  // Black pawns
  board.push(createPawnRow("black"));

  // Empty rows
  for (let i = 0; i < 4; i++) {
    board.push(createEmptyRow());
  }

  // White pawns
  board.push(createPawnRow("white"));

  // White back rank
  board.push(
    backRankOrder.map((type) => ({
      piece: { type, color: "white", hasMoved: false },
    }))
  );

  return board;
};
