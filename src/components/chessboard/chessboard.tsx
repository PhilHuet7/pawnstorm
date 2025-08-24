"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { createBoardFromFEN, getPieceSymbol } from "@/lib/utils";
import type { Square } from "chess.js";

const files = "abcdefgh";

const idxToSquare = (rowIndex: number, colIndex: number): Square => {
  // rowIndex: 0 at top is rank 8; colIndex: 0 is file 'a'
  const file = files[colIndex];
  const rank = 8 - rowIndex;
  return `${file}${rank}` as Square;
};

const Chessboard = () => {
  const fen = useGameStore((s) => s.fen);
  const turn = useGameStore((s) => s.turn);
  const lastMove = useGameStore((s) => s.lastMove);
  const legalTargets = useGameStore((s) => s.legalTargets);
  const makeMove = useGameStore((s) => s.makeMove);
  const undo = useGameStore((s) => s.undo);
  const reset = useGameStore((s) => s.reset);

  const board = useMemo(() => createBoardFromFEN(fen), [fen]);

  const [selected, setSelected] = useState<Square | null>(null);
  const [targets, setTargets] = useState<Square[]>([]);

  const onSquareClick = (
    coord: Square,
    piece?: { color: "w" | "b"; type: string }
  ) => {
    // If a piece is selected and we clicked a legal destination, try to move
    if (selected && targets.includes(coord)) {
      makeMove(selected, coord);
      setSelected(null);
      setTargets([]);
      return;
    }

    // Otherwise (re)select only if it's the side to move
    if (piece && piece.color === turn) {
      setSelected(coord);
      setTargets(legalTargets(coord));
    } else {
      setSelected(null);
      setTargets([]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid grid-cols-8 w-128 h-128 border border-gray-700">
        {board.map((row, rowIndex) =>
          row.map((square, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const coord = idxToSquare(rowIndex, colIndex);
            const isSelected = selected === coord;
            const isTarget = targets.includes(coord);
            const isLastFrom = lastMove?.from === coord;
            const isLastTo = lastMove?.to === coord;

            return (
              <button
                key={coord}
                onClick={() => onSquareClick(coord, square.piece as any)}
                className={`relative flex items-center justify-center w-16 h-16 
                  ${isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]"} 
                  ${
                    isSelected
                      ? "after:absolute after:inset-0 after:bg-blue-500/40 border-4 border-blue-500"
                      : ""
                  } 
                  ${
                    isTarget
                      ? "after:absolute after:inset-0 after:bg-green-400/70 after:animate-blinking"
                      : ""
                  } 
                  ${
                    !isTarget && (isLastFrom || isLastTo)
                      ? "after:absolute after:inset-0 after:bg-yellow-300/50"
                      : ""
                  }`}
              >
                {square.piece && (
                  <span className="text-5xl select-none relative z-50">
                    {getPieceSymbol(square.piece.type, square.piece.color)}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={undo}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
        >
          Undo
        </button>
        <button
          onClick={reset}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Chessboard;
