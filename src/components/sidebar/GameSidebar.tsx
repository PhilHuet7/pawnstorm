"use client";

import { useGameStore } from "@/store/useGameStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { PieceColor } from "@/types/chess";
import PlayerSection, { sumValue } from "./PlayerSection";
import MoveHistory from "./MoveHistory";

const GameSidebar = () => {
  const turn = useGameStore((s) => s.turn);
  const capturedPieces = useGameStore((s) => s.capturedPieces);
  const sanHistory = useGameStore((s) => s.sanHistory);
  const orientation = useSettingsStore((s) => s.orientation);

  const whiteAdv = sumValue(capturedPieces.w) - sumValue(capturedPieces.b);

  // Follow the board: whoever sits at the bottom of the board gets the bottom
  // panel, so the two never disagree after a flip.
  const bottom: PieceColor = orientation;
  const top: PieceColor = orientation === "w" ? "b" : "w";

  const sectionProps = (color: PieceColor) => ({
    // Player 1 is white and Player 2 is black regardless of which side is
    // shown on top — Phase 5 replaces these with real names.
    label: color === "w" ? "Player 1" : "Player 2",
    color,
    capturedByThisPlayer: capturedPieces[color],
    advantage: color === "w" ? Math.max(whiteAdv, 0) : Math.max(-whiteAdv, 0),
    isActive: turn === color,
  });

  return (
    <div className="flex flex-col self-stretch w-52 rounded-lg overflow-hidden max-h-128">
      <PlayerSection {...sectionProps(top)} />

      {/* Move history — flexes to fill remaining space. Column order is fixed:
          white's move is always the first column in algebraic notation. */}
      <MoveHistory sanHistory={sanHistory} />

      <PlayerSection {...sectionProps(bottom)} />
    </div>
  );
};

export default GameSidebar;
