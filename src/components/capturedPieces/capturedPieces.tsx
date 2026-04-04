"use client";

import { useGameStore } from "@/store/useGameStore";
import CapturedSection from "./capturedSection";

const CapturedPieces = () => {
  const capturedPieces = useGameStore((s) => s.capturedPieces);
  return (
    <div className="flex flex-col justify-center h-full w-32 bg-pawnstorm-gold rounded-lg overflow-hidden">
      <CapturedSection pieces={capturedPieces.b} color="w" player="Player 2" />
      <CapturedSection pieces={capturedPieces.w} color="b" player="Player 1" />
    </div>
  );
};

export default CapturedPieces;
