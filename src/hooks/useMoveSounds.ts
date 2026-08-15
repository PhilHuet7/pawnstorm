"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { cancelPending, play, playSequence, type SoundName } from "@/lib/sounds";
import type { MoveEvent } from "@/store/useGameStore";

/** Gap between the mating crack and the thunder rolling in behind it. */
const THUNDER_DELAY_MS = 400;

type Outcome = {
  checkmate: boolean;
  stalemate: boolean;
  draw: boolean;
};

/**
 * Picks the single sound for a move. First match wins — a capture that also
 * gives check plays `check`, not both.
 *
 * Terminal states are checked before per-move ones so a mating capture sounds
 * like the end of the game rather than a capture.
 */
export const soundForMove = (
  event: MoveEvent,
  outcome: Outcome,
): SoundName | "checkmateSequence" => {
  if (outcome.checkmate) return "checkmateSequence";
  if (outcome.stalemate || outcome.draw) return "draw";
  if (event.check) return "check";
  if (event.promotion) return "promote";
  if (event.castle) return "castle";
  // NOT event.isCapture — chess.js reports en passant as a non-capture, but
  // still sets `captured`. See the MoveEvent doc comment in useGameStore.
  if (event.captured !== undefined) return "capture";
  return "move";
};

/**
 * Plays a sound whenever a move lands. Mount once, near the board.
 *
 * Keyed off `positionVersion` like `useGameNotifications`, and reads the rest
 * imperatively so this hook adds only one subscription.
 */
export const useMoveSounds = () => {
  const version = useGameStore((s) => s.positionVersion);
  const muted = useSettingsStore((s) => s.muted);

  const prevVersion = useRef(version);

  useEffect(() => {
    if (version === prevVersion.current) return;
    prevVersion.current = version;

    const { lastMoveEvent, checkmate, stalemate, draw } =
      useGameStore.getState();

    // Undo/reset/load bump the version but play nothing. Cancel any queued
    // thunder so it doesn't roll in over a board that has already moved on.
    if (!lastMoveEvent) {
      cancelPending();
      return;
    }
    if (muted) return;

    const sound = soundForMove(lastMoveEvent, { checkmate, stalemate, draw });
    if (sound === "checkmateSequence") {
      playSequence("checkmate", "gameEnd", THUNDER_DELAY_MS);
    } else {
      play(sound);
    }
  }, [version, muted]);
};
