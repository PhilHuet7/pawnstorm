"use client";

import { Chess } from "chess.js";
import { Board, Coord } from "@/types/chess";
import { createInitialBoard } from "@/lib/board";
import { useRef, useState } from "react";
import { createBoardFromFEN, getPieceSymbol, toAlgebraic } from "@/lib/utils";

const Chessboard = () => {
  const [board, setBoard] = useState<Board>(createInitialBoard());
  const game = useRef(new Chess());
  const movePiece = (from: Coord, to: Coord) => {
    const move = game.current.move({
      from: toAlgebraic(from),
      to: toAlgebraic(to),
    });
    if (move) {
      setBoard(createBoardFromFEN(game.current.fen()));
    }
  };

  return (
    <div className="grid grid-cols-8 w-[32rem] h-[32rem] border border-gray-700">
      {board.map((row, rowIndex) =>
        row.map((square, colIndex) => {
          const isLight = (rowIndex + colIndex) % 2 === 0;
          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`relative flex items-center justify-center w-[4rem] h-[4rem] ${
                isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]"
              }`}
            >
              {square.piece && (
                <span className="text-5xl">
                  {getPieceSymbol(square.piece.type, square.piece.color)}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Chessboard;
