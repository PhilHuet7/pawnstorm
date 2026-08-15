"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import { useGameStore } from "@/store/useGameStore";
import { createBoardFromFEN, getPieceSymbol } from "@/lib/utils";
import type { Square } from "chess.js";
import { PieceType, PieceVM } from "@/types/chess";
import DroppableSquare from "@/components/chessboard/droppableSquare";
import DraggablePiece from "@/components/chessboard/draggablePiece";
import PromotionModal from "@/components/chessboard/promotionModal";
import GameNotifications from "@/components/notifications/gameNotifications";
import { useMoveSounds } from "@/hooks/useMoveSounds";
import { useSettingsStore } from "@/store/useSettingsStore";
import { play } from "@/lib/sounds";

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
  const readOnly = useGameStore((s) => s.readOnly);
  const checkmate = useGameStore((s) => s.checkmate);
  const stalemate = useGameStore((s) => s.stalemate);
  const draw = useGameStore((s) => s.draw);
  const muted = useSettingsStore((s) => s.muted);

  // Plays a sound for each move that lands; mounted once here.
  useMoveSounds();

  // derived board matrix
  const board = useMemo(() => createBoardFromFEN(fen), [fen]);

  // selection
  const [selected, setSelected] = useState<Square | null>(null);
  const [targets, setTargets] = useState<Square[]>([]);
  const [activePiece, setActivePiece] = useState<PieceVM | null>(null);
  // pending pawn promotion — holds the move until the user picks a piece
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
    byDrag: boolean;
  } | null>(null);
  // board rect for pixel mapping
  const { boardRef, rect } = useBoardRect();

  // ---- Stable IDs so transforms animate instead of remounting ----
  // We maintain a map of square -> id, and on each new board we carry the id
  // from lastMove.from -> lastMove.to so the moved piece keeps its identity.
  const idMapRef = useRef(new Map<Square, string>());

  // track DOM nodes for each piece id
  const nodeMapRef = useRef<Map<string, HTMLElement>>(new Map());

  // Flag set by drag handler so the FLIP animation is skipped for drag moves.
  // After a drag the user already saw the piece travel; no FLIP is needed, and
  // running it races with dnd-kit's post-drag renders which overwrite the DOM.
  const lastMovedByDragRef = useRef(false);

  // Keep prior board layout to diff when needed
  const prevBoardRef = useRef<ReturnType<typeof createBoardFromFEN> | null>(
    null,
  );

  // Helper to find a (from,to) by diffing prev vs current board if lastMove is missing
  const findMoveByDiff = (
    prev: ReturnType<typeof createBoardFromFEN>,
    curr: ReturnType<typeof createBoardFromFEN>,
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
  }, [board, lastMove]);

  const moverIdThisFrame = useMemo(() => {
    if (!lastMove) return null;
    // idMapRef.current has just been updated inside the pieces useMemo
    return idMapRef.current.get(lastMove.to) ?? null;
  }, [lastMove]);

  // --- FLIP animation for the mover (runs exactly once per move) ---
  useLayoutEffect(() => {
    if (!lastMove || !rect || !moverIdThisFrame) return;
    if (lastMovedByDragRef.current) {
      lastMovedByDragRef.current = false;
      return;
    }

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

  // Returns true when moving `from` → `to` would trigger pawn promotion
  const isPromotion = (from: Square, to: Square): boolean => {
    const fileIdx = files.indexOf(from[0]);
    const rankIdxFromTop = 8 - Number(from[1]);
    const piece = board[rankIdxFromTop]?.[fileIdx]?.piece;
    if (!piece || piece.type !== "p") return false;
    const destRank = Number(to[1]);
    return (
      (piece.color === "w" && destRank === 8) ||
      (piece.color === "b" && destRank === 1)
    );
  };

  const handlePromotionSelect = (piece: "q" | "r" | "b" | "n") => {
    if (!pendingPromotion) return;
    const { from, to, byDrag } = pendingPromotion;
    if (byDrag) lastMovedByDragRef.current = true;
    makeMove(from, to, piece);
    setPendingPromotion(null);
  };

  const handlePromotionCancel = () => setPendingPromotion(null);

  // click logic (works for both background squares and piece clicks)
  const onSquareClick = (coord: Square) => {
    // If a piece is selected and we clicked a legal destination, try to move
    if (selected && targets.includes(coord)) {
      if (isPromotion(selected, coord)) {
        setPendingPromotion({ from: selected, to: coord, byDrag: false });
      } else {
        makeMove(selected, coord);
      }
      setSelected(null);
      setTargets([]);
      return;
    } else {
      setSelected(null);
      setTargets([]);
    }
  };

  const onSquareMouseDown = (coord: Square) => {
    if (readOnly || isGameOver) return;

    const { fileIdx, rankIdxFromTop } = parseSquare(coord);
    const piece = board[rankIdxFromTop][fileIdx].piece as {
      color: "w" | "b";
    } | null;

    if (piece && piece.color === turn) {
      if (selected === coord) {
        setSelected(null);
        setTargets([]);
        return;
      } else {
        setSelected(coord);
        setTargets(legalTargets(coord));
        return;
      }
    }

    if (selected && targets.includes(coord)) {
      if (isPromotion(selected, coord)) {
        setPendingPromotion({ from: selected, to: coord, byDrag: false });
      } else {
        makeMove(selected, coord);
      }
      setSelected(null);
      setTargets([]);
      return;
    } else {
      setSelected(null);
      setTargets([]);
    }
  };

  // ── drag sensors ──────────────────────────────────────────────────────────
  // Require 4px of movement before activating a drag so that plain clicks
  // fall through to onClick handlers and don't fire drag start/end.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // ── drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = ({ active }: DragStartEvent) => {
    const sq = active.data.current?.square as Square | undefined;
    if (!sq) return;
    const piece = pieces.find((p) => p.id === active.id);
    if (!piece) return;
    setActivePiece(piece);
    // need to set selected and targets again to handle edge case where someone clicks one time to select and then tries to drag afterwards. Otherwise they would set selected to null as onSquareMouseDown fires a second time and be dragging blind since onSquareMouseDown deselects an already selected square
    setSelected(sq);
    setTargets(legalTargets(sq));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActivePiece(null);
    const from = active.data.current?.square as Square | undefined;
    const to = over?.id as Square | undefined;

    if (from && to && targets.includes(to)) {
      if (isPromotion(from, to)) {
        setPendingPromotion({ from, to, byDrag: true });
      } else {
        lastMovedByDragRef.current = true;
        makeMove(from, to);
      }
    } else if (from && to && to !== from && !muted) {
      // Released over a real square that isn't a legal target — the one moment
      // the player expressed intent and would otherwise get no feedback.
      // Dropping back on the origin square is a cancel, not an error, and a
      // drag released off the board (no `over`) stays silent.
      play("illegal");
    }

    // Always clear selection on drag end whether legal or not.
    // Click-to-move handles its own selection independently.
    setSelected(null);
    setTargets([]);
  };

  const handleDragCancel = () => {
    setActivePiece(null);
    setSelected(null);
    setTargets([]);
  };

  // ── render ─────────────────────────────────────────────────────────────────

  const isGameOver = checkmate || stalemate || draw;
  const cellSize = rect ? Math.min(rect.width / 8, rect.height / 8) : 64;

  // Correct the DragOverlay's starting position using the piece's calculated
  // square coordinates. dnd-kit measures the draggable node via getBoundingClientRect
  // but can return the board's top-left when pieces are positioned only via transform.
  // This modifier computes where the piece *should* be and shifts the overlay there.
  const overlayModifiers = useMemo<Modifier[]>(
    () => [
      ({ transform, activeNodeRect }) => {
        if (!activePiece || !rect || !activeNodeRect) return transform;
        const { x: squareX, y: squareY } = squareToXY(
          activePiece.square as Square,
          rect,
        );
        // Piece position in viewport coordinates
        const expectedLeft = rect.left + squareX;
        const expectedTop = rect.top + squareY;
        return {
          ...transform,
          x: transform.x + (expectedLeft - activeNodeRect.left),
          y: transform.y + (expectedTop - activeNodeRect.top),
        };
      },
    ],
    [activePiece, rect],
  );

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Board container defines the coordinate space */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="relative w-128 aspect-square shrink-0 ring ring-gray-700 overflow-hidden">
          <GameNotifications />
          {/* Squares background (click targets + drop targets) */}
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
                <DroppableSquare
                  key={coord}
                  coord={coord}
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

          {/* Pieces layer (absolute) & drag sources */}
          {rect && (
            <div className="absolute inset-0 pointer-events-none">
              {pieces.map((p) => {
                const { x, y, cell } = squareToXY(p.square, rect);
                return (
                  <DraggablePiece
                    key={p.id}
                    piece={p}
                    x={x}
                    y={y}
                    cell={cell}
                    disabled={readOnly || isGameOver || p.color !== turn}
                    onMouseDown={() => onSquareMouseDown(p.square)}
                    registerNode={(el) => {
                      const map = nodeMapRef.current;
                      if (el) map.set(p.id, el);
                      else map.delete(p.id);
                    }}
                  >
                    {getPieceSymbol(p.type as PieceType, p.color)}
                  </DraggablePiece>
                );
              })}
            </div>
          )}

          {/* Promotion picker — rendered above everything else inside the board */}
          {pendingPromotion && rect && (
            <PromotionModal
              color={turn}
              fileIdx={files.indexOf(pendingPromotion.to[0])}
              cellSize={cellSize}
              onSelect={handlePromotionSelect}
              onCancel={handlePromotionCancel}
            />
          )}
        </div>

        {/* DragOverlay renders outside overflow:hidden so the piece isn't
            clipped at board edges. dropAnimation={null} lets the FLIP take over. */}
        <DragOverlay dropAnimation={null} modifiers={overlayModifiers}>
          {activePiece ? (
            <span
              style={{
                display: "block",
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                lineHeight: `${cellSize}px`,
                textAlign: "center",
                fontSize: "3rem",
                cursor: "grabbing",
                userSelect: "none",
              }}
            >
              {getPieceSymbol(activePiece.type as PieceType, activePiece.color)}
            </span>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Chessboard;
