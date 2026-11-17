import { useRef, type ReactNode } from "react";
import { BookOpen01, Cube01, Grid01, PlayCircle, Signal01 } from "@untitledui/icons";
import { NavButton } from "@/components/application/app-navigation/base-components/nav-button";

export type Area = "library" | "model" | "run" | "signal" | "kit";

const ITEMS = [
  { area: "library", label: "Library", href: "#/", icon: BookOpen01 },
  { area: "model", label: "Model", href: "#/model", icon: Cube01 },
  { area: "run", label: "Run", href: "#/run", icon: PlayCircle },
  { area: "signal", label: "Signal", href: "#/signal", icon: Signal01 },
  { area: "kit", label: "Kit", href: "#/kit", icon: Grid01 },
] as const;

/** The slim icon rail and the page region on the canvas. */
export function Shell({
  current,
  bleed = false,
  sections,
  symbol = "./symbol.svg",
  children,
}: {
  current: Area | null;
  bleed?: boolean;
  sections?: readonly { area: Area; href: string; label?: string }[];
  symbol?: string;
  children: ReactNode;
}) {
  const items =
    sections === undefined
      ? ITEMS
      : ITEMS.flatMap((item) => {
          const section = sections.find((entry) => entry.area === item.area);
          return section ? [{ ...item, href: section.href, label: section.label ?? item.label }] : [];
        });
  const main = useRef<HTMLElement>(null);
  return (
    <div className="flex h-screen min-h-0 flex-col bg-surface-canvas text-text-primary min-[768px]:flex-row">
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
      <aside className="order-last flex h-16 w-full shrink-0 px-1 pt-1 min-[768px]:order-first min-[768px]:h-full min-[768px]:w-[68px] min-[768px]:py-1 min-[768px]:pl-1">
        <div className="flex h-full w-full flex-row items-center rounded-xl bg-primary px-2 py-1 ring-1 ring-secondary ring-inset min-[768px]:w-auto min-[768px]:flex-col min-[768px]:items-stretch min-[768px]:px-0 min-[768px]:py-0 min-[768px]:pt-5">
          <div className="flex shrink-0 justify-center px-2 min-[768px]:px-3">
            <img src={symbol} alt="" width="24" height="24" className="size-6" />
          </div>
          <nav aria-label="Areas" className="flex min-h-0 min-w-0 flex-1 flex-col">
            <ul className="flex min-h-0 flex-1 items-center justify-around gap-0.5 px-1 min-[768px]:mt-5 min-[768px]:flex-col min-[768px]:items-stretch min-[768px]:justify-start min-[768px]:px-3.5">
              {items.map((item) => (
                <li
                  key={item.area}
                  className="relative flex min-w-0 flex-1 flex-col items-center min-[768px]:flex-none"
                >
                  {item.area === current && (
                    <span
                      aria-hidden="true"
                      data-current-area
                      className="absolute top-1 bottom-1 left-0 border-l-2 border-action min-[768px]:-left-2"
                    />
                  )}
                  <NavButton
                    current={item.area === current}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                  />
                  <span className="max-w-full truncate text-xs text-fg-quaternary min-[768px]:hidden">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
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
