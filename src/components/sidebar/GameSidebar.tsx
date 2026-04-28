"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { getPieceSymbol } from "@/lib/utils";
import type { PieceSymbol } from "chess.js";
import { PieceType } from "@/types/chess";

// ---- Material advantage ----
const PIECE_VALUES: Record<PieceSymbol, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
  k: 0,
};

const sumValue = (pieces: PieceSymbol[]) =>
  pieces.reduce((acc, p) => acc + PIECE_VALUES[p], 0);

// ---- Captured pieces display ----
const PIECE_ORDER: PieceSymbol[] = ["q", "r", "b", "n", "p"];

const groupByType = (pieces: PieceSymbol[]) => {
  const groups: Partial<Record<PieceSymbol, PieceSymbol[]>> = {};
  for (const p of pieces) {
    (groups[p] ??= []).push(p);
  }
  return PIECE_ORDER.filter((t) => groups[t]).map((t) => ({
    type: t,
    pieces: groups[t]!,
  }));
};

// ---- Player section ----
type PlayerSectionProps = {
  label: string;
  color: "w" | "b";
  capturedByThisPlayer: PieceSymbol[]; // pieces this player has taken
  advantage: number; // positive = this player leads
  isActive: boolean;
};

const PlayerSection = ({
  label,
  color,
  capturedByThisPlayer,
  advantage,
  isActive,
}: PlayerSectionProps) => {
  // The captured pieces display shows the enemy pieces this player has taken.
  // White captures black pieces → show black symbols; black captures white → show white symbols
  const capturedColor: "w" | "b" = color === "w" ? "b" : "w";
  const groups = groupByType(capturedByThisPlayer);

  return (
    <div
      className={`shrink-0 flex flex-col gap-1.5 px-3 py-3 transition-colors duration-200 ${
        isActive
          ? "border-l-4 border-pawnstorm-gold bg-white/5"
          : "border-l-4 border-transparent"
      }`}
    >
      {/* Name row */}
      <div className="flex items-center gap-2">
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-pawnstorm-gold animate-blinking shrink-0" />
        )}
        <span
          className={`text-sm font-semibold tracking-wide ${
            isActive ? "text-pawnstorm-gold" : "text-gray-400"
          } ${!isActive ? "ml-4" : ""}`}
        >
          {label}
        </span>
        <span
          className={`ml-auto text-xs font-mono font-bold ${
            advantage > 0 ? "text-pawnstorm-gold" : "text-gray-500"
          }`}
        >
          {advantage > 0 ? `+${advantage}` : "+0"}
        </span>
      </div>

      {/* Captured pieces */}
      <div className="flex flex-wrap gap-x-1 gap-y-0.5 min-h-[1.5rem]">
        {groups.length === 0 ? (
          <span className="text-gray-600 text-xs">—</span>
        ) : (
          groups.map((g) =>
            g.pieces.map((p, i) => (
              <span
                key={`${g.type}-${i}`}
                className="text-lg leading-none select-none animate-capturedPieceIn"
              >
                {getPieceSymbol(p as PieceType, capturedColor)}
              </span>
            )),
          )
        )}
      </div>
    </div>
  );
};

// ---- Move history ----
type MoveRow = { num: number; white: string; black: string | null };

const buildMoveRows = (sanHistory: string[]): MoveRow[] => {
  const rows: MoveRow[] = [];
  for (let i = 0; i < sanHistory.length; i += 2) {
    rows.push({
      num: Math.floor(i / 2) + 1,
      white: sanHistory[i],
      black: sanHistory[i + 1] ?? null,
    });
  }
  return rows;
};

// ---- Main sidebar ----
const GameSidebar = () => {
  const turn = useGameStore((s) => s.turn);
  const capturedPieces = useGameStore((s) => s.capturedPieces);
  const sanHistory = useGameStore((s) => s.sanHistory);

  // capturedPieces.w = pieces white has captured (black pieces)
  // capturedPieces.b = pieces black has captured (white pieces)
  const whiteScore = sumValue(capturedPieces.w);
  const blackScore = sumValue(capturedPieces.b);
  const whiteAdv = whiteScore - blackScore; // positive → white leads

  const moveRows = useMemo(() => buildMoveRows(sanHistory), [sanHistory]);

  // Auto-scroll move history to bottom
  const historyRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [sanHistory.length]);

  return (
    <div className="flex flex-col self-stretch w-52 bg-pawnstorm-blue rounded-lg overflow-hidden ring ring-gray-700">
      {/* Player 2 (black) — top */}
      <PlayerSection
        label="Player 2"
        color="b"
        capturedByThisPlayer={capturedPieces.b}
        advantage={whiteAdv < 0 ? -whiteAdv : 0}
        isActive={turn === "b"}
      />

      <div className="h-px bg-gray-700 mx-3" />

      {/* Move history — flexes to fill remaining space */}
      <div
        ref={historyRef}
        className="flex-1 overflow-y-auto min-h-0 px-2 py-2 space-y-0.5"
      >
        {moveRows.length === 0 ? (
          <p className="text-gray-600 text-xs text-center mt-4">No moves yet</p>
        ) : (
          moveRows.map((row) => (
            <div
              key={row.num}
              className="grid grid-cols-[2rem_1fr_1fr] gap-x-1 text-xs font-mono"
            >
              <span className="text-gray-500">{row.num}.</span>
              <span className="text-gray-100">{row.white}</span>
              <span className="text-gray-400">{row.black ?? ""}</span>
            </div>
          ))
        )}
      </div>

      <div className="h-px bg-gray-700 mx-3" />

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
