import { useEffect, useId, useRef, useState, type RefObject } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Flag01,
  InfoCircle,
  LayersThree01,
  List,
  RefreshCw01,
  SearchLg,
} from "@untitledui/icons";
import { Button, Link } from "react-aria-components";
import { stageLabel } from "@/pages/connected/report/stageNumber";
import { byStage } from "@/pages/connected/report/stages";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { STATUS_SETS } from "@/components/status/sets";
import { StatusShape } from "@/components/status/shapes";
import { cx } from "@/utils/cx";
import type { ModuleState } from "../slice";
import { modulesHref } from "./links";

/** The shape's colour, as the mock's `m-ok`, `m-gap` and `m-neu` set it. */
const MARK: Record<ModuleState, string> = {
  Delivered: "text-success-mark",
  "Delivered with gaps": "text-gap-text",
  "Not assessable": "text-text-tertiary",
  "Not run": "text-text-tertiary",
};

/** The look of one entry: the vertical menu's row, with the current one marked on its left edge. */
const ENTRY =
  "flex w-full cursor-pointer items-center gap-2 border-l-[3px] border-transparent px-4 text-left text-small font-medium text-text-tertiary outline-hidden hover:bg-surface-subtle hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset";
const NAV_HEADING =
  "shrink-0 px-4 pt-3 pb-1 pl-4.75 text-caption font-medium text-text-tertiary min-[1001px]:pt-1 min-[1001px]:leading-4";
const CURRENT = "border-action bg-surface-selected text-action hover:bg-surface-selected";

/** The icon of each section a delivered module can have, in the mock's 20px slot. */
const ICON = {
  "bottom-line": Flag01,
  findings: List,
  contrary: AlertTriangle,
  "change-view": RefreshCw01,
  records: LayersThree01,
  limitations: InfoCircle,
} as const;

/** One entry: `key` addresses its target on the page, `icon` names one of the section icons. */
export type NavSection = { key: string; label: string; icon: keyof typeof ICON };
export type NavModule = { id: string; name: string; state: ModuleState };

function alignCurrentEntry(list: HTMLUListElement | null, height: number): void {
  if (!list || height <= 0) return;
  const entry = list.querySelector('[aria-current="page"]');
  if (entry === null) return;
  const bounds = list.getBoundingClientRect();
  const item = entry.getBoundingClientRect();
  if (item.height === 0) return;
  const bottom = Math.min(bounds.bottom, window.innerHeight);
  const top = Math.max(bounds.top, 0);
  if (item.bottom > bottom) list.scrollTop += item.bottom - bottom;
  else if (item.top < top) list.scrollTop -= top - item.top;
}

function alignMenu(nav: HTMLElement | null, list: HTMLUListElement | null): void {
  if (nav === null) return;
  if (window.innerWidth < 1001) {
    nav.style.maxHeight = "";
    return;
  }
  const view = nav.getBoundingClientRect();
  if (view.height === 0) return;
  const height = window.innerHeight - Math.max(view.top, 24) - 24;
  nav.style.maxHeight = height > 0 ? `${String(height)}px` : "";
  alignCurrentEntry(list, height);
}

function alignOnWindowScroll(
  event: Event,
  nav: HTMLElement | null,
  list: HTMLUListElement | null,
): void {
  if (event.target instanceof Node && nav?.contains(event.target)) return;
  alignMenu(nav, list);
}

function useMenuAlignment(
  menu: RefObject<HTMLElement | null>,
  results: RefObject<HTMLUListElement | null>,
  current: string,
  wanted: string,
): void {
  useEffect(() => {
    const align = () => {
      alignMenu(menu.current, results.current);
    };
    const onScroll = (event: Event) => {
      alignOnWindowScroll(event, menu.current, results.current);
    };
    align();
    window.addEventListener("resize", align);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", align);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [current, menu, results, wanted]);
}

type NavigationProps = {
  issuer: string;
  run: string;
  sections: readonly NavSection[];
  active: string | null;
  onSection: (key: string) => void;
  listed: readonly NavModule[];
  current: string;
  hrefFor?: (module: string) => string;
};

function CompactNavigation({
  issuer,
  run,
  sections,
  active,
  onSection,
  listed,
  current,
  hrefFor,
}: NavigationProps) {
  const modulePath = (id: string) => hrefFor?.(id) ?? modulesHref(issuer, run, id);
  return (
    <div
      data-compact-navigation
      className="hidden flex-col gap-3 px-4 pb-3 min-[481px]:flex min-[1001px]:hidden"
    >
      <Select
        label="Module"
        value={listed.some((module) => module.id === current) ? current : null}
        placeholder="Choose a module"
        onChange={(key) => {
          window.location.hash = modulePath(String(key));
        }}
      >
        {listed.map((module) => (
          <Select.Item
            key={module.id}
            id={module.id}
            label={module.name}
            value={{ id: module.id, label: module.name, supportingText: module.state }}
          />
        ))}
      </Select>
      {sections.length === 0 ? null : (
        <Select
          label="Page section"
          value={active}
          placeholder="Choose a section"
          onChange={(key) => {
            onSection(String(key));
          }}
        >
          {sections.map((section) => (
            <Select.Item
              key={section.key}
              id={section.key}
              label={section.label}
              value={{ id: section.key, label: section.label }}
            />
          ))}
        </Select>
      )}
    </div>
  );
}

function SectionLinks({
  sections,
  active,
  onSection,
  id,
}: Pick<NavigationProps, "sections" | "active" | "onSection"> & { id: string }) {
  if (sections.length === 0) return null;
  return (
    <>
      <span id={id} className={NAV_HEADING}>
        On this page
      </span>
      <ul aria-labelledby={id} className="min-[1001px]:min-h-9 min-[1001px]:overflow-y-auto">
        {sections.map((section) => {
          const Icon = ICON[section.icon];
          return (
            <li key={section.key}>
              <Button
                aria-current={section.key === active ? "location" : undefined}
                onPress={() => {
                  onSection(section.key);
                }}
                className={cx(ENTRY, "py-3 min-[1001px]:py-2", section.key === active && CURRENT)}
              >
                <Icon aria-hidden="true" className="size-5 flex-none opacity-75" />
                {section.label}
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function ModuleLinks({
  listed,
  issuer,
  run,
  current,
  hrefFor,
  labelId,
  results,
}: NavigationProps & { labelId: string; results: RefObject<HTMLUListElement | null> }) {
  if (listed.length === 0) return null;
  return (
    <ul
      ref={results}
      aria-labelledby={labelId}
      className="min-[1001px]:min-h-11 min-[1001px]:shrink-3 min-[1001px]:overflow-y-auto"
    >
      {listed.map((module) => (
        <li key={module.id}>
          <Link
            href={hrefFor?.(module.id) ?? modulesHref(issuer, run, module.id)}
            aria-label={`${module.name}, ${module.state}`}
            aria-current={module.id === current ? "page" : undefined}
            className={cx(ENTRY, "py-2", module.id === current && CURRENT)}
          >
            <span className={cx("mx-1 flex", MARK[module.state])}>
              <StatusShape shape={STATUS_SETS["Module state"][module.state].shape} />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span data-module-name>{module.name}</span>
              {module.state === "Delivered" ? null : (
                <small className="text-caption font-normal text-text-tertiary">
                  {module.state}
                </small>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function DesktopNavigation({
  results,
  ...props
}: NavigationProps & { results: RefObject<HTMLUListElement | null> }) {
  const sectionsLabel = useId();
  const modulesLabel = useId();
  return (
    <div className="contents min-[481px]:max-[1001px]:hidden">
      <SectionLinks {...props} id={sectionsLabel} />
      <span
        id={modulesLabel}
        className={cx(NAV_HEADING, props.sections.length > 0 && "mt-4 min-[1001px]:mt-2")}
      >
        Modules in this run
      </span>
      <ModuleLinks {...props} labelId={modulesLabel} results={results} />
    </div>
  );
}

/**
 * The module page's navigator (N3): a search at the top, then one vertical menu in two groups. The
 * first moves to a section of this page without changing the address; the second links every
 * module of the run, each with its state shape and word. The search narrows the second group by
 * plain module name, in memory. The wide navigator keeps search visible and scrolls each list
 * independently when space is limited.
 */
export function ModuleNav({
  issuer,
  run,
  sections,
  active,
  onSection,
  modules,
  current,
  hrefFor,
  className,
}: {
  issuer: string;
  run: string;
  sections: readonly NavSection[];
  active: string | null;
  onSection: (key: string) => void;
  modules: readonly NavModule[];
  current: string;
  hrefFor?: (module: string) => string;
  className?: string;
}) {
  const [search, setSearch] = useState("");
  const menu = useRef<HTMLElement>(null);
  const results = useRef<HTMLUListElement>(null);
  const wanted = search.trim().toLowerCase();
  const listed = modules.filter((module) => module.name.toLowerCase().includes(wanted));
  const props = { issuer, run, sections, active, onSection, listed, current, hrefFor };
  useMenuAlignment(menu, results, current, wanted);
  return (
    <nav
      ref={menu}
      aria-label="Modules and sections"
      className={cx(
        "flex flex-col min-[1001px]:sticky min-[1001px]:top-6 min-[1001px]:max-h-[calc(100vh-3rem)] min-[1001px]:overflow-y-auto",
        className,
      )}
    >
      <div className="shrink-0 px-4 pt-1 pb-2 min-[1001px]:pb-1">
        <Input
          aria-label="Search modules"
          icon={SearchLg}
          placeholder="Search modules"
          value={search}
          onChange={setSearch}
        />
      </div>
      <CompactNavigation {...props} />
      {listed.length === 0 ? (
        <p className="px-4 py-2 text-small text-text-tertiary">No module matches</p>
      ) : null}
      <DesktopNavigation {...props} results={results} />
    </nav>
  );
}

const STAGE_LINK =
  "flex min-h-8 w-full items-center gap-2 rounded-ds-md border border-transparent px-2 py-1 text-caption text-text-secondary outline-hidden hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-brand max-[480px]:min-h-11";
const STAGE_LINK_CURRENT =
  "border-action bg-surface-selected text-text-link hover:bg-surface-selected";
const DESKTOP = "(min-width: 1024px)";

function SlashCircle({ className }: { className?: string }) {
  return (
    <span className={cx("flex flex-none text-warning-mark", className)}>
      <StatusShape shape={STATUS_SETS["Module state"]["Not assessable"].shape} />
    </span>
  );
}

function StateMark({ state }: { state: ModuleState }) {
  if (state === "Not assessable") return <SlashCircle />;
  return (
    <span className={cx("flex flex-none", MARK[state])}>
      <StatusShape shape={STATUS_SETS["Module state"][state].shape} />
    </span>
  );
}

function StageLink({
  module,
  current,
  href,
}: {
  module: NavModule;
  current: boolean;
  href: string;
}) {
  const word = module.state === "Delivered" ? null : module.state;
  return (
    <a
      href={href}
      aria-label={`${module.name}, ${module.state}`}
      aria-current={current ? "page" : undefined}
      className={cx(STAGE_LINK, current && STAGE_LINK_CURRENT)}
    >
      <StateMark state={module.state} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium">{module.name}</span>
        {word === null ? null : (
          <small
            className={cx(
              "text-caption font-normal",
              module.state === "Not assessable" ? "text-warning-text" : "text-text-tertiary",
            )}
          >
            {word}
          </small>
        )}
      </span>
      <span className="font-mono text-caption text-text-tertiary">{module.id}</span>
    </a>
  );
}

type PageSection = { id: string; label: string };

function goToSection(id: string): void {
  const target = document.getElementById(id);
  target?.focus({ preventScroll: true });
  if (target && typeof target.scrollIntoView === "function")
    target.scrollIntoView({ block: "start" });
}

function SectionList({
  sections,
  onPressed,
}: {
  sections: readonly PageSection[];
  onPressed: () => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <ul aria-label="On this page" className="mt-0.5 mb-1 ml-5 flex flex-col">
      {sections.map((section) => (
        <li key={section.id}>
          <button
            type="button"
            aria-current={section.id === active ? "location" : undefined}
            onClick={() => {
              setActive(section.id);
              goToSection(section.id);
              onPressed();
            }}
            className={cx(
              "flex min-h-8 w-full cursor-pointer items-center rounded-ds-md px-2 text-left text-caption text-text-secondary outline-hidden hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-brand max-[480px]:min-h-11",
              section.id === active && "font-medium text-text-link",
            )}
          >
            {section.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

function StageGroups({
  modules,
  current,
  hrefFor,
  sections,
  onSection,
}: {
  modules: readonly NavModule[];
  current: string;
  hrefFor: (id: string) => string;
  sections: readonly PageSection[];
  onSection: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {byStage(modules).map((group) => (
        <div key={group.name} className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2 px-2">
            <span
              aria-hidden="true"
              className="font-mono text-caption text-text-tertiary tabular-nums"
            >
              {stageLabel(group.name)}
            </span>
            <h3 className="text-caption font-medium text-text-secondary">{group.name}</h3>
          </div>
          <ul>
            {group.rows.map((module) => (
              <li key={module.id}>
                <StageLink
                  module={module}
                  current={module.id === current}
                  href={hrefFor(module.id)}
                />
                {module.id === current && sections.length > 0 ? (
                  <SectionList sections={sections} onPressed={onSection} />
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Legend() {
  const item = "inline-flex items-center gap-1.5";
  return (
    <ul
      aria-label="Legend"
      className="mx-2 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border-subtle pt-2.5 text-caption text-text-secondary"
    >
      <li className={item}>
        <span aria-hidden="true" className={cx("flex", MARK.Delivered)}>
          <StatusShape shape={STATUS_SETS["Module state"].Delivered.shape} />
        </span>
        Delivered
      </li>
      <li className={item}>
        <span aria-hidden="true" className="flex">
          <SlashCircle />
        </span>
        Not assessable
      </li>
      <li className={item}>
        <span
          aria-hidden="true"
          className="h-2.5 w-3 rounded-ds-xs border border-action bg-surface-selected"
        />
        This page
      </li>
    </ul>
  );
}

function useDesktop(): boolean {
  const query = (): MediaQueryList | undefined =>
    typeof window.matchMedia === "function" ? window.matchMedia(DESKTOP) : undefined;
  const [desktop, setDesktop] = useState(() => query()?.matches ?? true);
  useEffect(() => {
    const list = query();
    if (!list) return;
    const sync = () => {
      setDesktop(list.matches);
    };
    list.addEventListener("change", sync);
    return () => {
      list.removeEventListener("change", sync);
    };
  }, []);
  return desktop;
}

/**
 * The connected module page's navigator: the run's modules grouped by stage, each link carrying
 * its state. Open at 1024px and wider; a closed disclosure below that.
 */
export function StageNav({
  modules,
  current,
  hrefFor,
  sections = [],
  className,
}: {
  modules: readonly NavModule[];
  current: string;
  hrefFor: (id: string) => string;
  sections?: readonly PageSection[];
  className?: string;
}) {
  const desktop = useDesktop();
  const [open, setOpen] = useState<boolean | null>(null);
  if (modules.length === 0) return null;
  const delivered = modules.filter((m) => m.state.startsWith("Delivered")).length;
  const blocked = modules.filter((m) => m.state === "Not assessable").length;
  const count = `${String(delivered)} of ${String(modules.length)} delivered`;
  return (
    <nav
      aria-label="Modules in this run"
      className={cx("rounded-ds-lg border border-border-subtle bg-surface-card p-3", className)}
    >
      <details
        open={desktop || (open ?? false)}
        onToggle={(event) => {
          if (!desktop) setOpen(event.currentTarget.open);
        }}
        className="group/nav"
      >
        <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 rounded-ds-sm px-2 text-small font-medium text-text-primary outline-focus-ring focus-visible:outline-2 max-[480px]:min-h-11 lg:hidden [&::-webkit-details-marker]:hidden">
          <span>Modules in this run · {count}</span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 flex-none text-text-tertiary transition-transform group-open/nav:rotate-180 motion-reduce:transition-none"
          />
        </summary>
        <div className="mt-3 flex flex-col gap-3 lg:mt-0">
          <header className="flex flex-col gap-0.5 px-2">
            <h2 className="text-small font-medium text-text-primary max-lg:hidden">Modules</h2>
            <p className="text-caption text-text-tertiary max-lg:hidden">{count}</p>
            {blocked > 0 ? (
              <p>
                <span className="inline-flex h-5 items-center gap-1 rounded-ds-xs border border-warning-edge bg-warning-fill px-1.5 text-caption font-medium text-warning-text">
                  <SlashCircle />
                  {String(blocked)} not assessable
                </span>
              </p>
            ) : null}
          </header>
          <StageGroups
            modules={modules}
            current={current}
            hrefFor={hrefFor}
            sections={sections}
            onSection={() => {
              if (!desktop) setOpen(false);
            }}
          />
          <Legend />
        </div>
      </details>
    </nav>
  );
}
