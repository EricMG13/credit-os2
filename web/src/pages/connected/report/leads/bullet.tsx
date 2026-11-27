import { useId, type ReactNode } from "react";
import { cx } from "@/utils/cx";
import { withUnit } from "../../publishedReport";
import type { SourceTable } from "../../visuals/visualData";
import { columnAt } from "../overview/figureData";
import { BULLET, bulletGeometry, headroomTests, type HeadroomTest } from "../overview/stressData";
import { Figure } from "../overview/Tile";
import { BarRow, GapCell, statedGap, Trace, type BarTone, type LeadTable } from "./parts";
import { closed, IN_EVIDENCE, readerCell, readerCellOf, withStatedUnit } from "./read";

/** A test as a lead draws it: `headroomGap` is the reason the module gives for no headroom. */
export type LeadTest = HeadroomTest & {
  headroomGap?: string | null;
  /** The row's own "Basis and limitation" in the reader's words: the condition the test carries. */
  condition?: string;
  /** The reason the module gives for a unit it did not supply; the figures then carry no unit. */
  unitGap?: { word: string; reason: string };
};

/**
 * The tests of a value-against-limit table (`headroomTests`), every drawn text as a working page
 * shows it: no source reference, module codes as names. Values are read from the cells as written.
 */
export function leadTests(
  table: SourceTable,
  descriptor: Record<string, unknown>,
): LeadTest[] | null {
  const column = columnAt(table, descriptor.headroom);
  const basis = table.headers.findIndex((header) => /^Basis and limitation$/i.test(header));
  // One basis shared by every row is the figure's note (`basisNotes`); a test's own differs from the others'.
  const own = basis >= 0 && new Set(table.rows.map((row) => (row[basis] ?? "").trim())).size > 1;
  return (
    headroomTests(table, descriptor)?.map((test, at): LeadTest => {
      const gap = column === null ? null : statedGap(table.rows[at]?.[column] ?? "");
      // A unit cell that states a gap is not a unit: the figures stay bare and the gap is said once.
      const unitGap = statedGap(test.unit);
      return {
        ...test,
        ...(unitGap
          ? { unit: "", unitGap: { word: unitGap.word, reason: readerCell(unitGap.reason) } }
          : {}),
        label: readerCell(test.label),
        threshold: readerCellOf(test.threshold),
        current: readerCellOf(test.current),
        headroom: test.headroom === null ? null : readerCell(test.headroom) || null,
        headroomGap: gap ? readerCell(gap.reason) : null,
        direction: readerCell(test.direction),
        condition: own ? conditionOf(table.rows[at]?.[basis] ?? "") : "",
      };
    }) ?? null
  );
}

/** A basis cell as the test's condition: its words, never the "in Evidence" stand-in for a bare citation. */
function conditionOf(cell: string) {
  const text = readerCell(cell);
  return text === IN_EVIDENCE ? "" : text;
}

/** A test's cell as written, with the row's unit when it is a number. */
export const shown = (test: HeadroomTest, cell: HeadroomTest["current"]) =>
  cell.value === null ? cell.text : withStatedUnit(cell.text, test.unit);

/** A position on the bullet's scale as a share of its track. */
const share = (x: number) => (x - BULLET.left) / (BULLET.right - BULLET.left);

/** A tick's offset at its share: centred on its value, inset at either end of the track. */
const inset = (at: number) => (at >= 1 ? "-translate-x-full" : at <= 0 ? "" : "-translate-x-1/2");

function reading(test: HeadroomTest) {
  const headroom = test.headroom ? `, headroom ${test.headroom}` : "";
  const direction = test.direction ? ` ${closed(test.direction)}` : "";
  return `${closed(`${test.label}: ${shown(test, test.current)} against a threshold of ${shown(test, test.threshold)}${headroom}`)}${direction}`;
}

/** One stated cell as written, or the gap in its place with the module's reason. */
function Stated({ test, cell }: { test: HeadroomTest; cell: HeadroomTest["current"] }) {
  const gap = cell.value === null ? statedGap(cell.text) : null;
  if (gap) return <GapCell word={gap.word} reason={gap.reason} />;
  if (!cell.text.trim()) return <GapCell word="Not stated" />;
  if (cell.text === IN_EVIDENCE)
    return <span className="text-caption text-gap-text">{IN_EVIDENCE}</span>;
  return <Figure className="text-small">{shown(test, cell)}</Figure>;
}

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function Term({ name, children }: { name: string; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1.5">
      <span className="text-caption text-text-tertiary">{name}</span>
      {children}
    </span>
  );
}

function BulletRow({ test, href, tone }: { test: LeadTest; href?: string; tone: BarTone }) {
  const geometry = bulletGeometry(test);
  const ends = geometry ? [geometry.ticks[0], geometry.ticks.at(-1)] : [];
  return (
    <li className="flex min-w-0 flex-col gap-2 border-t border-border-hairline pt-3 first:border-t-0 first:pt-0">
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-small font-medium wrap-anywhere text-text-primary">
          {test.label}
        </span>
        {href && <Trace href={href} name={test.label} />}
      </span>
      <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <Term name="Current">
          <Stated test={test} cell={test.current} />
        </Term>
        <Term name="Threshold">
          <Stated test={test} cell={test.threshold} />
        </Term>
        {test.headroom !== null ? (
          <Term name="Headroom">
            <Figure className="text-small">{test.headroom}</Figure>
          </Term>
        ) : (
          test.headroomGap && (
            <Term name="Headroom">
              <GapCell reason={capital(test.headroomGap)} />
            </Term>
          )
        )}
        {test.direction && (
          <span className="text-caption text-text-tertiary">{test.direction}</span>
        )}
        {test.unitGap && (
          <Term name="Unit">
            <GapCell word={test.unitGap.word} reason={test.unitGap.reason} />
          </Term>
        )}
      </span>
      {test.condition && (
        <span className="text-caption wrap-anywhere text-text-secondary">{test.condition}</span>
      )}
      {geometry ? (
        <div role="img" aria-label={reading(test)} className="flex flex-col gap-1">
          <BarRow
            tone={tone}
            start={Math.min(geometry.share.zero, geometry.share.current)}
            end={Math.max(geometry.share.zero, geometry.share.current)}
          >
            <span
              data-threshold
              className={cx(
                "absolute -inset-y-1 w-0.5 bg-text-primary",
                inset(share(geometry.threshold)),
              )}
              style={{ left: `${String(share(geometry.threshold) * 100)}%` }}
            />
          </BarRow>
          <span
            aria-hidden="true"
            className="flex justify-between font-mono text-caption text-text-tertiary"
          >
            {ends.map((tick, at) => (
              <span key={at}>{tick ? withUnit(tick.label, test.unit) : ""}</span>
            ))}
          </span>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Value against limit, one row a test, each on its own scale from zero: every stated cell as written
 * (current, threshold, headroom, direction), the missing one as a gap with its reason, and a bar only
 * when current and threshold are both plain numbers. `href(index)` is the trace of `tests[index]`.
 * The bar takes `tone` (primary blue unless a lead says it is only a measured amount: neutral).
 */
export function Bullets({
  label,
  tests,
  href,
  tone = "primary",
}: {
  label: string;
  tests: readonly LeadTest[];
  href?: (index: number) => string;
  tone?: BarTone;
}) {
  const reader = useId();
  return (
    <>
      {/* The whole figure in words, for a reader who cannot see the bars; each test's condition is in it. */}
      <span id={reader} className="sr-only">
        {tests
          .map((test) => `${reading(test)}${test.condition ? ` ${closed(test.condition)}` : ""}`)
          .join(" ")}
      </span>
      <ul aria-label={label} aria-describedby={reader} className="flex min-w-0 flex-col gap-3">
        {tests.map((test, at) => (
          <BulletRow
            key={`${String(at)}-${test.label}`}
            test={test}
            href={href?.(at)}
            tone={tone}
          />
        ))}
      </ul>
    </>
  );
}

/** The bullets' table view: each cell as written, a missing headroom or direction as missing. */
export function bulletTable(
  tests: readonly HeadroomTest[],
  href?: (index: number) => string,
): LeadTable {
  return {
    head: ["Test", "Current", "Threshold", "Headroom", "Direction"],
    rows: tests.map((test, at) => ({
      label: test.label,
      cells: [
        test.current.text || null,
        test.threshold.text || null,
        test.headroom || null,
        test.direction || null,
      ],
      end: href ? <Trace href={href(at)} name={test.label} /> : undefined,
    })),
    endHeading: href ? "Source" : undefined,
  };
}
