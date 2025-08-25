"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { createBoardFromFEN, getPieceSymbol } from "@/lib/utils";
import type { Square } from "chess.js";
import { PieceType } from "@/types/chess";
import Button from "../ui/button";

const files = "abcdefgh";

const idxToSquare = (rowIndex: number, colIndex: number): Square => {
  // rowIndex: 0 at top is rank 8; colIndex: 0 is file 'a'
  const file = files[colIndex];
  const rank = 8 - rowIndex;
  return `${file}${rank}` as Square;
};

const parseSquare = (sq: Square) => ({
  fileIdx: files.indexOf(sq[0]),
  rankIdxFromTop: 8 - Number(sq[1]),
});

// Map a square to pixel coordinates inside the board rect
const squareToXY = (sq: Square, rect: DOMRect) => {
  const { fileIdx, rankIdxFromTop } = parseSquare(sq);
  const size = Math.min(rect.width, rect.height);
  const cell = size / 8;
  const offsetX = (rect.width - size) / 2;
  const offsetY = (rect.height - size) / 2;
  return {
    x: Math.round(offsetX + fileIdx * cell),
    y: Math.round(offsetY + rankIdxFromTop * cell),
    cell,
  };
};

const useBoardRect = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const update = () => setRect(ref.current!.getBoundingClientRect());
    const ro = new ResizeObserver(update);
    ro.observe(ref.current);
    update();
    return () => ro.disconnect();
  }, []);
  return { boardRef: ref, rect };
};

type PieceVM = {
  id: string;
  color: "w" | "b";
  type: string; // 'p','n','b','r','q','k'
  square: Square;
};

const Chessboard = () => {
  // store
  const fen = useGameStore((s) => s.fen);
  const turn = useGameStore((s) => s.turn);
  const lastMove = useGameStore((s) => s.lastMove);
  const legalTargets = useGameStore((s) => s.legalTargets);
  const isLegal = useGameStore((s) => s.isLegal);
  const makeMove = useGameStore((s) => s.makeMove);
  const undo = useGameStore((s) => s.undo);
  const reset = useGameStore((s) => s.reset);

  // derived board matrix
  const board = useMemo(() => createBoardFromFEN(fen), [fen]);

  // selection
  const [selected, setSelected] = useState<Square | null>(null);
  const [targets, setTargets] = useState<Square[]>([]);

  // board rect for pixel mapping
  const { boardRef, rect } = useBoardRect();

  // ---- Stable IDs so transforms animate instead of remounting ----
  // We maintain a map of square -> id, and on each new board we carry the id
  // from lastMove.from -> lastMove.to so the moved piece keeps its identity.
  const idMapRef = useRef(new Map<Square, string>());

  const pieces: PieceVM[] = useMemo(() => {
    const next = new Map<Square, string>();
    const list: PieceVM[] = [];

    // helper to get or create an id for a given square
    const ensureId = (sq: Square) =>
      idMapRef.current.get(sq) ?? `${sq}-${crypto.randomUUID()}`;

    // If we know a last move, transfer ID from from->to for the mover
    const movedFrom = lastMove?.from ?? null;
    const movedTo = lastMove?.to ?? null;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const cell = board[row][col];
        if (!cell.piece) continue;

        const sq = idxToSquare(row, col);
        let id: string;

        if (movedFrom && movedTo && sq === movedTo) {
          // Prefer giving the destination the mover's previous ID
          id = idMapRef.current.get(movedFrom) ?? ensureId(sq);
        } else {
          id = ensureId(sq);
        }

        next.set(sq, id);
        list.push({
          id,
          color: cell.piece.color,
          type: cell.piece.type,
          square: sq,
        });
      }
    }

    idMapRef.current = next;
    return list;
  }, [board, lastMove]);

  // click logic (works for both background squares and piece clicks)
  const onSquareClick = (coord: Square) => {
    // If a piece is selected and we clicked a legal destination, try to move
    if (selected && targets.includes(coord)) {
      makeMove(selected, coord);
      setSelected(null);
      setTargets([]);
      return;
    }

    // read piece at coord from board
    const { fileIdx, rankIdxFromTop } = parseSquare(coord);
    const squareData = board[rankIdxFromTop][fileIdx];
    const piece = squareData.piece as { color: "w" | "b"; type: string } | null;

    if (piece && piece.color === turn) {
      const nextSelected = selected !== coord ? coord : null;
      setSelected(nextSelected);
      setTargets(nextSelected ? legalTargets(coord) : []);
    } else {
      setSelected(null);
      setTargets([]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Board container defines the coordinate space */}
      <div
        ref={boardRef}
        className="relative w-128 h-128 border border-gray-700 overflow-hidden"
      >
        {/* Squares background (click targets) */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {Array.from({ length: 64 }).map((_, i) => {
            const rowIndex = Math.floor(i / 8);
            const colIndex = i % 8;
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const coord = idxToSquare(rowIndex, colIndex);
            const isSelected = selected === coord;
            const isTarget = targets.includes(coord);
            const isLastFrom = lastMove?.from === coord;
            const isLastTo = lastMove?.to === coord;

            return (
              <button
                key={coord}
                onClick={() => onSquareClick(coord)}
                className={`relative w-full h-full ${
                  isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]"
                } ${
                  isSelected
                    ? "after:absolute after:inset-0 after:bg-blue-500/40 border-3 border-blue-500"
                    : ""
                } ${
                  isTarget
                    ? "after:absolute after:inset-0 after:bg-green-400/70 after:animate-blinking"
                    : ""
                } ${
                  !isTarget && (isLastFrom || isLastTo)
                    ? "after:absolute after:inset-0 after:bg-yellow-300/50"
                    : ""
                }`}
              />
            );
          })}
        </div>

        {/* Pieces layer (absolute) */}
        {rect && (
          <div className="absolute inset-0 pointer-events-none">
            {pieces.map((p) => {
              const { x, y, cell } = squareToXY(p.square, rect);
              return (
                <span
                  key={p.id}
                  className="absolute pointer-events-auto select-none text-5xl z-40"
                  style={{
                    transform: `translate3d(${x}px, ${y}px, 0)`,
                    width: `${cell}px`,
                    height: `${cell}px`,
                    lineHeight: `${cell}px`,
                    textAlign: "center",
                    transition: "transform 180ms ease-in-out",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSquareClick(p.square);
                  }}
                >
                  {getPieceSymbol(p.type as PieceType, p.color)}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        <Button onClick={undo}>Undo</Button>
        <Button onClick={reset}>Reset</Button>
      </div>
    </div>
  );
};

export default Chessboard;
