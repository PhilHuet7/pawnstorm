import { create } from "zustand";
import { Chess, Square } from "chess.js";

type MoveResult =
  | { ok: true; san: string; fen: string }
  | { ok: false; reason: "illegal" | "readOnly" };

type DrawReason = "threefold" | "fiftyMove" | "insufficient" | "stalemate";

type GameState = {
  // core, derived, and history
  chess: Chess;
  fen: string;
  turn: "w" | "b";
  lastMove: { from: Square; to: Square } | null;
  moveHistory: string[];
  sanHistory: string[];

  // UI/flow control
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;

  // actions
  makeMove: (
    from: Square,
    to: Square,
    promotion?: "q" | "r" | "b" | "n"
  ) => MoveResult;
  legalTargets: (from: Square) => Square[];
  isLegal: (from: Square, to: Square) => boolean;

  undo: () => void;
  reset: () => void;
  loadFEN: (fen: string) => boolean;
  loadPGN: (pgn: string) => boolean;

  // status flags
  inCheck: boolean;
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

    return {
      fen: chess.fen(),
      turn: chess.turn(),
      inCheck: chess.inCheck(),
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
    checkmate: s.checkmate,
    stalemate: s.stalemate,
    draw: s.draw,
    drawReason: s.drawReason,

    lastMove: null,
    moveHistory: [s.fen],
    sanHistory: [],

    // flow control: disable inputs when it's engine/ opponent turn
    readOnly: false,
    setReadOnly: (v) => set({ readOnly: v }),

    // primary action: attempt a move, update derived state, record histories
    makeMove: (from, to, promotion = "q") => {
      if (get().readOnly) return { ok: false, reason: "readOnly" };
      const result = chess.move({ from, to, promotion });
      if (!result) return { ok: false, reason: "illegal" };

      const ns = snapshot();
      set((state) => ({
        ...ns,
        lastMove: { from, to },
        moveHistory: [...state.moveHistory, ns.fen],
        sanHistory: [...state.sanHistory, result.san],
      }));
      return { ok: true, san: result.san, fen: ns.fen };
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
      set((state) => ({
        ...ns,
        lastMove: null,
        moveHistory: [...state.moveHistory, ns.fen],
        sanHistory: state.sanHistory.slice(0, -1),
      }));
    },

    reset: () => {
      chess.reset();
      const ns = snapshot();
      set({ ...ns, lastMove: null, moveHistory: [ns.fen], sanHistory: [] });
    },

    loadFEN: (fen) => {
      try {
        chess.load(fen);
      } catch {
        return false;
      }
      const ns = snapshot();
      set({ ...ns, lastMove: null, moveHistory: [ns.fen], sanHistory: [] });
      return true;
    },

    loadPGN: (pgn) => {
      try {
        chess.loadPgn(pgn, { strict: false });
      } catch {
        return false;
      }
      const ns = snapshot();
      set({
        ...ns,
        lastMove: null,
        moveHistory: [ns.fen],
        sanHistory: chess.history(),
      });
      return true;
    },
  };
});
