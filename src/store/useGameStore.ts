import { create } from "zustand";
import { Chess, PieceSymbol, Square } from "chess.js";

type MoveResult =
  | {
      ok: true;
      san: string;
      fen: string;
      captured?: PieceSymbol;
      enPassant: boolean;
    }
  | { ok: false; reason: "illegal" | "readOnly" };

type DrawReason = "threefold" | "fiftyMove" | "insufficient" | "stalemate";

/**
 * Everything the UI needs to react to a single move — sounds, the move ticker,
 * notifications. Recorded on the store rather than returned from `makeMove` so
 * consumers can subscribe to `positionVersion` instead of each call site having
 * to thread the result through.
 *
 * `captured` is set for en passant too, whereas chess.js `isCapture()` is not —
 * so treat `captured !== undefined` as the capture test, never `isCapture()`.
 */
export type MoveEvent = {
  san: string;
  color: "w" | "b";
  piece: PieceSymbol;
  from: Square;
  to: Square;
  captured?: PieceSymbol;
  enPassant: boolean;
  castle: "k" | "q" | null;
  promotion?: PieceSymbol;
  check: boolean;
  checkmate: boolean;
};

type GameState = {
  // core, derived, and history
  chess: Chess;
  fen: string;
  turn: "w" | "b";
  lastMove: { from: Square; to: Square } | null;
  /** Detail of the move that produced the current position; null after undo/reset/load. */
  lastMoveEvent: MoveEvent | null;
  moveHistory: string[];
  sanHistory: string[];
  positionVersion: number;

  // captured pieces (pieces each side has taken)
  capturedPieces: { w: PieceSymbol[]; b: PieceSymbol[] };

  // UI/flow control
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;

  // actions
  makeMove: (
    from: Square,
    to: Square,
    promotion?: "q" | "r" | "b" | "n",
  ) => MoveResult;
  legalTargets: (from: Square) => Square[];
  isLegal: (from: Square, to: Square) => boolean;

  undo: () => void;
  reset: () => void;
  loadFEN: (fen: string) => boolean;
  loadPGN: (pgn: string) => boolean;

  // status flags
  inCheck: boolean;
  /** Square of the king that is currently in check, for board highlighting. */
  checkSquare: Square | null;
  checkmate: boolean;
  stalemate: boolean;
  draw: boolean;
  drawReason?: DrawReason | undefined;
};

export const useGameStore = create<GameState>((set, get) => {
  const chess = new Chess();

  // helper to compute all derived state from the mutable chess instance
  const snapshot = () => {
    const draw = chess.isDraw();
    const drawReason: DrawReason | undefined = draw
      ? chess.isStalemate()
        ? "stalemate"
        : chess.isThreefoldRepetition()
          ? "threefold"
          : chess.isInsufficientMaterial()
            ? "insufficient"
            : "fiftyMove"
      : undefined;

    const inCheck = chess.inCheck();
    // The side to move is the one in check, so locate its king for highlighting.
    // board() cells carry their own `square`, so no index math is needed.
    const checkSquare = inCheck
      ? (chess
          .board()
          .flat()
          .find((c) => c && c.type === "k" && c.color === chess.turn())
          ?.square ?? null)
      : null;

    return {
      fen: chess.fen(),
      turn: chess.turn(),
      inCheck,
      checkSquare,
      checkmate: chess.isCheckmate(),
      stalemate: chess.isStalemate(),
      draw,
      drawReason,
    };
  };

  const s = snapshot();

  return {
    chess,
    // seed everything from the snapshot (values, not methods)
    fen: s.fen,
    turn: s.turn,
    inCheck: s.inCheck,
    checkSquare: s.checkSquare,
    checkmate: s.checkmate,
    stalemate: s.stalemate,
    draw: s.draw,
    drawReason: s.drawReason,

    lastMove: null,
    lastMoveEvent: null,
    moveHistory: [s.fen],
    sanHistory: [],

    positionVersion: 0,
    capturedPieces: { w: [], b: [] },

    // flow control: disable inputs when it's engine/ opponent turn
    readOnly: false,
    setReadOnly: (v) => set({ readOnly: v }),

    // primary action: attempt a move, update derived state, record histories
    makeMove: (from, to, promotion = "q") => {
      if (get().readOnly) return { ok: false, reason: "readOnly" };
      const result = chess.move({ from, to, promotion });
      if (!result) return { ok: false, reason: "illegal" };

      const ns = snapshot();
      const event: MoveEvent = {
        san: result.san,
        color: result.color,
        piece: result.piece,
        from,
        to,
        captured: result.captured,
        enPassant: result.isEnPassant(),
        castle: result.isKingsideCastle()
          ? "k"
          : result.isQueensideCastle()
            ? "q"
            : null,
        promotion: result.promotion,
        // check/checkmate describe the position *after* the move, so they come
        // from the fresh snapshot rather than from the move object.
        check: ns.inCheck,
        checkmate: ns.checkmate,
      };

      set((state) => ({
        ...ns,
        lastMove: { from, to },
        lastMoveEvent: event,
        moveHistory: [...state.moveHistory, ns.fen],
        sanHistory: [...state.sanHistory, result.san],
        positionVersion: state.positionVersion + 1,
        ...(result.captured && {
          capturedPieces: {
            ...state.capturedPieces,
            [result.color]: [
              ...state.capturedPieces[result.color],
              result.captured,
            ],
          },
        }),
      }));
      return {
        ok: true,
        san: result.san,
        fen: ns.fen,
        captured: result.captured,
        enPassant: result.isEnPassant(),
      };
    },

    // helpers for DnD highlighting + gating
    legalTargets: (from) =>
      chess.moves({ square: from, verbose: true }).map((m) => m.to as Square),
    isLegal: (from, to) =>
      chess.moves({ square: from, verbose: true }).some((m) => m.to === to),

    // editing/control
    undo: () => {
      const undone = chess.undo();
      if (!undone) return;
      const ns = snapshot();
      // Re-point the highlight at whatever move is now the most recent, so
      // stepping backwards still shows where the board last came from.
      const prev = chess.history({ verbose: true }).at(-1);
      set((state) => ({
        ...ns,
        lastMove: prev ? { from: prev.from, to: prev.to } : null,
        // No event: nothing was *played*, so nothing should sound or tick.
        lastMoveEvent: null,
        moveHistory: state.moveHistory.slice(0, -1),
        sanHistory: state.sanHistory.slice(0, -1),
        positionVersion: state.positionVersion + 1,
        ...(undone.captured && {
          capturedPieces: {
            ...state.capturedPieces,
            [undone.color]: state.capturedPieces[undone.color].slice(0, -1),
          },
        }),
      }));
    },

    reset: () => {
      chess.reset();
      const ns = snapshot();
      set((state) => ({
        ...ns,
        lastMove: null,
        lastMoveEvent: null,
        moveHistory: [ns.fen],
        sanHistory: [],
        positionVersion: state.positionVersion + 1,
        capturedPieces: { w: [], b: [] },
      }));
    },

    loadFEN: (fen) => {
      try {
        chess.load(fen);
      } catch {
        return false;
      }
      const ns = snapshot();
      set((state) => ({
        ...ns,
        lastMove: null,
        lastMoveEvent: null,
        moveHistory: [ns.fen],
        sanHistory: [],
        positionVersion: state.positionVersion + 1,
        capturedPieces: { w: [], b: [] },
      }));
      return true;
    },

    loadPGN: (pgn) => {
      try {
        chess.loadPgn(pgn, { strict: false });
      } catch {
        return false;
      }
      const ns = snapshot();
      set((state) => ({
        ...ns,
        lastMove: null,
        lastMoveEvent: null,
        moveHistory: [ns.fen],
        sanHistory: chess.history(),
        positionVersion: state.positionVersion + 1,
        capturedPieces: { w: [], b: [] },
      }));
      return true;
    },
  };
});
