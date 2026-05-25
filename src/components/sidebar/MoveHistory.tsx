import PlayerColumnHeader from "@/components/sidebar/playerColumnHeader";
import { useEffect, useRef } from "react";

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

type MoveHistoryProps = {
  sanHistory: string[];
};

const MoveHistory = ({ sanHistory }: MoveHistoryProps) => {
  const historyRef = useRef<HTMLDivElement | null>(null);
  const moveRows = buildMoveRows(sanHistory);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [sanHistory.length]);

  return (
    <div
      ref={historyRef}
      className="flex-1 border-x-4 border-pawnstorm-blue bg-gray-200 overflow-y-auto min-h-0 px-2 py-2 space-y-0.5"
    >
      <p className="mb-2 text-sm text-gray-600 font-semibold">Move History</p>
      {moveRows.length === 0 ? (
        <p className="text-gray-600 text-xs text-center mt-4">No moves yet</p>
      ) : (
        <>
          <div className="grid grid-cols-[2rem_1fr_1fr] gap-x-1 text-xs font-mono">
            {/* placeholder for grid setup */}
            <span></span>
            <PlayerColumnHeader>Player 1</PlayerColumnHeader>
            <PlayerColumnHeader>Player 2</PlayerColumnHeader>
          </div>
          {moveRows.map((row) => (
            <div
              key={row.num}
              className="grid grid-cols-[2rem_1fr_1fr] gap-x-1 text-xs font-mono"
            >
              <span className="text-gray-800 font-medium">{row.num}.</span>
              <span className="text-gray-800">{row.white}</span>
              <span className="text-gray-800">{row.black ?? ""}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default MoveHistory;
