import type { ReactNode } from "react";
import { TextLink } from "../run/TextLink";

export const card =
  "flex flex-col gap-5 rounded-ds-lg border border-border-subtle bg-surface-card p-5 shadow-1 sm:p-8";
export const heading = "font-display text-h3 text-text-primary";
export const field =
  "w-full rounded-lg border border-border-hairline bg-surface-card px-3 py-2 text-text-primary aria-invalid:border-error-mark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
export const label = "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-text-primary";

export function Breadcrumb({
  children,
  href = "/",
  root = "Library",
}: {
  children: string;
  href?: string;
  root?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 text-sm text-text-tertiary">
      <TextLink href={href}>{root}</TextLink>
      {" / "}
      {children}
    </nav>
  );
}

export function ErrorNotice({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-border-hairline bg-surface-card p-3 text-sm text-error-primary"
    >
      {children}
    </div>
  );
}
