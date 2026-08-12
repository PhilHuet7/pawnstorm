# Mono chess pieces — drop-in `PieceIcon`

The lichess **mono** set (GPLv2+ — see `NOTICE.md`) wired into a single render
point, with a `currentColor` body and a contrasting outline so both colors read
on both square shades.

## Install
Copy `src/components/chessboard/pieces/` into your project. Keep `NOTICE.md`
and `LICENSE-GPL-2.0.txt` in the project (repo root or next to the pieces).

## Use
```tsx
import { PieceIcon } from "@/components/chessboard/pieces";
<PieceIcon type="knight" color="white" size={cell} />   // full names
<PieceIcon type="n" color="w" size={cell} />            // chess.js codes
<PieceIcon type="queen" color="black" size={64} outline={false} /> // mono native
```
Props: `type` (name or k/q/r/b/n/p), `color` (white/black or w/b, omit to use
CSS `color`), `size` (px), `outline` (default true), `fill`, `outlineColor`.
Palette + outline thickness live at the top of `PieceIcon.tsx`.

## Wiring (replaces getPieceSymbol)
- `draggablePiece.tsx`: `<PieceIcon type={piece.type} color={piece.color} size={cell} />` (drop `text-5xl`)
- `chessboard.tsx` DragOverlay, `PlayerSection.tsx`, `promotionModal.tsx`: same swap.

`svg/` holds pre-rendered white/black SVGs (outlined) plus the unmodified mono
originals in `svg/mono-original/`.
