// After sources/uui/avatar.tsx (the group of overlapping avatars) and avatar-count.tsx (the last
// tile carries a "+N" count). The monograms and the "+N" arrive as the strings to show; where the
// sources behind the monograms are named too (one per monogram, in order), each avatar draws its
// source's logo in the letters' place when the page has one.
import type { LogoOf } from "../logos";
import { Avatar } from "./Avatar";

export function AvatarGroup({
  monograms,
  more,
  sources = null,
}: {
  monograms: string[];
  more: string | null;
  sources?: readonly LogoOf[] | null;
}) {
  const shown = more === null ? monograms : [...monograms, more];
  return (
    <span className="inline-flex" aria-hidden="true">
      {shown.map((text, index) => (
        <span
          key={`${String(index)}-${text}`}
          className={
            index === 0
              ? "rounded-ds-full ring-2 ring-surface-card"
              : "-ml-1 rounded-ds-full ring-2 ring-surface-card"
          }
        >
          {/* The "+N" tile, after the monograms, is no source's. */}
          <Avatar
            size="xs"
            initials={text}
            source={index < monograms.length ? sources?.[index] : undefined}
          />
        </span>
      ))}
    </span>
  );
}
