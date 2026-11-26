import { type Table } from "../../publishedReport";
import { Bento } from "../overview/Tile";
import { withDraws } from "./draws";
import {
  GapCell,
  KeyValues,
  LaneTile,
  LeadFigure,
  LeadGap,
  MapTile,
  statedGap,
  Trace,
  type LeadTable,
  Beside,
} from "./parts";
import { eventsOf, leadHref, mapOf, drawsNothing, statedInProse } from "./read";
import type { LeadProps } from "./types";
import { sourceOf, writtenTable } from "./written";

type Href = (line?: number) => string;

const MIX = "Revenue mix";

/** The module's revenue and business mix register: the one table under its heading, as written. */
function mixTable(entry: LeadProps["entry"]) {
  const tables = entry.sections
    .filter((section) => /^revenue_business_mix\b/i.test(section.heading.trim()))
    .flatMap(({ blocks }) => blocks)
    .filter((block): block is Table => block.type === "table");
  return tables.length === 1 ? tables[0] : undefined;
}

/** A cell as written, or its stated gap ("Not supplied: …") as the one gap chip with its reason. */
function MixCell({ text }: { text: string }) {
  const gap = statedGap(text);
  if (gap) return <GapCell word={gap.word} reason={gap.reason} />;
  return text ? <span className="text-text-primary">{text}</span> : <GapCell word="Not stated" />;
}

/** The revenue mix as the module writes it, row by row with each cell, and the table as written. */
function RevenueMix({ entry, href }: { entry: LeadProps["entry"]; href: Href }) {
  const register = mixTable(entry);
  const table = register ? writtenTable(sourceOf(register), href) : undefined;
  if (!register || !table)
    return (
      <LeadGap
        span={4}
        label={MIX}
        title={MIX}
        reason="This page could not read the revenue mix."
      />
    );
  const [, ...columns] = table.head;
  return (
    <LeadFigure
      span={4}
      label={MIX}
      title={MIX}
      trace={<Trace href={href(register.line)} name={MIX} />}
      figure={
        <ul aria-label={MIX} className="flex flex-col">
          {table.rows.map((row, at) => (
            <li
              key={at}
              className="flex items-start justify-between gap-3 border-t border-border-hairline py-2.5 first:border-t-0 first:pt-0"
            >
              {columns.length === 1 ? (
                <KeyValues
                  className="min-w-0 flex-1"
                  items={[{ key: row.label, value: <MixCell text={cellText(row.cells[0])} /> }]}
                />
              ) : (
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-small font-medium text-text-primary">{row.label}</span>
                  <KeyValues
                    items={columns.map((name, column) => ({
                      key: name,
                      value: <MixCell text={cellText(row.cells[column])} />,
                    }))}
                  />
                </span>
              )}
              {row.end}
            </li>
          ))}
        </ul>
      }
      table={table}
    />
  );
}

/** A written table's cell as text; a missing one reads as nothing. */
const cellText = (cell: LeadTable["rows"][number]["cells"][number] | undefined) =>
  typeof cell === "string" ? cell : "";

/** CP-1A: what the business is, who controls it, and what the deal changed. */
export const BusinessLead = withDraws(
  function BusinessLead(props: LeadProps) {
    const { entry, run } = props;
    if (drawsNothing(entry)) return null;
    const href = leadHref(props);
    const operating = mapOf(entry, "operating model to credit");
    const ownership = mapOf(entry, "ownership and control");
    // A map or a lane the module wrote as prose only is the frame's, in the module's words.
    const map = (read: typeof operating, name: string, absent: string) => (span: 8 | 12) =>
      !statedInProse(entry, `Map: ${name}`) && (
        <MapTile map={read} href={href} span={span} label={name} title={name} absent={absent} />
      );
    const opMap = map(
      operating,
      "Operating model to credit",
      "This page could not read the operating model.",
    );
    const ownMap = map(
      ownership,
      "Ownership and control",
      "This page could not read who owns and controls the issuer.",
    );
    const mix = <RevenueMix key="mix" entry={entry} href={href} />;
    // The dated history takes a row of its own, after the maps: there it has the width for its
    // time axis, and it never stacks a long list beside a short map.
    const history = !statedInProse(entry, "Events: Issuer history") && (
      <LaneTile
        lane={eventsOf(entry, "Issuer history")}
        span={12}
        label="Issuer history"
        title="Issuer history"
        href={href}
        asOf={run.asOf}
      />
    );
    const column = <Beside>{mix}</Beside>;
    // The first drawn map heads the page with the revenue mix beside it; a map that is only a gap
    // is one full row.
    return (
      <Bento>
        {operating.state === "ready" ? (
          <>
            {opMap(8)}
            {column}
            {ownMap(12)}
          </>
        ) : (
          <>
            {opMap(12)}
            {ownMap(ownership.state === "ready" ? 8 : 12)}
            {ownership.state === "ready" ? column : mix}
          </>
        )}
        {history}
      </Bento>
    );
  },
  ["maps", "events"],
);
