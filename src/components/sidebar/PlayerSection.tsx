import type { PieceSymbol } from "chess.js";
import { PieceIcon } from "@/components/chessboard/pieces";

/** Captured pieces render small; big enough to read, small enough to crowd a row. */
const CAPTURED_SIZE = 22;

export const PIECE_VALUES: Record<PieceSymbol, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
  k: 0,
};

export const sumValue = (pieces: PieceSymbol[]) =>
  pieces.reduce((acc, p) => acc + PIECE_VALUES[p], 0);

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

type PlayerSectionProps = {
  label: string;
  color: "w" | "b";
  capturedByThisPlayer: PieceSymbol[];
  advantage: number;
  isActive: boolean;
};

const PlayerSection = ({
  label,
  color,
  capturedByThisPlayer,
  advantage,
  isActive,
}: PlayerSectionProps) => {
  const capturedColor: "w" | "b" = color === "w" ? "b" : "w";
  const groups = groupByType(capturedByThisPlayer);

  return (
    <div
      className={`shrink-0 flex flex-col gap-1.5 px-3 py-3 transition-colors duration-200 bg-pawnstorm-blue/95 ${
        isActive
          ? "border-l-7 border-pawnstorm-gold"
          : "border-l-7 border-transparent"
      }`}
    >
      {/* Name row */}
      <div className="flex items-center gap-2">
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-pawnstorm-gold animate-blinking shrink-0" />
        )}
        <span
          className={`text-sm font-semibold tracking-wide ${!isActive ? "ml-4 text-gray-200" : "text-pawnstorm-gold"}`}
        >
          {label}
        </span>
        <span
          className={`ml-auto font-mono font-bold ${advantage > 0 ? "text-pawnstorm-gold text-sm" : "text-gray-200 text-xs"}`}
        >
          {advantage > 0 ? `+${advantage}` : "+0"}
        </span>
      </div>

      {/* Captured pieces */}
      <div className="flex flex-wrap gap-y-0.5 min-h-[1.5rem]">
        {groups.length === 0 ? (
          <span className="text-gray-200 text-xs">—</span>
        ) : (
          groups.map((g) =>
            g.pieces.map((p, i) => (
              <span
                key={`${g.type}-${i}`}
                className="leading-none select-none animate-capturedPieceIn -ml-2 first-of-type:ml-0"
              >
                <PieceIcon
                  type={p}
                  color={capturedColor}
                  size={CAPTURED_SIZE}
                  outline
                />
              </span>
            )),
          )
        )}
      </div>
    </div>
  );
};

export default PlayerSection;
