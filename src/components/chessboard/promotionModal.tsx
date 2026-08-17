"use client";

import type { PieceColor, PieceType } from "@/types/chess";
import { PieceIcon } from "@/components/chessboard/pieces";

const PROMOTION_PIECES: ("q" | "r" | "b" | "n")[] = ["q", "r", "b", "n"];

type Props = {
  color: PieceColor;
  /** 0–7 column index of the destination square, in *display* coordinates */
  colIdx: number;
  /** True when the destination renders on the top row — depends on orientation */
  fromTop: boolean;
  /** Pixels per square */
  cellSize: number;
  onSelect: (piece: "q" | "r" | "b" | "n") => void;
  onCancel: () => void;
};

export default function PromotionModal({
  color,
  colIdx,
  fromTop,
  cellSize,
  onSelect,
  onCancel,
}: Props) {
  // Fan the choices away from the edge the pawn landed on, so the queen is
  // always the square adjacent to the promotion square. Which edge that is
  // depends on board orientation, not on colour.
  const pieces: PieceType[] = fromTop
    ? PROMOTION_PIECES
    : [...PROMOTION_PIECES].reverse();
  const topRow = fromTop ? 0 : 4;

  return (
    <>
      {/* Backdrop — clicking outside the picker cancels the promotion */}
      <div
        className="absolute inset-0 z-50 bg-black/40"
        onClick={onCancel}
        onMouseDown={(e) => e.stopPropagation()}
      />

      {/* Piece column */}
      <div
        className="absolute z-50 flex flex-col shadow-xl rounded overflow-hidden"
        style={{
          left: colIdx * cellSize,
          top: topRow * cellSize,
          width: cellSize,
          height: 4 * cellSize,
        }}
      >
        {pieces.map((type) => (
          <button
            key={type}
            className="flex items-center justify-center bg-white hover:bg-amber-200 border border-gray-300 transition-colors cursor-pointer"
            style={{ width: cellSize, height: cellSize }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(type as "q" | "r" | "b" | "n");
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title={
              type === "q"
                ? "Queen"
                : type === "r"
                  ? "Rook"
                  : type === "b"
                    ? "Bishop"
                    : "Knight"
            }
          >
            <PieceIcon type={type} color={color} size={cellSize * 0.8} outline />
          </button>
        ))}
      </div>
    </>
  );
}
