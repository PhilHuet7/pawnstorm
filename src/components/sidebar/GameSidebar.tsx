"use client";

import { useGameStore } from "@/store/useGameStore";
import PlayerSection, { sumValue } from "./PlayerSection";
import MoveHistory from "./MoveHistory";

const GameSidebar = () => {
  const turn = useGameStore((s) => s.turn);
  const capturedPieces = useGameStore((s) => s.capturedPieces);
  const sanHistory = useGameStore((s) => s.sanHistory);

  const whiteAdv = sumValue(capturedPieces.w) - sumValue(capturedPieces.b);

  return (
    <div className="flex flex-col self-stretch w-52 rounded-lg overflow-hidden max-h-128">
      {/* Player 2 (black) — top */}
      <PlayerSection
        label="Player 2"
        color="b"
        capturedByThisPlayer={capturedPieces.b}
        advantage={whiteAdv < 0 ? -whiteAdv : 0}
        isActive={turn === "b"}
      />

      {/* Move history — flexes to fill remaining space */}
      <MoveHistory sanHistory={sanHistory} />

      {/* Player 1 (white) — bottom */}
      <PlayerSection
        label="Player 1"
        color="w"
        capturedByThisPlayer={capturedPieces.w}
        advantage={whiteAdv > 0 ? whiteAdv : 0}
        isActive={turn === "w"}
      />
    </div>
  );
};

export default GameSidebar;
