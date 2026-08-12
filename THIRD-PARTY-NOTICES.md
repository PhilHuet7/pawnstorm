# Third-party notices

Pawnstorm bundles the following third-party material. Everything else in this
repository is Pawnstorm's own code under its own terms.

## Chess piece art — lichess "mono" set

- **Where:** `src/components/chessboard/pieces/` (path geometry in `glyphs.tsx`,
  reference SVGs in `svg/`, unmodified originals in `svg/mono-original/`)
- **Copyright:** the Lichess authors
- **Source:** https://github.com/lichess-org/lila (`public/piece/mono`)
- **License:** GNU General Public License, version 2 or later (GPLv2+)
- **Full text and attribution:**
  [`src/components/chessboard/pieces/LICENSE-GPL-2.0.txt`](src/components/chessboard/pieces/LICENSE-GPL-2.0.txt)
  and [`src/components/chessboard/pieces/NOTICE.md`](src/components/chessboard/pieces/NOTICE.md)

The GPL applies to the piece geometry only. The `PieceIcon` wrapper, types, and
surrounding application code are Pawnstorm's own.

## Sound effects — `public/sounds/`

Derived from source recordings supplied by the project owner. See
[`public/sounds/README.txt`](public/sounds/README.txt) for the per-file breakdown
and mastering notes.
