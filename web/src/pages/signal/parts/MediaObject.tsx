// After sources/hui/media-1.html: a media tile on the left, the content beside it, aligned to the
// top. The tile is 80px as the mock draws it (mock question 10); it holds the publication's monogram.
// Below 768px the page region is a phone's width, so the tile is 48px and the text keeps the room.
import type { ReactNode } from "react";

export function MediaObject({ tile, children }: { tile: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 md:gap-4">
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-ds-sm bg-surface-subtle font-display text-h4 text-text-secondary md:size-20 md:text-h2"
      >
        {tile}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
