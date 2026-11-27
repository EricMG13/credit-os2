import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { FindingParagraph } from "../ReportContent";
import { evidencePath, readParagraph, readerText, type OutputEntry } from "../publishedReport";
import { traceKey } from "../reportView";
import { richParts } from "../richText";
import { typedModuleTable } from "./ModuleTable";
import { Anchor, ANCHOR, HeldTrace } from "./ModuleFrame";
import type { DrawingGap, ProseSection } from "./moduleFrameModel";
import { proseWithoutMachinery, statedGap } from "./moduleRecordsModel";
import { GapNote, Tile } from "./overview/Tile";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";

/** A section this long reads in two columns on a wide screen; a shorter one shares its row. */
const LONG = 180;

type Placed = { prose: ProseSection; span: 6 | 12; measured?: true };

const isShort = (item: ProseSection) => item.words <= LONG && !item.typed.length;
/** Two short sections share a row only when their lengths are alike, so neither tile is mostly empty. */
const alike = (a: ProseSection, b: ProseSection) =>
  Math.max(a.words, b.words) <= 1.6 * Math.max(1, Math.min(a.words, b.words));

/**
 * Short sections of similar length pair up side by side; a long one takes the row; a short one
 * left alone takes the row too, its lines held to the reading measure inside the tile (`measured`).
 */
export function placeProse(prose: readonly ProseSection[]): Placed[] {
  const placed: Placed[] = [];
  let open: Placed | null = null;
  for (const item of prose) {
    if (!isShort(item)) {
      open = null;
      placed.push({ prose: item, span: 12 });
      continue;
    }
    if (open && alike(open.prose, item)) {
      open.span = 6;
      delete open.measured;
      placed.push({ prose: item, span: 6 });
      open = null;
      continue;
    }
    open = { prose: item, span: 12, measured: true };
    placed.push(open);
  }
  return placed;
}

function TypedTables({ prose, entry }: { prose: ProseSection; entry: OutputEntry }) {
  return prose.typed.map((table) => (
    <div key={table.line} className="min-w-0">
      {typedModuleTable(entry.output.module, prose.section.heading, table, (line) =>
        traceKey(entry, line),
      )}
    </div>
  ));
}

function ProseTile({
  placed,
  entry,
  folder,
}: {
  placed: Placed;
  entry: OutputEntry;
  folder: string;
}) {
  const { prose, span, measured } = placed;
  const id = ANCHOR.section(prose.section.line);
  // A section of typed tables only: the tables carry their own headings and regions, so the
  // tile has no title and takes another name where theirs would repeat it.
  if (!prose.paragraphs.length)
    return (
      <Tile span={12} label={`${prose.title} table`} className="self-start">
        <div id={id} tabIndex={-1} className="grid min-w-0 gap-4 outline-none">
          <TypedTables prose={prose} entry={entry} />
        </div>
      </Tile>
    );
  const columns = span === 12 && prose.words > LONG;
  return (
    <Tile
      span={span}
      className="self-start"
      label={prose.title}
      title={
        <Anchor id={id}>
          <span className="first-letter:uppercase">{prose.title}</span>
        </Anchor>
      }
    >
      <div className={cx("min-w-0", columns ? "gap-x-10 xl:columns-2 [&>*]:mb-4" : "grid gap-4")}>
        {prose.paragraphs.map((block) => (
          <div
            key={block.line}
            className={cx("break-inside-avoid", !measured && "[&_.reading-copy]:max-w-none")}
          >
            <FindingParagraph
              block={block}
              trace={traceKey(entry, block.line)}
              href={evidencePath(folder, entry, block.line)}
            />
          </div>
        ))}
      </div>
      <TypedTables prose={prose} entry={entry} />
    </Tile>
  );
}

/** The module's other reader sections as prose tiles, in handoff order. */
export function ProseTiles({
  prose,
  entry,
  folder,
}: {
  prose: readonly ProseSection[];
  entry: OutputEntry;
  folder: string;
}) {
  return placeProse(prose).map((placed) => (
    <ProseTile key={placed.prose.section.line} placed={placed} entry={entry} folder={folder} />
  ));
}

/** A visual the module said it could not draw: its own words, in the visual's place. */
export function DrawingGapTile({
  gap,
  entry,
  folder,
  span,
  pathway,
}: {
  gap: DrawingGap;
  entry: OutputEntry;
  folder: string;
  span: 6 | 12;
  pathway?: string | null;
}) {
  return (
    <Tile
      span={span}
      className="self-start"
      label={gap.title}
      title={<span className="first-letter:uppercase">{gap.title}</span>}
    >
      {gap.blocks.map((block) => {
        const text = proseWithoutMachinery(readParagraph(block.text).body, pathway);
        // The module's words as written; hatched only where they state a gap.
        const words = text ? (
          richParts(text, (words) => readerText(words, pathway))
        ) : (
          <Button
            href={evidencePath(folder, entry, block.line)}
            color="link-gray"
            size="sm"
            iconTrailing={ArrowRight}
          >
            Read this passage in Evidence
          </Button>
        );
        return (
          <div key={block.line} className={`${TRACE_HOST} flex items-start gap-2`}>
            <div className="min-w-0 flex-1">
              {text && statedGap(text) ? (
                <GapNote>{words}</GapNote>
              ) : (
                <p className="reading-copy text-body text-text-secondary">{words}</p>
              )}
            </div>
            <HeldTrace
              trace={traceKey(entry, block.line)}
              label={`Show sources for ${gap.title}`}
            />
          </div>
        );
      })}
    </Tile>
  );
}
