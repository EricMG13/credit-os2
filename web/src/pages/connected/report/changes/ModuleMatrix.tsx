import { ChevronDown } from "@untitledui/icons";
import { Fragment, useState } from "react";
import { StatusShape, type Shape } from "@/components/status/shapes";
import { cx } from "@/utils/cx";
import { moduleName, UNNAMED_MODULE } from "../../api";
import { containsReference, readParagraph } from "../../publishedReport";
import { words } from "./model";
import type { PublishedChanges } from "../../publishedReport";
import { PublishedSource } from "../PublishedTrace";
import type { Tone } from "../ToneMark";
import { statusColumn, type StatusColumn } from "./model";

const COLUMNS: { key: StatusColumn; label: string; shape: Shape; tint: string }[] = [
  { key: "unchanged", label: "Unchanged", shape: "ring", tint: "text-text-secondary" },
  { key: "revised", label: "Revised", shape: "half-filled circle", tint: "text-text-primary" },
  { key: "new", label: "New", shape: "filled circle", tint: "text-text-primary" },
  { key: "missing", label: "Missing", shape: "dashed ring", tint: "text-gap-text" },
];

/**
 * The direction the comparison itself states for a revised conclusion. "Reversed" names no
 * direction, so it takes none.
 */
const DIRECTION: Record<string, Exclude<Tone, "flat">> = {
  Strengthened: "better",
  Weakened: "worse",
};
/** The same shapes the measure list gives better and worse, in ink: the comparison's own word, not the owner's table, says the direction. */
const DIRECTION_MARK = {
  better: { shape: "filled circle" },
  worse: { shape: "diamond" },
} as const satisfies Record<string, { shape: Shape }>;

/**
 * The module's name as the rest of the report writes it. The pack's own title is used only for a
 * module the page has no name for, and never when that title is itself a module code.
 */
function nameOf(module: string, title: string) {
  const name = moduleName(module);
  if (name !== UNNAMED_MODULE) return name;
  return title.trim() && !/^CP-[A-Z0-9]+$/i.test(title.trim()) ? title : UNNAMED_MODULE;
}

function side(ran: boolean, bottomLine: string | null) {
  if (bottomLine == null) return ran ? "Not stated" : "Did not run";
  const { body } = readParagraph(bottomLine);
  return containsReference(body)
    ? "See the module's output in Evidence."
    : words(body) || "Not stated";
}

/** Module × status; each row opens to the earlier and the current conclusion. One list, no second copy. */
export function ModuleMatrix({
  change,
  source,
}: {
  change: PublishedChanges;
  source: (module: string) => string | undefined;
}) {
  const modules = change.pack?.modules ?? [];
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (module: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(module)) next.add(module);
      return next;
    });
  };
  return (
    <table className="w-full border-collapse text-small">
      <caption className="sr-only">Module conclusions against the earlier run</caption>
      <thead>
        <tr className="text-left text-caption text-text-tertiary">
          <th scope="col" className="pb-2 font-normal">
            Module
          </th>
          {COLUMNS.map(({ key, label }) => (
            <th
              key={key}
              scope="col"
              className="hidden w-[4.25rem] pb-2 text-center font-normal sm:table-cell"
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {modules.map((item) => {
          const verdict = change.verdicts?.modules?.[item.module];
          const status = verdict?.status ?? "";
          const column = statusColumn(status);
          const shown = COLUMNS.find((col) => col.key === column);
          const href = source(item.module);
          const said: [string, string | undefined][] = [
            ["Cause", verdict?.cause],
            ["Why", verdict?.why],
          ];
          const stated = said.flatMap(([name, value]) =>
            value && value.trim() ? [{ name, value }] : [],
          );
          const explanation = stated.filter(({ value }) => !containsReference(value));
          const cited = stated.length > explanation.length;
          const statusText =
            status || (stated.length > 0 ? "Status not stated" : "Explanation not stated");
          const direction = Object.hasOwn(DIRECTION, status) ? DIRECTION[status] : undefined;
          const panel = `matrix-${item.module}`;
          const title = nameOf(item.module, item.title);
          return (
            <Fragment key={item.module}>
              <tr className="border-t border-border-hairline">
                <th scope="row" className="py-1 pr-2 text-left font-normal">
                  <button
                    type="button"
                    aria-expanded={open.has(item.module)}
                    aria-controls={panel}
                    className="flex min-h-8 w-full cursor-pointer items-start gap-2 rounded-ds-sm text-left focus-visible:ring-2 focus-visible:ring-focus max-[480px]:min-h-11"
                    onClick={() => {
                      toggle(item.module);
                    }}
                  >
                    <ChevronDown
                      aria-hidden="true"
                      className={cx(
                        "mt-0.5 size-4 flex-none text-text-tertiary",
                        !open.has(item.module) && "-rotate-90",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block text-text-primary">{title}</span>
                      <span className="flex items-center gap-1.5 text-caption text-text-secondary">
                        {shown && (
                          <span className={cx("inline-flex sm:hidden", shown.tint)}>
                            <StatusShape shape={shown.shape} />
                          </span>
                        )}
                        {direction ? (
                          <span
                            data-direction={direction}
                            className={cx(
                              "inline-flex items-center gap-1 font-medium text-text-primary",
                            )}
                          >
                            <StatusShape shape={DIRECTION_MARK[direction].shape} />
                            {statusText}
                          </span>
                        ) : (
                          statusText
                        )}
                      </span>
                    </span>
                  </button>
                </th>
                {COLUMNS.map((col) => (
                  <td key={col.key} className="hidden text-center sm:table-cell">
                    {col.key === column ? (
                      <span className={cx("inline-flex", col.tint)}>
                        <StatusShape shape={col.shape} />
                        <span className="sr-only">{col.label}</span>
                      </span>
                    ) : null}
                  </td>
                ))}
              </tr>
              <tr id={panel} hidden={!open.has(item.module)}>
                <td colSpan={5} className="pb-3 pl-6">
                  <div className="grid gap-3 rounded-ds-sm bg-surface-subtle p-3">
                    <div>
                      <h4 className="text-caption text-text-tertiary">Earlier</h4>
                      <p className="reading-copy text-small">
                        {side(item.ran_prior, item.prior_bottom_line)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-caption text-text-tertiary">Current</h4>
                      <p className="reading-copy text-small">
                        {side(item.ran_current, item.current_bottom_line)}
                      </p>
                    </div>
                    {explanation.length > 0 && (
                      <p className="reading-copy text-small text-text-secondary">
                        {explanation
                          .map(({ name, value }) => `${name}: ${words(value)}`)
                          .join(" · ")}
                      </p>
                    )}
                    {cited && (
                      <a
                        className="inline-flex min-h-8 items-center text-text-link text-small underline underline-offset-2 max-[480px]:min-h-11"
                        href={href ?? "#evidence/trace/CP-8"}
                      >
                        Read the explanation in Evidence
                      </a>
                    )}
                    {href && (
                      <PublishedSource href={href} name={title}>
                        Analysis comparison row
                      </PublishedSource>
                    )}
                  </div>
                </td>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
