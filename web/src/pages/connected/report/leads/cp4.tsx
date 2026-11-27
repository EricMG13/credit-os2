import { unitLabel } from "../../publishedReport";
import { word } from "../../visuals/visualData";
import { Bento, Tile } from "../overview/Tile";
import { basisNotes } from "../overview/figureData";
import { Bullets, leadTests } from "./bullet";
import { withDraws } from "./draws";
import { SWATCH } from "./kit/marks/Legend";
import { Beside, KeyValues, LeadFigure, LeadGap, MapTile, Trace } from "./parts";
import {
  chartOf,
  columnOf,
  leadHref,
  mapOf,
  readerCell,
  registerTable,
  sectionParagraphs,
  rowName,
  drawsNothing,
  hasRegister,
  statedInProse,
} from "./read";
import type { LeadProps } from "./types";
import { ChartGap, writtenTable } from "./written";

type Href = (line?: number) => string;

const TITLE = "Covenant headroom";

const MAPS = [
  { name: "legal entities", title: "Legal entities", noun: "the legal-entity map" },
  { name: "intercreditor", title: "Intercreditor", noun: "the intercreditor map" },
] as const;

const NO_HEADROOM = "This page could not read the covenant headroom.";

/** The headroom as the figure reads it: its chart and tests, the tests null when it is a gap. */
function headroomOf(entry: LeadProps["entry"]) {
  const chart = chartOf(entry, TITLE);
  const tests = chart.state === "ready" ? leadTests(chart.table, chart.descriptor) : null;
  return { chart, tests: tests?.length ? tests : null };
}

/**
 * The module's own words under its covenant chart (a note on what the thresholds are), in the
 * section holding the chart's table; each test's own basis is on its row.
 */
function chartNotes(entry: LeadProps["entry"], line: number) {
  const section = entry.sections.find(({ blocks }) =>
    blocks.some((block) => block.type === "table" && block.line === line),
  );
  return section
    ? sectionParagraphs(entry, section.heading).flatMap(({ text }) => (text ? [text] : []))
    : [];
}

function Headroom({
  entry,
  href,
  span = 8,
}: {
  entry: LeadProps["entry"];
  href: Href;
  span?: 8 | 12;
}) {
  // A chart the module wrote as prose only is the frame's, in the module's words.
  if (statedInProse(entry, `Chart data: ${TITLE}`)) return null;
  const { chart, tests } = headroomOf(entry);
  if (chart.state !== "ready" || !tests)
    return (
      <ChartGap
        chart={chart}
        span={12}
        label={TITLE}
        title={TITLE}
        href={href}
        unread={NO_HEADROOM}
        absent={NO_HEADROOM}
      />
    );
  const { table, descriptor } = chart;
  const unit = word(descriptor.unit);
  const rowHref = (at: number) => href(table.rowLines?.[at] ?? table.line);
  return (
    <LeadFigure
      span={span}
      label={TITLE}
      title={TITLE}
      basis={
        unit
          ? `${unitLabel(unit)} · each test on its own scale from zero`
          : "Each test in its own unit, on its own scale from zero"
      }
      legend={
        <>
          <span className="flex items-center gap-1.5 text-caption text-text-secondary">
            <svg
              viewBox={`0 0 ${String(SWATCH)} ${String(SWATCH)}`}
              width={SWATCH}
              height={SWATCH}
              aria-hidden="true"
              className="flex-none overflow-visible"
            >
              <line
                data-swatch="current"
                x1={SWATCH / 2}
                x2={SWATCH / 2}
                y1={2}
                y2={SWATCH - 2}
                strokeWidth={2}
                className="stroke-text-secondary"
              />
            </svg>
            Current
          </span>
          <span className="flex items-center gap-1.5 text-caption text-text-secondary">
            <span aria-hidden="true" className="h-2.5 w-0.5 bg-text-primary" />
            Threshold
          </span>
        </>
      }
      trace={<Trace href={href(table.line)} name={TITLE} />}
      figure={<Bullets label="Covenant tests" tests={tests} href={rowHref} tone="neutral" />}
      table={writtenTable(table, href)}
      notes={[
        // A basis every test shares is one note; tests with their own carry it on their rows.
        ...(tests.some((test) => test.condition) ? [] : basisNotes(table)),
        ...chartNotes(entry, table.line),
      ]}
    />
  );
}

const BASKET_FIELDS = ["Formula", "Estimated Capacity", "Remaining Capacity", "Status"] as const;

function Baskets({ entry, href, span }: { entry: LeadProps["entry"]; href: Href; span: 6 | 12 }) {
  const label = "Baskets and capacity";
  const table = registerTable(entry, "T4C.5", ["Capacity Type", "Basket / Test"]);
  // No basket register at all is no tile; a gap only for one the page could not read.
  if (!table?.rows.length && !hasRegister(entry, "T4C.5")) return null;
  if (!table?.rows.length)
    return (
      <LeadGap
        span={span}
        label={label}
        title={label}
        reason="This page could not read the baskets and capacity."
      />
    );
  const name = columnOf(table, "Basket / Test");
  const fields = BASKET_FIELDS.map((field) => ({ field, at: columnOf(table, field) })).filter(
    ({ at }) => at >= 0,
  );
  return (
    <Tile span={span} label={label} title={label} className="w-full self-start">
      <ul aria-label={label} className="flex flex-col">
        {table.rows.map(({ line, cells }, index) => {
          const basket = rowName(readerCell(cells[name] ?? ""), index);
          return (
            <li
              key={line}
              className="flex items-start justify-between gap-3 border-t border-border-hairline py-2.5 first:border-t-0 first:pt-0"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-small font-medium wrap-anywhere text-text-primary">
                  {basket}
                </span>
                <KeyValues
                  items={fields
                    .map(({ field, at }) => ({ key: field, value: readerCell(cells[at] ?? "") }))
                    // A formula the module repeats as the capacity is shown once.
                    .filter(
                      (item, _at, all) =>
                        item.key !== "Formula" ||
                        !all.some((other) => other.key !== item.key && other.value === item.value),
                    )}
                />
              </span>
              <Trace href={href(line)} name={basket} />
            </li>
          );
        })}
      </ul>
    </Tile>
  );
}

/**
 * CP-4: how much room each test leaves, and who stands where. The one-edge maps and the baskets
 * stack in one column beside the headroom; a deeper map takes a full row under it; a headroom that
 * is only a gap is one full row, the rest beneath it two by two.
 */
export const LegalLead = withDraws(
  function LegalLead(props: LeadProps) {
    const { entry } = props;
    if (drawsNothing(entry)) return null;
    const href = leadHref(props);
    const maps = MAPS.map((item) => ({ ...item, map: mapOf(entry, item.name) }));
    // A map the module wrote as prose only is the frame's, in the module's words.
    const tile = (item: (typeof maps)[number], span: 6 | 12) =>
      !statedInProse(entry, `Map: ${item.name}`) && (
        <MapTile
          key={item.name}
          map={item.map}
          span={span}
          label={item.title}
          title={item.title}
          href={href}
          absent={`This page could not read ${item.noun}.`}
          typeColours
        />
      );
    const deep = (item: (typeof maps)[number]) =>
      item.map.state === "ready" && item.map.edges.length > 1;
    if (!headroomOf(entry).tests)
      return (
        <Bento>
          <Headroom entry={entry} href={href} />
          {maps.map((item) => tile(item, 6))}
          <Baskets entry={entry} href={href} span={12} />
        </Bento>
      );
    const compact = maps.filter((item) => !deep(item));
    // With both maps deep the baskets would stand alone beside the headroom: a full row instead.
    if (!compact.length)
      return (
        <Bento>
          <Headroom entry={entry} href={href} span={12} />
          {maps.map((item) => tile(item, 12))}
          <Baskets entry={entry} href={href} span={12} />
        </Bento>
      );
    return (
      <Bento>
        <Headroom entry={entry} href={href} />
        <Beside>
          {compact.map((item) => tile(item, 12))}
          <Baskets entry={entry} href={href} span={12} />
        </Beside>
        {maps.filter(deep).map((item) => tile(item, 12))}
      </Bento>
    );
  },
  ["figures", "maps"],
);
