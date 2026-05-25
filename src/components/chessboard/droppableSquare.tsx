import { useDroppable } from "@dnd-kit/core";
import { Square } from "chess.js";

type DroppableSquareProps = {
  coord: Square;
  className: string;
  onClick: () => void;
};

export default function DroppableSquare({
  coord,
  className,
  onClick,
}: DroppableSquareProps) {
  const { setNodeRef } = useDroppable({ id: coord });
  return <button ref={setNodeRef} onClick={onClick} className={className} />;
}
