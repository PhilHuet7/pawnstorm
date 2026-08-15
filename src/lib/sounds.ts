/**
 * Thin wrapper over HTMLAudioElement for gameplay sound effects.
 *
 * Deliberately knows nothing about game state or settings — callers decide
 * whether a sound should play. Every failure path is a silent no-op: a missing
 * file, a blocked autoplay, or a server render must never throw.
 *
 * Files live in `public/sounds/`; see its README.txt for how each was mastered.
 */

export type SoundName =
  | "move"
  | "capture"
  | "castle"
  | "check"
  | "promote"
  | "illegal"
  | "checkmate"
  | "gameEnd"
  | "draw";

const FILES: Record<SoundName, string> = {
  move: "/sounds/move.mp3",
  capture: "/sounds/capture.mp3",
  castle: "/sounds/castle.mp3",
  check: "/sounds/check.mp3",
  promote: "/sounds/promote.mp3",
  illegal: "/sounds/illegal.mp3",
  checkmate: "/sounds/checkmate.mp3",
  gameEnd: "/sounds/gameEnd.mp3",
  draw: "/sounds/draw.mp3",
};

const cache = new Map<SoundName, HTMLAudioElement>();

/** Timer for a queued follow-up sound (currently only mate's rolling thunder). */
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

const audioFor = (name: SoundName): HTMLAudioElement | null => {
  // No Audio during SSR; callers run in effects, but guard anyway.
  if (typeof window === "undefined") return null;

  let el = cache.get(name);
  if (!el) {
    el = new Audio(FILES[name]);
    el.preload = "auto";
    cache.set(name, el);
  }
  return el;
};

/** Rewind so the same sound retriggers on rapid moves instead of being ignored. */
const rewind = (el: HTMLAudioElement) => {
  try {
    el.currentTime = 0;
  } catch {
    // Throws if the element has no data yet; play() will start at 0 regardless.
  }
};

export function play(name: SoundName) {
  const el = audioFor(name);
  if (!el) return;
  rewind(el);
  // Rejects on a missing file or a blocked autoplay policy — both are fine.
  void el.play().catch(() => {});
}

/**
 * Play `first` immediately and queue `second` behind it. Used for checkmate:
 * the lightning crack lands on the mating move, thunder rolls in after.
 * Only one follow-up can be pending at a time.
 */
export function playSequence(
  first: SoundName,
  second: SoundName,
  delayMs: number,
) {
  cancelPending();
  play(first);
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    play(second);
  }, delayMs);
}

/** Drop a queued follow-up — e.g. the board was reset during the thunder. */
export function cancelPending() {
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
}

/** Silence everything currently playing, and drop any queued follow-up. */
export function stopAll() {
  cancelPending();
  cache.forEach((el) => {
    el.pause();
    rewind(el);
  });
}
