# Pawnstorm — UI completion plan

> **Status — planned, not started.** Written 2026-07-31; no code has been changed against it yet.
>
> **How to work through this:** in small, individually reviewable steps. Phil wants to read every
> line as it lands so he holds the context himself — so take one checklist item (or one tightly
> related group) at a time, explain the change, and stop for review before moving on. Do not
> batch a whole phase into a single sweep.

## Context

The game is rules-complete: chess.js drives everything, promotion works, drag-and-drop and
click-to-move both work, there's a move list, a captured-pieces tray, and a notification system.
What's missing is the layer that makes it *feel* like a chess app — sound, per-move feedback,
a real piece set, a proper game-over flow — plus the structural pieces that online play and AI
will need (board orientation, turn gating, player identity).

Goal: finish the UI in one focused pass, deliberately including the foundations that websockets
and Stockfish integration will otherwise force a rework of later.

Three decisions already made:
- Per-move events (capture / castle / en passant / promotion) surface as a **subtle non-blocking
  corner ticker + sound**. The big center overlay is reserved for check / checkmate / draw.
- Pieces move from Unicode glyphs to a **hand-authored flat SVG set** (no license questions,
  swappable later).
- Scope is **foundations + polish**, stopping short of settings panels / themes / clocks.

---

## Phase 0 — Bugs to fix first

- [ ] **`undo()` corrupts `moveHistory`** — [useGameStore.ts:152](src/store/useGameStore.ts#L152)
      appends the new FEN instead of popping. Change to `state.moveHistory.slice(0, -1)`.
      `sanHistory` already pops correctly, so the two arrays currently diverge.
- [ ] **`undo()` wipes the last-move highlight** — it sets `lastMove: null`. Restore the
      *previous* move by reading the last entry of `chess.history({ verbose: true })` after
      the undo and setting `{ from, to }` from it (null when history is empty).
- [ ] **Notification overlay swallows board clicks** —
      [gameNotifications.tsx:39](src/components/notifications/gameNotifications.tsx#L39) is
      `absolute inset-0 z-50` with no `pointer-events-none`, so for the 5s a "Check!" is up,
      every click on the board only dismisses the toast. Add `pointer-events-none` to the
      wrapper and `pointer-events-auto` to the card.
- [ ] **Draws are silent** — the store computes `draw` + `drawReason`
      (`threefold` / `fiftyMove` / `insufficient`) at
      [useGameStore.ts:61-69](src/store/useGameStore.ts#L61-L69), but
      [useGameNotifications.ts](src/hooks/useGameNotifications.ts) never reads them. The board
      locks (`isGameOver` at [chessboard.tsx:367](src/components/chessboard/chessboard.tsx#L367))
      with no explanation. Fixed by the game-over card in Phase 4.
- [ ] **Fake-permanent notifications** — `duration: 999999` produces a progress bar with
      `animationDuration: 999999ms` that visibly never moves. Removed in Phase 4.
- [ ] **Stale comment** — sensor comment says 8px, code says
      `distance: 4` ([chessboard.tsx:320-323](src/components/chessboard/chessboard.tsx#L320-L323)).

---

## Phase 1 — Move-event plumbing (everything else depends on this)

The three `makeMove` call sites in `chessboard.tsx` (click, drag-end, promotion-select) all
**discard the return value**. Rather than wire sound/ticker into each call site, follow the
pattern `useGameNotifications` already uses: put the event in the store and let hooks react to
`positionVersion`.

- [ ] Add to `useGameStore`:
      ```ts
      type MoveEvent = {
        san: string;
        color: "w" | "b";
        piece: PieceSymbol;
        from: Square; to: Square;
        captured?: PieceSymbol;
        enPassant: boolean;
        castle: "k" | "q" | null;
        promotion?: PieceSymbol;
        check: boolean;
        checkmate: boolean;
      };
      lastMoveEvent: MoveEvent | null;
      ```
- [ ] Populate it inside `makeMove` from the chess.js `Move` object — it already exposes
      `isEnPassant()` (used today at [useGameStore.ts:134](src/store/useGameStore.ts#L134)),
      plus `isKingsideCastle()`, `isQueensideCastle()`, `isPromotion()`, `isCapture()`.
      Fall back to parsing `result.flags` (`k`/`q`/`e`/`c`/`p`) if any method is absent in 1.4.0.
      Set `lastMoveEvent: null` in `undo` / `reset` / `loadFEN` / `loadPGN`.
- [ ] Also add `checkSquare: Square | null` to `snapshot()` — scan `chess.board()` for the
      king of the side to move when `inCheck`. Needed for the check highlight in Phase 3.

Widening the `MoveResult` return type is unnecessary; nothing consumes it. Leave it, or drop it
to `boolean` — but `lastMoveEvent` is the source of truth.

---

## Phase 2 — Sound

- [ ] `src/lib/sounds.ts` — a small manifest-driven player. One lazily-created `HTMLAudioElement`
      per sample, `preload="auto"`, `play()` resets `currentTime` so rapid moves retrigger.
      Missing file = silent no-op, never a thrown error.
- [ ] `src/hooks/useMoveSounds.ts` — subscribes to `positionVersion`, reads `lastMoveEvent`,
      picks a sample by priority: `checkmate` > `check` > `promote` > `castle` > `capture` > `move`.
      Plus `gameEnd` for stalemate/draw and `illegal` for a rejected move.
      Mount it once, alongside `useGameNotifications` inside the board.
- [ ] `src/store/useSettingsStore.ts` — zustand + `persist` middleware, holding `muted`,
      `orientation`, `showCoordinates`. A mute toggle button next to Undo/Reset.
- [ ] Respect `prefers-reduced-motion` for animation only, not audio.

**Needs assets from you:** drop 8 files into `public/sounds/` —
`move.mp3`, `capture.mp3`, `castle.mp3`, `check.mp3`, `promote.mp3`, `checkmate.mp3`,
`gameEnd.mp3`, `illegal.mp3`. Any open-license set works (lichess ships CC0 samples). The code
degrades to silence for any that are missing, so this doesn't block the rest of the work.

No autoplay problem: sounds only fire after a move, which is always a user gesture.

---

## Phase 3 — Board visual upgrade

### Piece art
- [ ] `src/components/chessboard/pieces/` — hand-authored flat-silhouette SVG set, one component
      per type, driven by `currentColor` + a stroke so both colors read on both square shades.
- [ ] `PieceIcon` wrapper (`type`, `color`, `size`) as the single render point. Replaces
      `getPieceSymbol` in [draggablePiece.tsx](src/components/chessboard/draggablePiece.tsx),
      the `DragOverlay` ([chessboard.tsx:487-504](src/components/chessboard/chessboard.tsx#L487-L504)),
      [PlayerSection.tsx:84](src/components/sidebar/PlayerSection.tsx#L84), and
      `promotionModal.tsx`. Keep `getPieceSymbol` in [lib/utils.ts](src/lib/utils.ts) only if
      something still needs text.
- [ ] Pieces size to the measured `cell` value, so `text-5xl` in `draggablePiece.tsx` goes away
      and the board becomes size-independent.

### Geometry consolidation (prerequisite for board flip)
- [ ] `src/lib/boardGeometry.ts` — `idxToSquare`, `parseSquare`, `squareToXY`, `isPromotionMove`,
      each taking an `orientation: "w" | "b"`. The white-at-bottom assumption is currently
      duplicated in five places: `chessboard.tsx` (×4), `promotionModal.tsx` (`topRow`), and
      `toAlgebraic` in `lib/utils.ts`. Consolidate, then delete the duplicates.
- [ ] Wire `orientation` from `useSettingsStore` + a flip button. Local multiplayer gets an
      auto-flip option; online play will set it from the assigned color.

### Square rendering
- [ ] `DroppableSquare` currently stacks three highlight states onto one `after:` pseudo-element
      ([chessboard.tsx:426-440](src/components/chessboard/chessboard.tsx#L426-L440)), which is why
      last-move highlighting is suppressed when the square is also a legal target
      (`!isTarget && (isLastFrom || isLastTo)`). Change it to accept children and render explicit
      stacked overlay `<div>`s so states compose.
- [ ] Distinguish **capture targets** from quiet moves — a ring around the square edge vs. the
      centre dot. Add `legalMovesFrom(from): { to, capture, promotion }[]` to the store (chess.js
      verbose moves already carry this); keep `legalTargets` or replace it. Note en-passant
      targets land on an empty square, so occupancy checks won't work — use the move flags.
- [ ] **Check highlight** — radial red glow on `checkSquare`.
- [ ] **Coordinate labels** — a–h along the bottom rank, 1–8 up the left file, rendered inside
      the corner squares in the opposite square colour. Toggleable via settings.
- [ ] **Hover affordance** on squares that are legal targets.
- [ ] Drop `animate-blinking` from the legal-move dots — a pulsing dot on every legal square is
      distracting and no mainstream client does it. Static dot at ~`bg-black/20` reads better.
- [ ] Move board colours out of inline hex (`#f0d9b5` / `#b58863`) into `@theme` tokens in
      [globals.css](src/app/globals.css) alongside `--color-pawnstorm-blue`.

### Responsive
- [ ] Board is a hardcoded `w-128` (512px). Switch to
      `w-[min(92vw,32rem)]` / a `clamp()` — the `ResizeObserver` in `useBoardRect` already
      recomputes piece positions, so this works once pieces stop using a fixed font size.
- [ ] There is **not a single responsive breakpoint anywhere in `src/`**. The nav is a fixed
      `w-40 h-screen` and all three page sections hardcode `ml-40`. Add a mobile nav (collapsed
      bar / drawer) and make the offset `md:ml-40`.
- [ ] `chessboardWrapper.tsx` stacks sidebar-under-board via `flex-wrap` alone; give it an
      explicit `flex-col lg:flex-row` and let the sidebar go full-width below the board on narrow
      screens.

---

## Phase 4 — Notifications & game flow

### Split transient from terminal
- [ ] **`GameOverCard`** (new) — persistent, driven directly by store flags
      (`checkmate` / `stalemate` / `draw` + `drawReason`), *not* the notification store. Shows the
      result, the reason in plain English ("Draw by threefold repetition", "Draw by the
      fifty-move rule", "Draw by insufficient material"), and **New Game** / **Take back last
      move** buttons. This retires the `duration: 999999` hack.
- [ ] **`useNotificationStore`** keeps only transient toasts. Extend `NotificationType` and add a
      matching `typeStyles` entry for each — an unmapped type currently renders `undefined` into
      the className ([gameNotifications.tsx:47](src/components/notifications/gameNotifications.tsx#L47)).
      Consider making `typeStyles` a `Record<NotificationType, string>` so TypeScript catches this.
- [ ] Shrink the "Check!" toast — `text-5xl` centred over the board is heavy for something that
      fires many times a game. Smaller card, ~2s, non-blocking.

### The move ticker
- [ ] **`MoveTicker`** (new) — small pill in a board corner, driven by `lastMoveEvent`,
      fades after ~1.5s, `pointer-events-none`, never blocks the board:
      - capture → `♜ ×` with the captured piece glyph/icon
      - en passant → `e.p.`
      - castle → `O-O` / `O-O-O`
      - promotion → `=♕`
      - quiet moves → nothing (sound only)
- [ ] Queue behaviour: a new event replaces the current pill immediately (no stacking) — the
      notification store's single-slot model is right here, just reuse the idea locally.

### Sidebar & controls
- [ ] **Move list** ([MoveHistory.tsx](src/components/sidebar/MoveHistory.tsx)) — rows are inert
      `<span>`s today. Highlight the current ply, make rows `<button>`s that jump to that position
      (replay via `moveHistory` FENs into `loadFEN`, keeping the live `chess` instance intact —
      this needs a `viewPly` state separate from the real game state so browsing doesn't destroy
      the game). Keep the existing auto-scroll effect. Also remove the
      `{/* placeholder for grid setup */}` empty span at line 43.
- [ ] **Undo / Reset** ([undoResetButtons.tsx](src/components/chessboard/undoResetButtons.tsx))
      — disable Undo when `sanHistory.length === 0`, disable Reset on a fresh board, and confirm
      before Reset discards a game in progress.
- [ ] `PIECE_VALUES` / `sumValue` live in
      [PlayerSection.tsx:5-15](src/components/sidebar/PlayerSection.tsx#L5-L15) — move to
      `src/lib/pieceValues.ts`; the AI work will want them too.
- [ ] The inactive-player label uses `ml-4` to fake the space left by the missing turn dot
      ([PlayerSection.tsx:62](src/components/sidebar/PlayerSection.tsx#L62)) — render the dot
      always and toggle its opacity instead, so the label never shifts.
- [ ] Captured pieces use `-ml-2 first-of-type:ml-0`, but the type groups are flattened into one
      flex row, so the overlap bleeds across group boundaries. Wrap each group in its own flex
      container.

---

## Phase 5 — Multiplayer / AI foundations

These are cheap now and expensive to retrofit.

- [ ] **Player identity** — `"Player 1"` / `"Player 2"` are hardcoded in
      [GameSidebar.tsx:18,30](src/components/sidebar/GameSidebar.tsx#L18) and again as column
      headers in `MoveHistory`. Add to the game store:
      ```ts
      players: {
        w: { name: string; type: "human" | "ai" | "remote" },
        b: { name: string; type: "human" | "ai" | "remote" },
      }
      ```
      Sidebar and move-list headers read from it. Local multiplayer seeds both as `human`.
- [ ] **Turn gating** — `readOnly` exists but nothing ever sets it
      ([useGameStore.ts:103](src/store/useGameStore.ts#L103)). Replace the raw flag with a
      `canInteract()` selector: `!isGameOver && players[turn].type === "human"`. `chessboard.tsx`
      already threads `readOnly` into `DraggablePiece.disabled` and `onSquareMouseDown` — swap
      the source. This is the single hook AI and remote turns both need.
- [ ] **Orientation** already handled in Phase 3 — online play sets it from the assigned colour.

Explicitly *not* in this pass: the websocket transport, Stockfish itself, clocks, persistence of
game state, PGN/FEN import-export UI (`loadFEN` / `loadPGN` exist in the store but are unreachable
from the UI — leave them).

---

## Phase 6 — Accessibility & cleanup

### Accessibility
Currently a `grep` for `aria-|role=|tabIndex|onKeyDown|sr-only|focus:` across `src/` returns
three `alt=` attributes and nothing else.

- [ ] **64 unlabelled buttons** — `DroppableSquare` renders a bare `<button>` with no accessible
      name ([droppableSquare.tsx:16](src/components/chessboard/droppableSquare.tsx#L16)). Add
      `aria-label={"e4, white pawn"}` / `"e4, empty"`.
- [ ] **Keyboard is completely dead** — selection is wired to `onMouseDown`
      ([draggablePiece.tsx:63](src/components/chessboard/draggablePiece.tsx#L63),
      [chessboard.tsx:459](src/components/chessboard/chessboard.tsx#L459)), and only
      `PointerSensor` is registered. Add `onKeyDown` (Enter/Space to select and move) and
      register dnd-kit's `KeyboardSensor`.
- [ ] `focus-visible` ring on squares, pieces, and buttons.
- [ ] `role="status"` + `aria-live="polite"` on notifications and the ticker; `aria-live="assertive"`
      on the game-over card.
- [ ] `PromotionModal` — add `role="dialog"`, `aria-modal`, Escape to cancel, focus trap, and
      focus restore. Cancelling currently drops the move silently with no feedback.
- [ ] `prefers-reduced-motion` — skip the 180ms FLIP in
      [chessboard.tsx:205-241](src/components/chessboard/chessboard.tsx#L205-L241) and neutralise
      the `blinking` / `notificationIn` / `capturedPieceIn` animations.
- [ ] `<h1>` on the play pages; `aria-current` on nav links; the three game-mode cards in
      [play/page.tsx](src/app/play/page.tsx) pass `imgAlt: ""` on meaningful imagery.

### Dead code
- [ ] `src/components/capturedPieces/` — entire directory, superseded by `sidebar/` in commit
      `e7d2ecb`. Still contains two `console.log`s in `capturedSection.tsx`.
- [ ] `src/store/useUIStore.ts` — `dragSource` is never read; the board keeps drag state locally.
- [ ] `createInitialBoard` in [src/lib/board.ts](src/lib/board.ts) — pre-chess.js vestige, unimported.
- [ ] `toAlgebraic` in [src/lib/utils.ts:17](src/lib/utils.ts#L17) — superseded by
      `boardGeometry.ts`.
- [ ] The **outer empty `DndContext`** wrapping the whole app in
      [clientProvider.tsx](src/components/clientProvider/clientProvider.tsx) — leftover from
      react-dnd; the board nests its own inside it.
- [ ] Commented-out `<GameNotifications />` in
      [play/local-multiplayer/page.tsx](src/app/play/local-multiplayer/page.tsx), the commented
      `isLegal` import at [chessboard.tsx:72](src/components/chessboard/chessboard.tsx#L72), the
      commented `--color-pawnstorm-blue` alternate and unused `--color-pawnstorm-gold-hov` in
      `globals.css`.
- [ ] Filename casing is split — `sidebar/GameSidebar.tsx`, `PlayerSection.tsx`,
      `MoveHistory.tsx` are PascalCase; everything else in the repo is camelCase. Pick one.

### Tests (optional but cheap)
There are no tests of any kind. Add `vitest` and cover the store only — `makeMove` /
`undo` round-trips, captured-piece accounting, `lastMoveEvent` flags for castle / en passant /
promotion, and draw-reason classification. These are pure functions over chess.js and would have
caught the `moveHistory` bug.

---

## Suggested order

1. Phase 0 (bugs) + Phase 1 (`lastMoveEvent`) — small, unblocks everything.
2. Phase 3 geometry consolidation + `PieceIcon` — the largest visual win.
3. Phase 2 sound + Phase 4 ticker — both consume `lastMoveEvent`.
4. Phase 4 game-over card + sidebar polish.
5. Phase 3 responsive + Phase 5 foundations.
6. Phase 6 a11y + cleanup.

Phases 2 and 4's ticker can land the same day once Phase 1 exists.

---

## Asset brief (source these before implementation)

Self-contained spec so this can be handed to a separate session.

### Sounds → `public/sounds/`

Eight files, `.mp3` (or `.webm` — update the manifest in `src/lib/sounds.ts` to match). Short:
40–200ms each except `gameEnd`. Normalise loudness across the set so `capture` doesn't
dwarf `move`. Mono is fine.

| File | Fires when | Character |
|---|---|---|
| `move.mp3` | any quiet move | soft wood click, the most-heard sound — keep it understated |
| `capture.mp3` | any capture, incl. en passant | sharper/heavier than `move` |
| `castle.mp3` | kingside or queenside | double-click, two pieces landing |
| `check.mp3` | move delivers check | short alert tone, distinct from capture |
| `promote.mp3` | pawn promotes | brighter, rising |
| `checkmate.mp3` | game ends in mate | decisive, longer |
| `gameEnd.mp3` | stalemate or draw | neutral, non-triumphant |
| `illegal.mp3` | rejected move attempt | dull thud, quiet — fires on user error |

Lichess ships a CC0 set (their "standard" theme) that maps almost 1:1 to this list and is the
path of least resistance. Any open-license set works. **Missing files are a silent no-op**, so
partial delivery is fine — implementation isn't blocked on this.

### Piece art → `public/pieces/<set>/`

Two viable routes; pick one.

**Route A — source a standard set (recommended if sourcing anyway).** Twelve SVGs, named
`wK wQ wR wB wN wP bK bQ bR bB bN bP` (`.svg`). Requirements:
- Square `viewBox` (`0 0 45 45` is the cburnett convention) so they scale to any cell size.
- Transparent background, no baked-in square colour.
- Both colours must read against **both** `#f0d9b5` and `#b58863` — white pieces need a dark
  outline stroke, black pieces a light one. This is the specific failure of the current Unicode
  glyphs, so check it explicitly.
- **Record the license.** cburnett is CC-BY-SA 3.0 and needs attribution somewhere in the app;
  merida and alpha have their own terms. Note whichever applies in the repo.

**Route B — hand-authored flat set.** No sourcing, no license question, written as inline React
components. Flat silhouettes rather than Staunton line art. This was the original plan and remains
the fallback if Route A stalls.

Either way everything renders through one `PieceIcon` component, so switching sets later is a
one-file change.

### Not needed
No board textures, backgrounds, avatars, or icon fonts. Board squares stay flat colour tokens,
and UI icons (mute, flip) can be inline SVG written during implementation.

---

## Verification

No test framework exists, so verification is manual against `pnpm dev` (Next 15 + turbopack) at
`/play/local-multiplayer`, plus `pnpm lint` and `pnpm build` clean.

Scenarios to walk through:

1. **Move events** — play `1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.O-O` and confirm castle sound + `O-O`
   ticker; capture something and confirm capture sound, ticker pill, and the captured tray.
2. **En passant** — `1.e4 d5 2.e5 f5 3.exf6` → en-passant sound + `e.p.` pill, and the pawn
   disappears from the correct square.
3. **Promotion** — walk a pawn to the last rank, confirm the modal traps focus, Escape cancels
   cleanly, and selecting a piece fires the promote sound + `=♕` pill.
4. **Check** — deliver check, confirm the king square glows, the toast is small and
   **does not block clicking the board**, and the check sound fires.
5. **Checkmate** — Scholar's mate. Confirm the persistent game-over card, working New Game and
   Take-back buttons, and that the board locks.
6. **Draws** — load a threefold/insufficient-material position via `loadFEN` from the console and
   confirm the game-over card names the correct reason.
7. **Undo** — make five moves including a capture, undo all five, confirm `moveHistory` and
   `sanHistory` stay the same length (this is the Phase 0 bug), the captured tray empties
   correctly, and the last-move highlight tracks backwards.
8. **Flip** — flip the board mid-game and confirm click-to-move, drag-and-drop, coordinate
   labels, the promotion modal, and the last-move highlight all follow the new orientation.
9. **Responsive** — 375px / 768px / 1440px. Board scales, pieces stay centred, no horizontal
   page scroll, sidebar reflows.
10. **Keyboard only** — tab to a piece, Enter to select, arrow/tab to a target, Enter to move.
11. **Reduced motion** — enable it at the OS level and confirm no FLIP, no blinking, no scale-in.
