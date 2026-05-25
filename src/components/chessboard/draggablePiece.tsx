import { PieceVM } from "@/types/chess";
import { useDraggable } from "@dnd-kit/core";
import { useCallback } from "react";
import React from "react";

type DraggablePieceProps = {
  piece: PieceVM;
  x: number;
  y: number;
  cell: number;
  disabled: boolean;
  onMouseDown: () => void;
  registerNode: (el: HTMLElement | null) => void;
  children: React.ReactNode;
};

export default function DraggablePiece({
  piece,
  x,
  y,
  cell,
  disabled,
  onMouseDown,
  registerNode,
  children,
}: DraggablePieceProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: piece.id,
    data: { square: piece.square },
    disabled,
  });

  // Stabilise the ref so React only calls it on mount/unmount, never on
  // re-renders. Without this, every pointer-move re-render calls setNodeRef(null)
  // which makes dnd-kit lose the active node and fail to detect the drop target.
  const combinedRef = useCallback(
    (el: HTMLElement | null) => {
      setNodeRef(el);
      registerNode(el);
    },
    // registerNode is intentionally omitted: it's recreated every render but its
    // behaviour (writing to nodeMapRef) is stable. setNodeRef is stable from dnd-kit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setNodeRef],
  );

  return (
    <span
      ref={combinedRef}
      className="absolute pointer-events-auto select-none text-5xl z-40"
      style={{
        // FLIP animation writes directly to this transform after each move.
        transform: `translate3d(${x}px, ${y}px, 0)`,
        width: `${cell}px`,
        height: `${cell}px`,
        lineHeight: `${cell}px`,
        textAlign: "center",
        // Hide the origin piece while dragging; DragOverlay shows it instead.
        opacity: isDragging ? 0 : 1,
        touchAction: "none",
        cursor: disabled ? "default" : "grab",
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown();
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </span>
  );
}
