"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { createBoardFromFEN, getPieceSymbol } from "@/lib/utils";
import type { Square } from "chess.js";
import { PieceType } from "@/types/chess";
import Button from "../ui/button";

type PieceVM = {
  id: string;
  color: "w" | "b";
  type: string; // 'p','n','b','r','q','k'
  square: Square;
};

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
  const cellX = rect.width / 8;
  const cellY = rect.height / 8;
  return {
    x: fileIdx * cellX,
    y: rankIdxFromTop * cellY,
    cell: Math.min(cellX, cellY),
  };
};

const useBoardRect = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const update = () =>
      setRect(ref.current ? ref.current.getBoundingClientRect() : null);
    const ro = new ResizeObserver(update);
    ro.observe(ref.current);
    update();
    return () => ro.disconnect();
  }, []);
  return { boardRef: ref, rect };
};

const Chessboard = () => {
  // store
  const version = useGameStore((s) => s.positionVersion);
  const fen = useGameStore((s) => s.fen);
  const turn = useGameStore((s) => s.turn);
  const lastMove = useGameStore((s) => s.lastMove);
  const legalTargets = useGameStore((s) => s.legalTargets);
  // const isLegal = useGameStore((s) => s.isLegal);
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

  // track DOM nodes for each piece id
  const nodeMapRef = useRef<Map<string, HTMLElement>>(new Map());

  // Keep prior board layout to diff when needed
  const prevBoardRef = useRef<ReturnType<typeof createBoardFromFEN> | null>(
    null
  );

  // Helper to find a (from,to) by diffing prev vs current board if lastMove is missing
  const findMoveByDiff = (
    prev: ReturnType<typeof createBoardFromFEN>,
    curr: ReturnType<typeof createBoardFromFEN>
  ): { from: Square; to: Square } | null => {
    // scan 64 squares, find one that went empty and one that became occupied (same color if possible)
    let fromSq: Square | null = null;
    let toSq: Square | null = null;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const prevCell = prev[row][col];
        const currCell = curr[row][col];
        const sq = idxToSquare(row, col);

        if (prevCell.piece && !currCell.piece) {
          fromSq = sq;
        } else if (!prevCell.piece && currCell.piece) {
          toSq = sq;
        } else if (prevCell.piece && currCell.piece) {
          // promotions / captures: piece remains but type/color may change;
          // if type changed or color changed, treat as toSq
          if (
            prevCell.piece.type !== currCell.piece.type ||
            prevCell.piece.color !== currCell.piece.color
          ) {
            toSq = sq;
          }
        }
      }
    }
    return fromSq && toSq ? { from: fromSq, to: toSq } : null;
  };

  const pieces: PieceVM[] = useMemo(() => {
    const next = new Map<Square, string>();
    const list: PieceVM[] = [];

    // helper to get or create an id for a given square
    const ensureId = (sq: Square) =>
      idMapRef.current.get(sq) ?? `${sq}-${crypto.randomUUID()}`;

    // If we know a last move, transfer ID from from->to for the mover
    let movedFrom = lastMove?.from ?? null;
    let movedTo = lastMove?.to ?? null;

    if ((!movedFrom || !movedTo) && prevBoardRef.current) {
      const guessed = findMoveByDiff(prevBoardRef.current, board);
      if (guessed) {
        movedFrom = guessed.from;
        movedTo = guessed.to;
      }
    }

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
    // remember current board for next diff
    prevBoardRef.current = board;
    return list;
  }, [board, lastMove, version]);

  const moverIdThisFrame = useMemo(() => {
    if (!lastMove) return null;
    // idMapRef.current has just been updated inside the pieces useMemo
    return idMapRef.current.get(lastMove.to) ?? null;
  }, [lastMove, version, pieces]);

  // --- FLIP animation for the mover (runs exactly once per move) ---
  useLayoutEffect(() => {
    // NEW
    if (!lastMove || !rect || !moverIdThisFrame) return;

    const el = nodeMapRef.current.get(moverIdThisFrame);
    if (!el) return;

    // Compute FROM and TO coords
    const fromXY = squareToXY(lastMove.from, rect);
    const toXY = squareToXY(lastMove.to, rect);

    // 1) Put the mover at its OLD position with no transition
    el.style.willChange = "";
    el.style.transition = "none";
    el.style.transform = `translate3d(${fromXY.x}px, ${fromXY.y}px, 0)`;

    // Force layout so the browser acknowledges the old transform
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.getBoundingClientRect();

    // 2) In next frame, transition to the NEW position
    requestAnimationFrame(() => {
      el.style.willChange = "transform";
      el.style.transition = "transform 180ms ease-in-out";
      el.style.transform = `translate3d(${toXY.x}px, ${toXY.y}px, 0)`;
      const onEnd = (e: TransitionEvent) => {
        if (e.propertyName !== "transform") return;
        el.style.transition = "";
        el.style.willChange = "";
        el.removeEventListener("transitionend", onEnd);
      };
      el.addEventListener("transitionend", onEnd);
    });
  }, [version, rect, moverIdThisFrame, lastMove]);

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
    <div className="flex flex-col items-center justify-center">
      <div
        className={`h-2 w-[calc(100%-2px)] mx-auto rounded-t-lg shrink-0 ${
          turn === "b"
            ? "bg-gradient-to-t from-pawnstorm-gold to-pawnstorm-gold/50 animate-pulse"
            : "bg-transparent"
        }`}
      />
      {/* Board container defines the coordinate space */}
      <div className="relative w-128 aspect-square shrink-0 ring ring-gray-700 overflow-hidden">
        {/* Squares background (click targets) */}
        <div
          ref={boardRef}
          className="absolute inset-0 grid grid-cols-8 grid-rows-8"
        >
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
                    ? "after:absolute after:w-14 after:h-14 after:top-[calc(50%-1.75rem)] after:left-[calc(50%-1.75rem)] after:rounded-full after:bg-green-600/20 "
                    : ""
                } ${
                  isTarget
                    ? "after:absolute after:w-6 after:h-6 after:rounded-full after:top-[calc(50%-.75rem)] after:left-[calc(50%-.75rem)] after:bg-green-600/70 after:animate-blinking"
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
                  ref={(el) => {
                    const map = nodeMapRef.current;
                    if (el) map.set(p.id, el);
                    else map.delete(p.id);
                  }}
                  className="absolute pointer-events-auto select-none text-5xl z-40"
                  style={{
                    transform: `translate3d(${x}px, ${y}px, 0)`,
                    width: `${cell}px`,
                    height: `${cell}px`,
                    lineHeight: `${cell}px`,
                    textAlign: "center",
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
      <div
        className={`h-2 w-[calc(100%-2px)] mx-auto rounded-b-lg shrink-0 ${
          turn === "w"
            ? "bg-gradient-to-b from-pawnstorm-gold to-pawnstorm-gold/50 animate-pulse"
            : "bg-transparent"
        }`}
      />
      <div className="flex gap-2 mt-3">
        <Button onClick={undo}>Undo</Button>
        <Button onClick={reset}>Reset</Button>
      </div>
    </div>
  );
};

export default Chessboard;
