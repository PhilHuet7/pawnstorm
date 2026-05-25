"use client";

import { getPieceSymbol } from "@/lib/utils";
import type { PieceColor, PieceType } from "@/types/chess";

const PROMOTION_PIECES: ("q" | "r" | "b" | "n")[] = ["q", "r", "b", "n"];

type Props = {
  color: PieceColor;
  /** 0–7 column index of the promoting pawn's destination file */
  fileIdx: number;
  /** Pixels per square */
  cellSize: number;
  onSelect: (piece: "q" | "r" | "b" | "n") => void;
  onCancel: () => void;
};

export default function PromotionModal({
  color,
  fileIdx,
  cellSize,
  onSelect,
  onCancel,
}: Props) {
  // White promotes to rank 8 (row 0, top) — show choices from top downward.
  // Black promotes to rank 1 (row 7, bottom) — show choices from bottom upward
  // so the queen is always adjacent to the promotion square.
  const pieces: PieceType[] =
    color === "w" ? PROMOTION_PIECES : [...PROMOTION_PIECES].reverse();
  const topRow = color === "w" ? 0 : 4;

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
          left: fileIdx * cellSize,
          top: topRow * cellSize,
          width: cellSize,
          height: 4 * cellSize,
        }}
      >
        {pieces.map((type) => (
          <button
            key={type}
            className="flex items-center justify-center bg-white hover:bg-amber-200 border border-gray-300 transition-colors cursor-pointer"
            style={{
              width: cellSize,
              height: cellSize,
              fontSize: cellSize * 0.65,
              lineHeight: 1,
            }}
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
            {getPieceSymbol(type, color)}
          </button>
        ))}
      </div>
    </>
  );
}
