import { ArrowRight, ChevronDown, Table as TableIcon } from "@untitledui/icons";
import {
  createContext,
  useContext,
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Button } from "@/components/base/buttons/button";
import { Segmented } from "@/components/kit/Segmented";
import { cx } from "@/utils/cx";
import { moduleName } from "../../../api";
import { moduleSource } from "../../overview/figureData";
import { FigureNotes, FigureSourceControl, Key } from "../../overview/figureParts";
import { Bento, GapNote, Tile } from "../../overview/Tile";
import type { LeadProps } from "../types";
import { Legend, type LegendEntry } from "./marks/Legend";
import { useOverflows } from "./useWidth";

/** 32 px targets, 44 px at 480 px and below; the token focus ring. */
const TARGET =
  "min-h-8 max-[480px]:min-h-11 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * Where a lead's gap sends the reader: this module's own output in Evidence. The module page
 * provides it; a lead drawn without it (a test, another page) draws no such link.
 */
export const LeadEvidence = createContext<string | null>(null);

/** The one way on from a gap that has no trace of its own: the module's output in Evidence. */
export function GapWayOn() {
  const href = useContext(LeadEvidence);
  if (!href) return null;
  return (
    <Button
      href={href}
      color="link-gray"
      size="sm"
      iconTrailing={ArrowRight}
      className={cx(TARGET, "self-start")}
    >
      Open this module in Evidence
    </Button>
  );
}

/**
 * The one gap pattern of every lead: a tile titled as its figure would be, holding the gap note
 * (what is not known and why) in the figure's place, then the way to the module's output in
 * Evidence. Used wherever a readable module lacks a table.
 */
export function GapTile({
  span,
  label,
  kicker,
  className,
  children,
}: {
  span: ComponentProps<typeof Tile>["span"];
  label: string;
  /** The figure's subject, drawn as the tile's title. */
  kicker: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tile span={span} label={label} title={kicker} className={cx("self-start", className)}>
      <GapNote>{children}</GapNote>
      <GapWayOn />
    </Tile>
  );
}

/**
 * The bento a lead is drawn in. A blocked, absent or unreadable module draws nothing here: the
 * module frame states it in the header with the reason.
 */
export function LeadFrame({ props, children }: { props: LeadProps; children: ReactNode }) {
  const module = props.entry.output.module;
  const { reason } = moduleSource(props.view, module, moduleName(module, props.run.pathway));
  return reason ? null : <Bento>{children}</Bento>;
}

const NUMERIC = /^[−-]?[\d,]+(?:\.\d+)?[x%]?$/;

export type TableViewData = {
  caption: string;
  headers: string[];
  rows: string[][];
};

/** The open state of one table disclosure and the id its button controls. */
function useDisclosure() {
  const [open, setOpen] = useState(false);
  const id = `table-${useId().replace(/[^\w-]/g, "")}`;
  return {
    open,
    id,
    toggle: () => {
      setOpen((was) => !was);
    },
  };
}

type Disclosure = ReturnType<typeof useDisclosure>;

/** The button that opens a figure's table: a disclosure, with its marker turning when open. */
function TableButton({ disclosure, caption }: { disclosure: Disclosure; caption: string }) {
  return (
    <button
      type="button"
      aria-expanded={disclosure.open}
      aria-controls={disclosure.id}
      aria-label={`Table view: ${caption}`}
      onClick={disclosure.toggle}
      className={cx(
        TARGET,
        "inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-ds-sm border border-border-subtle bg-surface-card px-2.5 text-caption font-medium whitespace-nowrap text-text-secondary transition duration-100 ease-linear hover:bg-surface-subtle hover:text-text-primary max-[480px]:min-w-11 max-[480px]:justify-center max-[480px]:px-2",
      )}
    >
      <TableIcon aria-hidden="true" className="size-3.5 flex-none" />
      <span className="max-[480px]:sr-only">Table view</span>
      <ChevronDown
        aria-hidden="true"
        data-marker=""
        className={cx("size-3.5 flex-none transition-transform", disclosure.open && "rotate-180")}
      />
    </button>
  );
}

function Table({ caption, headers, rows }: TableViewData) {
  return (
    <table className="w-full min-w-max border-collapse text-caption">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th
              key={header}
              scope="col"
              className="border-b border-border-hairline px-2 py-1.5 text-left font-medium text-text-tertiary"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, at) => (
          <tr key={`${row[0] ?? ""}-${String(at)}`}>
            {row.map((cell, column) => (
              <td
                key={`${headers[column] ?? ""}-${String(column)}`}
                className={cx(
                  "border-b border-border-hairline px-2 py-1.5",
                  NUMERIC.test(cell) ? "text-right font-mono tabular-nums" : "text-left",
                )}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The box a wide table scrolls in. It is named, and a tab stop only while it actually overflows
 * (measured; never in jsdom), so a table that fits adds no inert stop.
 */
function TableScroll({ label, children }: { label: string; children: ReactNode }) {
  const [ref, overflows] = useOverflows();
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      // A scrolling box must be reachable by keyboard (WCAG 2.1.1, scrollable-region-focusable).
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={overflows ? 0 : undefined}
      data-overflows={overflows ? "" : undefined}
      className="max-w-full overflow-x-auto rounded-ds-xs outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {children}
    </div>
  );
}

/** The panel a table button opens: the real table under the figure, closed by default. */
function TablePanel({ disclosure, table }: { disclosure: Disclosure; table: TableViewData }) {
  return (
    <div
      id={disclosure.id}
      hidden={!disclosure.open}
      className="w-full min-w-0 text-small text-text-secondary"
    >
      <TableScroll label={`${table.caption}, table`}>
        <Table {...table} />
      </TableScroll>
    </div>
  );
}

/**
 * The figure's numbers as a real table, for a figure not drawn in a `FigureTile`: the same
 * button (aria-expanded, 32/44 px, token focus ring) with the panel opening under it.
 */
export function TableView(table: TableViewData) {
  const disclosure = useDisclosure();
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 [&>button]:self-start">
      <TableButton disclosure={disclosure} caption={table.caption} />
      <TablePanel disclosure={disclosure} table={table} />
    </div>
  );
}

/** A link-style "Open …" link at a 32 px target (44 px at 480 px and below). */
export function Link({ href, children }: { href: string; children: string }) {
  return (
    <Button
      color="link-gray"
      size="sm"
      href={href}
      iconTrailing={ArrowRight}
      className={cx(TARGET, "self-start")}
    >
      {children}
    </Button>
  );
}

type KeyTone = ComponentProps<typeof Key>["tone"];

/**
 * One figure of a lead: the reading as the title, what it is measured in as the kicker, its one
 * trace control with the table button beside it, a legend, the drawing, the table panel the
 * button opens, and the module's own notes on its basis.
 */
export function FigureTile({
  props,
  span,
  label,
  kicker,
  title,
  line,
  source,
  legend = [],
  notes = [],
  table,
  caption,
  children,
}: {
  props: LeadProps;
  span: ComponentProps<typeof Tile>["span"];
  label: string;
  kicker: string;
  title: string;
  line?: number;
  source: string;
  /**
   * The figure's legend: the one kit `Legend` entries (`{ kind: "ring" | "dot" | …, tone, text }`,
   * each its real mark shape), or the earlier square keys (`{ tone, text }`).
   */
  legend?: readonly ({ tone: KeyTone; text: string } | LegendEntry)[];
  notes?: readonly string[];
  table?: TableViewData;
  /** A short line in the tile head under the kicker (which periods are drawn, a basis). */
  caption?: ReactNode;
  children: ReactNode;
}) {
  const [view, setView] = useState<string>("figure");
  const showing = table && view === "table" ? "table" : "figure";
  // The module's name over a figure on the module's own page says nothing: the header names it.
  const basis = kicker === moduleName(props.entry.output.module, props.run.pathway) ? "" : kicker;
  return (
    <Tile span={span} label={label}>
      {/* One head for every lead tile: the subject, its basis under it, then the Figure / Table
          switch and the one trace control, in that order. */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <h3 className="text-h4 font-medium text-balance text-text-primary">{title}</h3>
          {basis && <p className="text-caption text-text-tertiary">{basis}</p>}
          {caption != null && (
            <p data-part="caption" className="text-caption text-text-secondary">
              {caption}
            </p>
          )}
        </div>
        <div className="ml-auto flex flex-none items-center gap-2">
          {table && (
            <Segmented
              label={`${label}: figure or table`}
              segments={[
                { key: "figure", label: "Figure" },
                { key: "table", label: "Table", accessibleLabel: `Table view: ${table.caption}` },
              ]}
              current={showing}
              onSelect={setView}
            />
          )}
          <FigureSourceControl
            folder={props.run.folder}
            entry={props.entry}
            line={line}
            name={source}
          />
        </div>
      </div>
      {/* Both views stay mounted, one of them hidden: a figure keeps its measured size, and the
          switch never moves focus or scroll. */}
      <div
        data-view="figure"
        hidden={showing !== "figure"}
        className={showing === "figure" ? "flex min-w-0 flex-col gap-4" : "hidden"}
      >
        <FigureBody legend={legend}>{children}</FigureBody>
      </div>
      {table && (
        <div
          data-view="table"
          hidden={showing !== "table"}
          className={cx(
            "w-full min-w-0 text-small text-text-secondary",
            showing !== "table" && "hidden",
          )}
        >
          <TableScroll label={`${table.caption}, table`}>
            <Table {...table} />
          </TableScroll>
        </div>
      )}
      <FigureNotes notes={notes} />
    </Tile>
  );
}

/** A figure with its legend above it. */
function FigureBody({
  legend,
  children,
}: {
  legend: readonly ({ tone: KeyTone; text: string } | LegendEntry)[];
  children: ReactNode;
}) {
  return (
    <>
      {legend.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {legend.flatMap((item) =>
            "kind" in item
              ? []
              : [
                  <Key key={item.text} tone={item.tone}>
                    {item.text}
                  </Key>,
                ],
          )}
          <Legend items={legend.filter((item): item is LegendEntry => "kind" in item)} />
        </div>
      )}
      {children}
    </>
  );
}
