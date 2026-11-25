// After sources/uui/avatar.tsx and avatar-label-group.tsx, reduced to what Signal draws: a round
// avatar with initials or a person icon, and the avatar with a title and a subtitle beside it.
import type { FC, ReactNode } from "react";
import { User01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { LogoOf } from "../logos";
import { SourceLogo } from "./SourceLogo";

const SIZES = {
  xs: { box: "size-6", initials: "text-caption", icon: "size-3" },
  sm: { box: "size-8", initials: "text-small", icon: "size-4" },
  md: { box: "size-10", initials: "text-body", icon: "size-5" },
} as const;

type AvatarProps = {
  size: keyof typeof SIZES;
  /** Without initials the avatar draws a person icon. */
  initials: string | null;
  /** The tinted form the mock gives the viewer's own avatar. */
  own?: boolean;
  /** The icon drawn when there are no initials (default: one person). */
  icon?: FC<{ className?: string }>;
  /** A source's avatar: its logo is drawn in the letters' place where the page has one. */
  source?: LogoOf;
};

/** Decoration: the name beside it carries the meaning, so it is hidden from the accessibility tree. */
export function Avatar({ size, initials, own = false, icon: Icon = User01, source }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-ds-full font-semibold ring-1 ring-border-subtle ring-inset",
        SIZES[size].box,
        own ? "bg-surface-selected text-text-link" : "bg-surface-subtle text-text-tertiary",
      )}
    >
      <SourceLogo source={source} inset="p-0.5">
        {initials === null ? (
          <Icon className={SIZES[size].icon} />
        ) : (
          <span className={SIZES[size].initials}>{initials}</span>
        )}
      </SourceLogo>
    </span>
  );
}

type AvatarLabelGroupProps = AvatarProps & { title: ReactNode; subtitle: ReactNode };

export function AvatarLabelGroup({ title, subtitle, ...avatar }: AvatarLabelGroupProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar {...avatar} />
      <div className="min-w-0 flex-1">
        <p className="text-small font-medium text-text-primary">{title}</p>
        <p className="text-caption font-normal text-text-tertiary">{subtitle}</p>
      </div>
    </div>
  );
}
