/*
 * Chess piece geometry from the lichess "mono" piece set.
 * Copyright (C) the Lichess authors — https://github.com/lichess-org/lila
 * Licensed under the GNU General Public License, version 2 or later (GPLv2+).
 * Full text: ../../../../LICENSE-GPL-2.0.txt   Attribution: ../../../../NOTICE.md
 *
 * MODIFICATIONS (per GPL section 2): the original single-color paths were
 * extracted and their fill/stroke split so `PieceIcon` renders them in two
 * layers — a `currentColor` body plus a contrasting outline — so both colors
 * read on both square shades. The path data itself is unchanged.
 */
import type { CSSProperties } from "react";
import { PIECE_GLYPHS } from "./glyphs";
import { CODE_TO_TYPE, type PieceCode, type PieceColor, type PieceType } from "./types";

const PALETTE: Record<PieceColor, { fill: string; outline: string }> = {
  white: { fill: "#f7f7f4", outline: "#3a3a3a" },
  black: { fill: "#2b2b2b", outline: "#eaeae4" },
};

const NATIVE_SW = 1.5;   // mono's own stroke width
const OUTLINE_HALO = 1.9; // extra width each side for the contrasting outline

export interface PieceIconProps {
  type: PieceType | PieceCode;
  color?: PieceColor | "w" | "b";
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
  const t: PieceType =
    type.length === 1 ? CODE_TO_TYPE[type as PieceCode] : (type as PieceType);
  const c: PieceColor | undefined = color
    ? color === "w" ? "white" : color === "b" ? "black" : (color as PieceColor)
    : undefined;
  const bodyFill = fill ?? (c ? PALETTE[c].fill : "currentColor");
  const strokeCol = outlineColor ?? (c ? PALETTE[c].outline : "#3a3a3a");
  const g = PIECE_GLYPHS[t];
  const dims = size != null ? { width: size, height: size } : { width: "100%", height: "100%" };

  return (
    <svg
      viewBox="0 0 45 45" role="img"
      aria-label={title ?? `${c ?? ""} ${t}`.trim()}
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
