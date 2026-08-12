# Chess piece art — attribution & license

The chess piece shapes in `src/components/chessboard/pieces/glyphs.tsx` and the
files in `svg/` are the **"mono"** piece set from the Lichess project (lila).

- Copyright (C) the Lichess authors
- Source: https://github.com/lichess-org/lila (`public/piece/mono`)
- License: **GNU General Public License, version 2 or later (GPLv2+)** — full
  text in `LICENSE-GPL-2.0.txt`.
- Modifications: the original single-color paths were split into a two-layer
  render (a `currentColor` body plus a contrasting outline) in `PieceIcon.tsx`.
  The path data itself is unchanged. The unmodified originals are kept in
  `svg/mono-original/` for reference.

## What GPLv2+ requires of you
Keep this notice and `LICENSE-GPL-2.0.txt` in your project alongside these
files, and make the source of the piece art available to anyone you distribute
it to (for a web app the served SVG *is* its source, so this is already
satisfied). **No on-page/footer credit is required.**

Everything else in this folder that is not the piece geometry (the wrapper
component, types, build glue) is your own code under your own license.
