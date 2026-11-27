import { useRef, type ReactNode } from "react";
import { BarChartSquare02, BookOpen01, Cube01, PlayCircle, Signal01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

/** `kit` is a page of the shell with no bar item: #/kit is reached by its address only. */
export type Area = "library" | "coverage" | "model" | "run" | "signal" | "kit";

const ITEMS = [
  { area: "library", label: "Library", href: "#/", icon: BookOpen01 },
  { area: "model", label: "Model", href: "#/model", icon: Cube01 },
  { area: "run", label: "Run", href: "#/run", icon: PlayCircle },
  { area: "signal", label: "Signal", href: "#/signal", icon: Signal01 },
] as const;

/** Coverage is a page of the connected app only: it has a bar item where `sections` names it. */
const COVERAGE = { area: "coverage", label: "Coverage", href: "/coverage", icon: BarChartSquare02 };
const [LIBRARY, ...AFTER_LIBRARY] = ITEMS;

/**
 * The top bar (symbol, product name, areas, and the one primary action when the app has one) and
 * the page region on the canvas.
 */
export function Shell({
  current,
  bleed = false,
  sections,
  symbol = "./symbol.svg",
  action,
  account,
  children,
}: {
  current: Area | null;
  bleed?: boolean;
  sections?: readonly { area: Area; href: string; label?: string }[];
  symbol?: string;
  /** The bar's one primary action, at its end; it is a link, never an area, so never current. */
  action?: { href: string; label: string };
  /** Optional account control reserved for the explicitly configured sign-in runtime. */
  account?: ReactNode;
  children: ReactNode;
}) {
  const items =
    sections === undefined
      ? ITEMS
      : [LIBRARY, COVERAGE, ...AFTER_LIBRARY].flatMap((item) => {
          const section = sections.find((entry) => entry.area === item.area);
          return section
            ? [{ ...item, href: section.href, label: section.label ?? item.label }]
            : [];
        });
  const main = useRef<HTMLElement>(null);
  return (
    <div className="flex h-screen min-h-0 flex-col bg-surface-canvas text-text-primary">
      <a
        href="#main"
        // The app routes on the URL hash, so the link moves focus and leaves the hash alone.
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface-card focus:px-3 focus:py-2 focus:text-text-primary focus:outline-2 focus:outline-offset-2 focus:outline-focus-ring"
      >
        Skip to content
      </a>
      <header className="shrink-0 border-b border-border-hairline bg-surface-card">
        <div className="flex flex-wrap items-stretch gap-x-6 px-4 max-[480px]:gap-x-3 sm:px-8">
          <div className="flex min-h-14 shrink-0 items-center gap-2.5">
            <img src={symbol} alt="" width="22" height="22" className="size-[22px]" />
            <span className="text-small font-semibold tracking-[-0.01em] text-text-primary max-[480px]:sr-only">
              Credit OS
            </span>
          </div>
          <nav aria-label="Areas" className="flex min-w-0 flex-1">
            <ul className="flex min-w-0 flex-1 flex-wrap items-stretch gap-x-1">
              {items.map(({ area, label, href, icon: Icon }) => {
                const isCurrent = area === current;
                return (
                  <li key={area} className="relative flex min-h-14 shrink-0 items-center">
                    <a
                      href={href}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`flex min-h-9 items-center gap-2 rounded-ds-sm px-3 text-small font-medium outline-focus-ring max-[480px]:px-2 transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:min-h-11 max-[480px]:min-w-11 max-[480px]:justify-center ${
                        isCurrent
                          ? "bg-surface-selected text-text-link"
                          : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                      }`}
                    >
                      <Icon aria-hidden="true" className="size-4 shrink-0 max-[480px]:hidden" />
                      {label}
                    </a>
                    {isCurrent && (
                      <span
                        aria-hidden="true"
                        data-current-area
                        className="absolute inset-x-3 bottom-0 border-b-2 border-action"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
          {(action || account) && (
            <div className="flex min-h-14 shrink-0 items-center gap-2">
              {action && (
                <Button href={action.href} size="sm">
                  {action.label}
                </Button>
              )}
              {account}
            </div>
          )}
        </div>
      </header>
      <main
        id="main"
        ref={main}
        tabIndex={-1}
        className={`relative min-h-0 min-w-0 flex-1 overflow-y-auto focus:outline-none${bleed ? "" : " p-4 sm:p-8"}`}
      >
        {children}
      </main>
    </div>
  );
}
