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
          type: "p" as Piece["type"],
          color,
          hasMoved: false,
        },
      }));

  const backRankOrder: Piece["type"][] = [
    "r",
    "n",
    "b",
    "q",
    "k",
    "b",
    "n",
    "r",
  ];

  const board: Board = [];

  // Black back rank
  board.push(
    backRankOrder.map((type) => ({
      piece: { type, color: "b", hasMoved: false },
    }))
  );

  // Black pawns
  board.push(createPawnRow("b"));

  // Empty rows
  for (let i = 0; i < 4; i++) {
    board.push(createEmptyRow());
  }

  // White pawns
  board.push(createPawnRow("w"));

  // White back rank
  board.push(
    backRankOrder.map((type) => ({
      piece: { type, color: "w", hasMoved: false },
    }))
  );

  return board;
};
