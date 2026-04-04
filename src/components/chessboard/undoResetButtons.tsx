import React, { HTMLAttributes } from "react";
import Button from "../ui/button";
import clsx from "clsx";

type ComponentProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
  undo: () => void;
  reset: () => void;
};

export default function UndoResetButtons({
  className,
  undo,
  reset,
  ...props
}: ComponentProps) {
  return (
    <div className={clsx("flex gap-2 mt-3", className)} {...props}>
      <Button onClick={undo}>Undo</Button>
      <Button onClick={reset}>Reset</Button>
    </div>
  );
}
