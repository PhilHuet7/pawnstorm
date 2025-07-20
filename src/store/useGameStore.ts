import { create } from "zustand";
import { Chess } from "chess.js";

type GameState = {
  chess: Chess;
  turn: "w" | "b";
  lastMove: { from: string; to: string } | null;
  moveHistory: string[];
  makeMove: (from: string, to: string) => boolean;
};

export const useGameStore = create<GameState>((set) => {
  const chess = new Chess();
  return {
    chess,
    turn: chess.turn(),
    lastMove: null,
    moveHistory: [],
    makeMove: (from: string, to: string) => {
      const ok = chess.move({ from, to, promotion: "q" });
      if (!ok) return false;
      set((state) => ({
        turn: chess.turn(),
        lastMove: { from, to },
        moveHistory: [...state.moveHistory, chess.fen()],
      }));
      return true;
    },
  };
});
