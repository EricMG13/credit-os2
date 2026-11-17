import { useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  Flag01,
  InfoCircle,
  LayersThree01,
  List,
  RefreshCw01,
  SearchLg,
} from "@untitledui/icons";
import { Button, Link } from "react-aria-components";
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

/**
 * The module page's navigator (N3): a search at the top, then one vertical menu in two groups. The
 * first moves to a section of this page without changing the address; the second links every
 * module of the run, each with its state shape and word. The search narrows the second group by
 * plain module name, in memory. Sticky from the wide layout, where it scrolls by itself when long.
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
  const sectionsLabel = useId();
  const modulesLabel = useId();
  const [search, setSearch] = useState("");
  const menu = useRef<HTMLElement>(null);
  const wanted = search.trim().toLowerCase();
  const listed = modules.filter((module) => module.name.toLowerCase().includes(wanted));
  useEffect(() => {
    const align = () => {
      const nav = menu.current;
      const entry = nav?.querySelector('[aria-current="page"]');
      if (nav === null || entry === null || entry === undefined) return;
      const view = nav.getBoundingClientRect();
      const item = entry.getBoundingClientRect();
      if (view.height === 0 || item.height === 0) return;
      const bottom = Math.min(view.bottom, window.innerHeight);
      const top = Math.max(view.top, 0);
      if (item.bottom > bottom) nav.scrollTop += item.bottom - bottom;
      else if (item.top < top) nav.scrollTop -= top - item.top;
    };
    align();
    window.addEventListener("resize", align);
    return () => {
      window.removeEventListener("resize", align);
    };
  }, [current, wanted]);
  const heading = "px-4 pt-3 pb-1 pl-4.75 text-caption font-medium text-text-tertiary";
  return (
    <nav
      ref={menu}
      aria-label="Modules and sections"
      className={cx(
        "flex flex-col min-[1001px]:sticky min-[1001px]:top-6 min-[1001px]:max-h-[calc(100vh-3rem)] min-[1001px]:overflow-y-auto",
        className,
      )}
    >
      <div className="px-4 pt-1 pb-2">
        <Input icon={SearchLg} placeholder="Search modules" value={search} onChange={setSearch} />
      </div>
      <div
        data-compact-navigation
        className="hidden flex-col gap-3 px-4 pb-3 min-[481px]:flex min-[1001px]:hidden"
      >
        <Select
          label="Module"
          value={listed.some((module) => module.id === current) ? current : null}
          placeholder="Choose a module"
          onChange={(key) => {
            const id = String(key);
            window.location.hash = hrefFor?.(id) ?? modulesHref(issuer, run, id);
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
      {listed.length === 0 ? (
        <p className="px-4 py-2 text-small text-text-tertiary">No module matches</p>
      ) : null}
      <div className="contents min-[481px]:max-[1001px]:hidden">
        {sections.length === 0 ? null : (
          <>
            <span id={sectionsLabel} className={heading}>
              On this page
            </span>
            <ul aria-labelledby={sectionsLabel}>
              {sections.map((section) => {
                const Icon = ICON[section.icon];
                return (
                  <li key={section.key}>
                    <Button
                      aria-current={section.key === active ? "location" : undefined}
                      onPress={() => {
                        onSection(section.key);
                      }}
                      className={cx(ENTRY, "py-3", section.key === active && CURRENT)}
                    >
                      <Icon aria-hidden="true" className="size-5 flex-none opacity-75" />
                      {section.label}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <span id={modulesLabel} className={cx(heading, sections.length > 0 && "mt-4")}>
          Modules in this run
        </span>
        {listed.length === 0 ? null : (
          <ul aria-labelledby={modulesLabel}>
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
        )}
      </div>
    </nav>
  );
}
