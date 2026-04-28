import { useGameStore } from "@/store/useGameStore";
import CapturedRow from "./capturedRow";
import type { PieceSymbol as ChessPieceSymbol } from "chess.js";

const pieceOrder: ChessPieceSymbol[] = ["q", "r", "b", "n", "p"];

const groupByType = (pieces: ChessPieceSymbol[]) => {
  const groups: Partial<Record<ChessPieceSymbol, ChessPieceSymbol[]>> = {};
  for (const p of pieces) {
    (groups[p] ??= []).push(p);
  }
  return pieceOrder
    .filter((t) => groups[t])
    .map((t) => ({ type: t, pieces: groups[t]! }));
};

type CapturedSectionProps = {
  pieces: ChessPieceSymbol[];
  color: "w" | "b";
  player: string;
};

const CapturedSection = ({ pieces, color, player }: CapturedSectionProps) => {
  const turn = useGameStore((s) => s.turn);

  console.log("turn", turn);
  console.log("color", color);
  const groups = groupByType(pieces);
  return (
    <div
      className={`relative z-10 flex flex-col gap-0.5 w-full h-full max-h-1/2 py-4 ${color === "b" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <div className={`flex flex-col gap-2`}>
        <div className="flex flex-row items-center px-3 py-1">
          {turn === color && (
            <div
              className={`rounded-full w-4 h-4 bg-green-600 animate-blinking`}
            />
          )}
          <h2 className={`mx-auto text-xl font-bold rounded-xl`}>{player}</h2>
        </div>
        {groups.map((g) => {
          return (
            <div key={g.type} className={`pr-2 pl-6`}>
              <CapturedRow pieces={g.pieces} color={color} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CapturedSection;
