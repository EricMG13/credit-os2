import type { ReactNode } from "react";
import { Tile } from "./Tile";

/** A figure tile: the Overview's small head with the tile's one trace, then what it measures. */
export function FigureTile({
  span,
  title,
  basis,
  trace,
  fit = false,
  children,
}: {
  /** The tile ends under its own content instead of sharing the row's height. */
  fit?: boolean;
  span: 3 | 4 | 5 | 8;
  title: string;
  basis: string;
  trace: ReactNode;
  children: ReactNode;
}) {
  return (
    // The tiles of a row share its height, a figure's notes at the foot (`mt-auto`), where their
    // contents are near in height. Where one tile is far taller (`fit`), the others end under
    // their own notes: a short figure is not stretched over a dead band.
    <Tile
      span={span}
      label={title}
      head="small"
      title={title}
      trace={trace}
      className={fit ? "self-start" : undefined}
    >
      <p className="pointer-events-none -mt-3 text-caption font-normal text-text-tertiary">
        {basis}
      </p>
      {children}
    </Tile>
  );
}
