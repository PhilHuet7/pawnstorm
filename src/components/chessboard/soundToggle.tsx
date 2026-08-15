"use client";

import Button from "../ui/button";
import { useSettingsStore } from "@/store/useSettingsStore";
import { stopAll } from "@/lib/sounds";

const SpeakerIcon = ({ muted }: { muted: boolean }) => (
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
    <path d="M11 5 6 9H2v6h4l5 4z" />
    {muted ? (
      <>
        <path d="m22 9-6 6" />
        <path d="m16 9 6 6" />
      </>
    ) : (
      <>
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M19 5a9 9 0 0 1 0 14" />
      </>
    )}
  </svg>
);

const SoundToggle = () => {
  const muted = useSettingsStore((s) => s.muted);
  const toggleMuted = useSettingsStore((s) => s.toggleMuted);

  const onClick = () => {
    // Silence anything mid-playback, including a queued thunder roll, so
    // muting takes effect immediately rather than after the current sound.
    if (!muted) stopAll();
    toggleMuted();
  };

  return (
    <Button
      onClick={onClick}
      aria-pressed={muted}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      title={muted ? "Unmute sound" : "Mute sound"}
      className="px-2.5"
    >
      <SpeakerIcon muted={muted} />
    </Button>
  );
};

export default SoundToggle;
