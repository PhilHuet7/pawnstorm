# Pawnstorm — UI completion plan

> **Status — ready to execute.** All assets are in the repo (commit `bff686d`) and every open
> decision is resolved. Nothing is blocked on external input.
>
> **How to work through this:** in small, individually reviewable steps. Phil wants to read every
> line as it lands so he holds the context himself — take one checklist item (or one tightly
> related group) at a time, explain the change, and stop for review before moving on. Do not
> batch a whole phase into a single sweep.
>
> **Progress:** step 0 (relocation + type consolidation) and Phase 0 are ✅ done — except the
> two items explicitly deferred to Phase 4 (draw notifications, the `duration: 999999` hack).
> Phase 1 (`lastMoveEvent`) is next.
>
> A copy of this document lives at `docs/UI_PLAN.md`; re-copy it whenever this file changes.

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
- Pieces move from Unicode glyphs to the **lichess "mono" silhouette set** (GPLv2+), rendered
  through a single `PieceIcon` with a contrasting outline halo.
- Scope is **foundations + polish**, stopping short of settings panels / themes / clocks.

Resolved during asset delivery:
- **Checkmate audio is a two-part sequence** — `checkmate.mp3` (lightning crack) on the mating
  move, with `gameEnd.mp3` (rolling thunder) queued behind it. The sound layer therefore needs a
  small follow-up mechanism, not just fire-and-forget.
- **`illegal.mp3` fires only on a drag released over a non-legal square.** Clicking a non-target
  square while a piece is selected stays silent — that is ordinary deselection, and beeping at it
  would get irritating.

---

## Phase 0 — Bugs to fix first

- [x] **`undo()` corrupts `moveHistory`** — appended the new FEN instead of popping. Now
      `state.moveHistory.slice(0, -1)`, restoring the invariant
      `moveHistory.length === sanHistory.length + 1`.
- [x] **`undo()` wipes the last-move highlight** — set `lastMove: null`. Now re-points at
      `chess.history({ verbose: true }).at(-1)`, so the highlight walks backwards with the
      undos and clears only at the start position. Verified against chess.js directly.
- [x] **Notification overlay swallows board clicks** —
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
- [x] **Stale comment** — sensor comment said 8px, code says `distance: 4`. Comment corrected.

**Found while fixing undo — blocks Phase 4's jump-to-ply:** `loadPGN` sets
`moveHistory: [ns.fen]` (length 1) while filling `sanHistory` with the full game
([useGameStore.ts:202-209](src/store/useGameStore.ts#L202-L209)), so the two arrays are
inconsistent immediately after a PGN load and `undo()` would drain `moveHistory` past empty.
Harmless today — nothing reads `moveHistory`, and `loadPGN` is unreachable from the UI — but
Phase 4 replays positions from that array. Fix by rebuilding the FEN trail during load: replay
`chess.history()` into a scratch `Chess` and collect a FEN per ply.

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
      Missing file = silent no-op, never a thrown error. Needs a `playThen(a, b, delayMs)` for the
      checkmate sequence, and must cancel a pending follow-up on reset/undo so thunder doesn't
      roll in over a board that has already moved on.
- [ ] `src/hooks/useMoveSounds.ts` — subscribes to `positionVersion`, reads `lastMoveEvent`,
      mounted once alongside `useGameNotifications`. Resolution order:

      | Condition | Sound |
      |---|---|
      | checkmate | `checkmate` → `gameEnd` (~0.4s later) |
      | stalemate / threefold / fifty-move / insufficient | `draw` |
      | move gives check | `check` |
      | promotion | `promote` |
      | castle (either side) | `castle` |
      | capture, incl. en passant | `capture` |
      | anything else | `move` |

      Only the first match fires — a capture that also gives check plays `check`, not both.
- [ ] `illegal` is **not** part of that chain. It fires from `handleDragEnd` in `chessboard.tsx`
      when `over` exists but is not in `targets` — the one moment the player expressed intent and
      currently gets nothing back. A drag released off-board (`over == null`) stays silent.
- [ ] `src/store/useSettingsStore.ts` — zustand + `persist` middleware, holding `muted`,
      `orientation`, `showCoordinates`. A mute toggle button next to Undo/Reset.
- [ ] Respect `prefers-reduced-motion` for animation only, not audio.

Loudness is already mastered per the set's README — gameplay clicks peak near -1.4 dBFS,
`checkmate`/`gameEnd` around -12 LUFS, `draw` softer at -16 LUFS. Do not add per-sound gain
without a reason; the balance is deliberate.

No autoplay problem: sounds only fire after a move, which is always a user gesture.

---

## Phase 3 — Board visual upgrade

### Piece art
`PieceIcon` is **already written** and delivered — this phase is wiring, not authoring.

- [ ] Relocate the pack first (see *Asset inventory*), then verify it type-checks in isolation.
- [ ] `PieceIcon` (`type`, `color`, `size`, `outline`) as the single render point. Replaces
      `getPieceSymbol` in [draggablePiece.tsx](src/components/chessboard/draggablePiece.tsx),
      the `DragOverlay` ([chessboard.tsx:487-504](src/components/chessboard/chessboard.tsx#L487-L504)),
      [PlayerSection.tsx:84](src/components/sidebar/PlayerSection.tsx#L84), and
      `promotionModal.tsx`. Keep `getPieceSymbol` in [lib/utils.ts](src/lib/utils.ts) only if
      something still needs text.
- [ ] Pieces size to the measured `cell` value, so `text-5xl` in `draggablePiece.tsx` goes away
      and the board becomes size-independent. `PieceIcon` accepts `size` in px and falls back to
      `100%` when omitted — passing `cell` directly is the intended usage.
- [ ] `PieceIcon` takes chess.js codes (`"n"`, `"w"`) as well as full names, so `PieceVM` values
      pass straight through with no mapping layer. ✅ `PieceVM` was tightened during step 0, so
      this now type-checks. Remaining: the `as PieceType` cast at
      [chessboard.tsx:466](src/components/chessboard/chessboard.tsx#L466) is redundant once
      `getPieceSymbol` is replaced — delete it with the swap.
- [ ] Note it renders its own `role="img"` + `aria-label` from `type`/`color`. That is the
      accessible name for pieces — so in Phase 6, label the *square*, not the piece, or the two
      will fight. Pass `title` when a more specific label is wanted.
- [ ] Sidebar captured pieces currently render at `text-[1.4rem]`; give `PieceIcon` an explicit
      px `size` there instead, and drop the `outline` halo at that scale if it muddies.

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
- [ ] In [types/chess.ts](src/types/chess.ts): `Coord` and `BoardSquare` have zero usages outside
      the types file, and `Piece.hasMoved` is a pre-chess.js leftover read only by the dead
      `createInitialBoard` — chess.js tracks castling rights itself. Drop all three.
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
- [ ] The only lint warning in the repo: an unused `eslint-disable` for
      `@typescript-eslint/no-unused-expressions` at
      [chessboard.tsx:225](src/components/chessboard/chessboard.tsx#L225), guarding the
      forced-layout `el.getBoundingClientRect()` in the FLIP effect. The rule no longer fires;
      delete the directive. (Pre-existing, unrelated to the piece relocation.)

### Tests (optional but cheap)
There are no tests of any kind. Add `vitest` and cover the store only — `makeMove` /
`undo` round-trips, captured-piece accounting, `lastMoveEvent` flags for castle / en passant /
promotion, and draw-reason classification. These are pure functions over chess.js and would have
caught the `moveHistory` bug.

---

## Suggested order

0. Relocate the piece pack + re-sync `docs/UI_PLAN.md` — mechanical, no logic.
1. Phase 0 (bugs) + Phase 1 (`lastMoveEvent`) — small, unblocks everything.
2. Phase 3 geometry consolidation + `PieceIcon` wiring — the largest visual win.
3. Phase 2 sound + Phase 4 ticker — both consume `lastMoveEvent`.
4. Phase 4 game-over card + sidebar polish.
5. Phase 3 responsive + Phase 5 foundations.
6. Phase 6 a11y + cleanup.

Phases 2 and 4's ticker can land the same day once Phase 1 exists.

---

## Asset inventory (delivered — commit `bff686d`)

### Sounds — `public/sounds/` ✅
Nine files, not the eight originally specced. `gameEnd` was re-purposed and `draw` added:

| File | Fires when |
|---|---|
| `move.mp3` | any quiet move — wooden knock |
| `capture.mp3` | any capture, incl. en passant — two-piece clack |
| `castle.mp3` | either side — two quick knocks |
| `check.mp3` | move delivers check — knock + ascending blips |
| `promote.mp3` | pawn promotes — knock + rising arpeggio |
| `illegal.mp3` | drag released on a non-legal square — two-beep error |
| `checkmate.mp3` | the mating move — lightning crack |
| `gameEnd.mp3` | queued ~0.4s behind `checkmate` — rolling thunder, 5s |
| `draw.mp3` | stalemate / threefold / fifty-move / insufficient — rain, 5s |

`public/sounds/README.txt` documents the mastering. Note its closing line: move/capture, the
storm one-shots and the error beep are derived from recordings Phil supplied — worth confirming
those sources are cleared before the project goes public.

### Piece art — currently `src/components/pieces/` ⚠️ needs relocating
The lichess **mono** set, **GPLv2+**, arrived as a self-contained pack that preserved its intended
destination path inside itself. First implementation step is to unpack it:

```
src/components/pieces/src/components/chessboard/pieces/{PieceIcon,glyphs,index}.tsx, types.ts
                                    ↓  git mv
src/components/chessboard/pieces/
```
Target layout (decided):

```
THIRD-PARTY-NOTICES.md              ← new, short; points at the pieces NOTICE
docs/piece-set-preview.png          ← moved out of src/
src/types/chess.ts                  ← absorbed the pack's types.ts
src/components/chessboard/pieces/
├── PieceIcon.tsx  glyphs.tsx  index.tsx
├── NOTICE.md  LICENSE-GPL-2.0.txt
└── svg/  (incl. mono-original/)
```

The pack shipped its own `types.ts` declaring `PieceType = "king" | ...` and
`PieceColor = "white" | "black"` — the **same names as `@/types/chess` with opposite meanings**
(codes there, long names here). Resolved by folding it into `src/types/chess.ts` and renaming to
`PieceName` / `PieceShade`, so all piece vocabulary sits in one file under three labelled
sections (Codes / Names / Board) with the contrast visible at a glance. The pack's third
redeclaration of the code union (`PieceCode`) is gone — `CODE_TO_NAME` is keyed by `PieceType`,
leaving one declaration in the repo. Also added `COLOR_TO_SHADE`.

`PieceVM` was tightened at the same time: `type: string` → `PieceType`, and an inline
`"w" | "b"` → `PieceColor`. Compiles with no other file changed — the field was simply typed
wider than what `createBoardFromFEN` produces.

`index.tsx` is trimmed to re-exports; its six `KingPiece`/`QueenPiece`/… convenience components
were unused and always would be, since pieces render dynamically by type.

- Use `git mv` throughout so history follows the files.
- **Fix the relative license paths** in the header comments of `PieceIcon.tsx` and `glyphs.tsx` —
  both point at `../../../../LICENSE-GPL-2.0.txt`, which breaks on the move. They become
  `./LICENSE-GPL-2.0.txt` and `./NOTICE.md`.
- Keep `svg/` including `svg/mono-original/` — `NOTICE.md` cites it as the unmodified source,
  which is what makes the "only the fill/stroke layering changed" claim verifiable. Unused at
  runtime (`glyphs.tsx` has the paths inline), but cheap and it backs the notice.
- Delete the pack's `README.md` — its wiring notes are captured in Phase 3 above, and
  `PieceIcon.tsx` is 70 typed lines that document themselves.
- Then delete the empty `src/components/pieces/` shell.
- `THIRD-PARTY-NOTICES.md` at root: a few lines naming the mono set, GPLv2+, and the path to the
  full notice. Deliberately **not** a root `LICENSE-GPL-2.0.txt` — see the license note below.

The pack is complete and correct: all six glyphs, `PieceIcon`, `types.ts`, a barrel `index.tsx`
with per-piece convenience components, and a two-layer render (body + contrasting halo) that the
preview confirms reads on both square shades.

**License note:** the mono geometry is GPLv2+; `NOTICE.md` scopes the copyleft to the art alone
and leaves the surrounding app under its own terms — the standard aggregation position, and a
reasonable one for art assets.

Keeping `LICENSE-GPL-2.0.txt` **beside the art rather than at the repo root** is deliberate: a
bare GPL file at root makes GitHub label the entire project GPL-2.0, which would misrepresent the
codebase and close off options if Pawnstorm ever goes commercial. The root
`THIRD-PARTY-NOTICES.md` gives the same visibility without that side effect. The pack's own
README endorses either placement.

Pawnstorm itself has no license file yet. Worth adding one at some point so the root isn't
ambiguous — not part of this plan.

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
5. **Checkmate** — Scholar's mate. Confirm the crack lands on the mating move with thunder
   rolling in behind it, the persistent game-over card, working New Game and Take-back buttons,
   and that the board locks.
6. **Thunder cancellation** — deliver mate, then hit New Game during the 5s thunder. The pending
   follow-up must not fire over the fresh board.
7. **Draws** — load a threefold/insufficient-material position via `loadFEN` from the console and
   confirm `draw.mp3` (rain, not thunder) plays and the game-over card names the correct reason.
8. **Illegal drag** — drag a knight onto an occupied friendly square and release: error beep,
   piece snaps back. Then drag one clean off the board edge and release: silent, no beep.
7. **Undo** — make five moves including a capture, undo all five, confirm `moveHistory` and
   `sanHistory` stay the same length (this is the Phase 0 bug), the captured tray empties
   correctly, and the last-move highlight tracks backwards.
8. **Flip** — flip the board mid-game and confirm click-to-move, drag-and-drop, coordinate
   labels, the promotion modal, and the last-move highlight all follow the new orientation.
9. **Responsive** — 375px / 768px / 1440px. Board scales, pieces stay centred, no horizontal
   page scroll, sidebar reflows.
10. **Keyboard only** — tab to a piece, Enter to select, arrow/tab to a target, Enter to move.
11. **Reduced motion** — enable it at the OS level and confirm no FLIP, no blinking, no scale-in.
