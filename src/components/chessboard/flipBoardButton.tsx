"use client";

import Button from "../ui/button";
import { useSettingsStore } from "@/store/useSettingsStore";

const FlipIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 4v16" />
    <path d="m8 8-4 4 4 4" />
    <path d="m16 8 4 4-4 4" />
  </svg>
);

const FlipBoardButton = () => {
  const orientation = useSettingsStore((s) => s.orientation);
  const flipOrientation = useSettingsStore((s) => s.flipOrientation);

  const label =
    orientation === "w" ? "Flip board to black's view" : "Flip board to white's view";

  return (
    <Button
      onClick={flipOrientation}
      aria-label={label}
      title={label}
      className="px-2.5"
    >
      <FlipIcon />
    </Button>
  );
};

export default FlipBoardButton;
