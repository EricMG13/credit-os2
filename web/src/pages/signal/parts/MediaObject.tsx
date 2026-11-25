// After sources/hui/media-1.html: a media tile on the left, the content beside it, aligned to the
// top. The tile is 80px as the mock draws it (mock question 10); it holds the publication's monogram,
// or the publication's logo where the page has one (parts/SourceLogo.tsx), in the same tile.
// Below 768px the page region is a phone's width, so the tile is 48px and the text keeps the room.
import type { ReactNode } from "react";
import type { LogoOf } from "../logos";
import { SourceLogo } from "./SourceLogo";

export function MediaObject({
  tile,
  source,
  children,
}: {
  tile: string;
  /** The source the tile stands for, where it is one (a digest's tile is not). */
  source?: LogoOf;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 md:gap-4">
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-ds-sm bg-surface-subtle font-display text-h4 text-text-secondary md:size-20 md:text-h2"
      >
        <SourceLogo source={source} inset="p-2 md:p-3">
          {tile}
        </SourceLogo>
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
