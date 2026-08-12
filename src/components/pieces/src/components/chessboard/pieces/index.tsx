import { PieceIcon, type PieceIconProps } from "./PieceIcon";
export { PieceIcon } from "./PieceIcon";
export type { PieceIconProps } from "./PieceIcon";
export { PIECE_GLYPHS } from "./glyphs";
export type { Glyph } from "./glyphs";
export { CODE_TO_TYPE, type PieceCode, type PieceColor, type PieceType } from "./types";

type Variant = Omit<PieceIconProps, "type">;
export const KingPiece = (p: Variant) => <PieceIcon type="king" {...p} />;
export const QueenPiece = (p: Variant) => <PieceIcon type="queen" {...p} />;
export const RookPiece = (p: Variant) => <PieceIcon type="rook" {...p} />;
export const BishopPiece = (p: Variant) => <PieceIcon type="bishop" {...p} />;
export const KnightPiece = (p: Variant) => <PieceIcon type="knight" {...p} />;
export const PawnPiece = (p: Variant) => <PieceIcon type="pawn" {...p} />;
