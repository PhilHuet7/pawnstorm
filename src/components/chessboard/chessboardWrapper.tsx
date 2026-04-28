"use client";

import { useGameStore } from "@/store/useGameStore";
import Chessboard from "./chessboard";
import UndoResetButtons from "./undoResetButtons";
import GameSidebar from "../sidebar/GameSidebar";

export default function ChessboardWrapper() {
  const undo = useGameStore((s) => s.undo);
  const reset = useGameStore((s) => s.reset);

  return (
    <div className="flex flex-col">
      <div className="flex flex-row flex-wrap items-stretch gap-4">
        <Chessboard />
        <GameSidebar />
      </div>
      <UndoResetButtons undo={undo} reset={reset} className="mx-auto" />
    </div>
  );
}
