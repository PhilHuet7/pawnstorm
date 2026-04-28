import { getPieceSymbol } from "@/lib/utils";
import type { PieceType } from "@/types/chess";
import type { PieceSymbol as ChessPieceSymbol } from "chess.js";

type CapturedRowProps = { pieces: ChessPieceSymbol[]; color: "w" | "b" };

const CapturedRow = ({ pieces, color }: CapturedRowProps) => {
  // has to be flipped since capturedPieces returns solid for black and outlined for white
  const capturedColor = color === "w" ? "b" : "w";
  return (
    <div className="flex flex-wrap justify-start">
      {pieces.map((p, i) => (
        <span
          key={`${p}-${i}`}
          className={`text-3xl leading-none animate-capturedPieceIn -ml-4 select-none`}
        >
          {getPieceSymbol(p as PieceType, capturedColor)}
        </span>
      ))}
    </div>
  );
};

export default CapturedRow;
