import { getPieceSymbol } from "@/lib/utils";
import type { PieceType } from "@/types/chess";
import type { PieceSymbol as ChessPieceSymbol } from "chess.js";

type CapturedRowProps = { pieces: ChessPieceSymbol[]; color: "w" | "b" };

const CapturedRow = ({ pieces, color }: CapturedRowProps) => {
  return (
    <div className="flex flex-wrap justify-start">
      {pieces.map((p, i) => (
        <span
          key={`${p}-${i}`}
          className={`text-4xl leading-none animate-capturedPieceIn -ml-4`}
        >
          {getPieceSymbol(p as PieceType, color)}
        </span>
      ))}
    </div>
  );
};

export default CapturedRow;
