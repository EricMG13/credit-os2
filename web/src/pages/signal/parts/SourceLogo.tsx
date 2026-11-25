// A source's logo inside the tile that otherwise holds its letters. The tile keeps its own size
// and shape, so nothing moves when a logo arrives: the image fills the tile on a white well
// (icons are drawn for a light ground), kept whole (`object-contain`). The letters are drawn while
// the logo is on its way, when there is none, and when the image itself cannot be drawn. The
// image is decoration: the source's name is beside it, so it has no text of its own.
import { useState, type ReactNode } from "react";
import { cx } from "@/utils/cx";
import { useLogo, type LogoOf } from "../logos";

export function SourceLogo({
  source,
  inset,
  children,
}: {
  /** Which source the tile is of; absent or with no logo, the letters are drawn. */
  source: LogoOf | null | undefined;
  /** The room left round the image inside the tile, as a padding class. */
  inset: string;
  /** The letters, drawn in the logo's place. */
  children: ReactNode;
}) {
  const { url, broken: report } = useLogo(source);
  // The address that could not be drawn: a later one (another source in this tile) is tried afresh.
  const [broken, setBroken] = useState<string | null>(null);
  if (url === null || url === broken) return children;
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => {
        setBroken(url);
        report();
      }}
      className={cx("size-full bg-surface-card object-contain", inset)}
    />
  );
}
