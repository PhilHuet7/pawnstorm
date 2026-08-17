/*
 * Chess piece geometry from the lichess "mono" piece set.
 * Copyright (C) the Lichess authors — https://github.com/lichess-org/lila
 * Licensed under the GNU General Public License, version 2 or later (GPLv2+).
 * Full text: ./LICENSE-GPL-2.0.txt   Attribution: ./NOTICE.md
 *
 * MODIFICATIONS (per GPL section 2): the original single-color paths were
 * extracted and their fill/stroke split so `PieceIcon` renders them in two
 * layers — a `currentColor` body plus a contrasting outline — so both colors
 * read on both square shades. The path data itself is unchanged.
 */
import type { CSSProperties } from "react";
import { PIECE_GLYPHS } from "./glyphs";
import {
  CODE_TO_NAME,
  COLOR_TO_SHADE,
  type PieceColor,
  type PieceName,
  type PieceShade,
  type PieceType,
} from "@/types/chess";

const PALETTE: Record<PieceShade, { fill: string; outline: string }> = {
  white: { fill: "#f7f7f4", outline: "#3a3a3a" },
  black: { fill: "#2b2b2b", outline: "#eaeae4" },
};

const NATIVE_SW = 1.5; // mono's own stroke width
/**
 * Extra stroke width per side for the contrasting halo, in viewBox units, so it
 * scales with `size`. 1.9 reads as a heavy sticker outline; 0.9 just defines the
 * edge. Drop toward 0.6 for a subtler line.
 */
const OUTLINE_HALO = 0.9;

export interface PieceIconProps {
  /** Long name ("knight") or chess.js code ("n"). */
  type: PieceName | PieceType;
  /** Long name ("black") or chess.js code ("b"). Omit to inherit CSS `color`. */
  color?: PieceShade | PieceColor;
  size?: number;
  /**
   * Add a contrasting halo around the piece. Off by default — that is the mono
   * set's native look. Turn it on wherever a piece sits on a surface close to
   * its own colour: the board (white pieces on light squares), the promotion
   * picker (white on white), or the navy sidebar (black on navy).
   */
  outline?: boolean;
  /** Halo thickness in viewBox units. Ignored unless `outline` is set. */
  outlineWidth?: number;
  fill?: string;
  outlineColor?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function PieceIcon({
  type,
  color,
  size,
  outline = false,
  outlineWidth = OUTLINE_HALO,
  fill,
  outlineColor,
  className,
  style,
  title,
}: PieceIconProps) {
  const name: PieceName =
    type.length === 1 ? CODE_TO_NAME[type as PieceType] : (type as PieceName);
  const shade: PieceShade | undefined = color
    ? color.length === 1
      ? COLOR_TO_SHADE[color as PieceColor]
      : (color as PieceShade)
    : undefined;
  const bodyFill = fill ?? (shade ? PALETTE[shade].fill : "currentColor");
  const strokeCol = outlineColor ?? (shade ? PALETTE[shade].outline : "#3a3a3a");
  const g = PIECE_GLYPHS[name];
  const dims = size != null ? { width: size, height: size } : { width: "100%", height: "100%" };

  return (
    <svg
      viewBox="0 0 45 45" role="img"
      aria-label={title ?? `${shade ?? ""} ${name}`.trim()}
      width={dims.width} height={dims.height} className={className}
      style={{ color: bodyFill, ["--po" as string]: strokeCol, display: "block", ...style }}
    >
      {title ? <title>{title}</title> : null}
      {outline ? (
        <g fill="var(--po)" stroke="var(--po)" strokeWidth={NATIVE_SW + 2 * outlineWidth}
           strokeLinecap="round" strokeLinejoin="round" fillRule={g.fillRule}>
          {g.inner}
        </g>
      ) : null}
      <g fill="currentColor" stroke="currentColor" strokeWidth={NATIVE_SW}
         strokeLinecap="round" strokeLinejoin="round" fillRule={g.fillRule}>
        {g.inner}
      </g>
    </svg>
  );
}

export default PieceIcon;
