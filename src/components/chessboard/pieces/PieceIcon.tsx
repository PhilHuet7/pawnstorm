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

const NATIVE_SW = 1.5;   // mono's own stroke width
const OUTLINE_HALO = 1.9; // extra width each side for the contrasting outline

export interface PieceIconProps {
  /** Long name ("knight") or chess.js code ("n"). */
  type: PieceName | PieceType;
  /** Long name ("black") or chess.js code ("b"). Omit to inherit CSS `color`. */
  color?: PieceShade | PieceColor;
  size?: number;
  outline?: boolean;      // contrasting halo; default true
  fill?: string;
  outlineColor?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function PieceIcon({
  type, color, size, outline = true, fill, outlineColor, className, style, title,
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
        <g fill="var(--po)" stroke="var(--po)" strokeWidth={NATIVE_SW + 2 * OUTLINE_HALO}
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
