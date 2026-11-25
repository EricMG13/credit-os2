import type { ReactNode } from "react";
import { Tile } from "./Tile";

/** A figure tile: the Overview's small head with the tile's one trace, then what it measures. */
export function FigureTile({
  span,
  title,
  basis,
  trace,
  children,
}: {
  span: 3 | 4 | 5 | 8;
  title: string;
  basis: string;
  trace: ReactNode;
  children: ReactNode;
}) {
  return (
    // A tile takes its content's height: no stretched tile with an empty interior.
    <Tile span={span} label={title} head="small" title={title} trace={trace} className="self-start">
      <p className="pointer-events-none -mt-3 text-caption font-normal text-text-tertiary">
        {basis}
      </p>
      {children}
    </Tile>
  );
}
