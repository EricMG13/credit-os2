import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { evidencePath, type OutputEntry } from "../../publishedReport";
import { PublishedSource } from "../PublishedTrace";
import { passageBlocks, type Passage, type PassageTable, type RowProps } from "./read";
import { Figure, GapNote, GapSentence, Tile, Well } from "./Tile";

const CONTRARY = "Contrary evidence and what would change the view";
const MISSING = "Not established for this run. The module wrote no such passage.";

/** One block of a passage: a paragraph or a table the module wrote there. */
type Written = Passage | PassageTable;
type Drawn = Pick<RowProps, "run"> & { entry: OutputEntry; passage: Written };

function Source({ run, entry, passage, name }: Drawn & { name: string }) {
  return (
    <PublishedSource
      href={evidencePath(run.folder, entry, passage.line)}
      name={name}
      linkLabel={`Source for ${name}`}
    >
      View source
    </PublishedSource>
  );
}

function EvidenceLink({ href, children }: { href: string; children: string }) {
  return (
    <Button href={href} color="link-gray" size="sm" iconTrailing={ArrowRight}>
      {children}
    </Button>
  );
}

/** A table the module wrote in a passage, its cells in the reader's words; a cited cell links. */
function PassageGrid({
  run,
  entry,
  passage,
}: Pick<RowProps, "run"> & { entry: OutputEntry; passage: PassageTable }) {
  const { headers, rows } = passage.table;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full text-left text-small text-text-primary">
          <thead>
            <tr>
              {headers.map((header, at) => (
                <th
                  key={at}
                  scope="col"
                  className="py-1 pr-4 text-caption font-medium text-text-secondary"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.line} className="border-t border-border-hairline">
                {row.cells.map((cell, at) => (
                  <td key={at} className="py-1 pr-4 align-top">
                    {cell ?? (
                      <EvidenceLink href={evidencePath(run.folder, entry, row.line)}>
                        Read this cell in Evidence
                      </EvidenceLink>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <HeldColumns run={run} entry={entry} passage={passage} />
    </div>
  );
}

/** The columns of a passage table held in Evidence, named, with the link to read them there. */
function HeldColumns({
  run,
  entry,
  passage,
}: Pick<RowProps, "run"> & { entry: OutputEntry; passage: PassageTable }) {
  if (!passage.held.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 text-caption text-text-tertiary">
      <p>{`Held in Evidence: ${passage.held.join(", ")}.`}</p>
      <EvidenceLink href={evidencePath(run.folder, entry, passage.line)}>
        Read this table in Evidence
      </EvidenceLink>
    </div>
  );
}

/** The module's paragraph or table, or a link to it where it cites a source by name. */
function Words({ run, entry, passage, className }: Drawn & { className: string }) {
  if ("table" in passage) return <PassageGrid run={run} entry={entry} passage={passage} />;
  return passage.text === null ? (
    <EvidenceLink href={evidencePath(run.folder, entry, passage.line)}>
      Read this passage in Evidence
    </EvidenceLink>
  ) : (
    <p className={className}>{passage.text}</p>
  );
}

function Findings({ run, entry }: Pick<RowProps, "run"> & { entry: OutputEntry }) {
  const findings = passageBlocks(entry, "Key findings");
  return (
    <Tile
      span={7}
      head="small"
      label="Key findings"
      title="Key findings"
      kicker="In the module's own words"
    >
      {findings.length === 0 ? (
        <GapNote>{MISSING}</GapNote>
      ) : (
        <ol className="flex flex-col">
          {findings.map((passage, at) => (
            <li
              key={passage.line}
              className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-3 border-t border-border-hairline py-2.5"
            >
              <Figure className="pt-0.5 text-caption text-text-tertiary">
                {String(at + 1).padStart(2, "0")}
              </Figure>
              <Words
                run={run}
                entry={entry}
                passage={passage}
                className="reading-copy text-body text-pretty text-text-primary"
              />
              <Source
                run={run}
                entry={entry}
                passage={passage}
                name={`finding ${String(at + 1)}`}
              />
            </li>
          ))}
        </ol>
      )}
    </Tile>
  );
}

/** One paragraph of a passage in a well, with its own trace control. */
function PassageWell({ run, entry, passage, name }: Drawn & { name: string }) {
  return (
    <Well className="flex items-start justify-between gap-2 border border-info-edge bg-surface-card">
      <Words
        run={run}
        entry={entry}
        passage={passage}
        className="text-small text-pretty text-text-primary"
      />
      <Source run={run} entry={entry} passage={passage} name={name} />
    </Well>
  );
}

const NOT_TYPED =
  "The module does not separate the outcome resolved favourably from the one resolved adversely.";

/**
 * The counter-argument, under the module's own heading and on its own surface: the opening
 * paragraph as the quote, every further paragraph as written in its own well with its own trace.
 * What would change the view is written inside it; until the module types the two outcomes apart,
 * one stated line says so. Which paragraph names which outcome is the module's to say.
 */
function Counter({
  run,
  entry,
  paragraphs,
}: Pick<RowProps, "run"> & { entry: OutputEntry; paragraphs: Written[] }) {
  const [first, ...rest] = paragraphs;
  return (
    <Tile
      span={5}
      head="small"
      label={CONTRARY}
      title={CONTRARY}
      tone="counter"
      trace={
        first && <Source run={run} entry={entry} passage={first} name="the contrary evidence" />
      }
    >
      {first ? (
        // The tinted surface marks the counter-argument; the quote needs no rule beside it.
        <blockquote>
          <Words
            run={run}
            entry={entry}
            passage={first}
            className="text-lead text-pretty text-text-primary"
          />
        </blockquote>
      ) : (
        <GapNote>{MISSING}</GapNote>
      )}
      {rest.map((passage, at) => (
        <PassageWell
          key={passage.line}
          run={run}
          entry={entry}
          passage={passage}
          name={`paragraph ${String(at + 2)} of the contrary evidence`}
        />
      ))}
      <GapSentence className="mt-auto">{NOT_TYPED}</GapSentence>
    </Tile>
  );
}

/**
 * Row 3: the judgement behind the call, in the lead module's words. Findings on the plain surface;
 * the counter-argument on its own surface so it reads as one. Nothing without a credit view: the
 * call tile already says there is none.
 */
export function JudgementRow({ run, view }: RowProps) {
  if (!view.lead) return null;
  return (
    <>
      <Findings run={run} entry={view.lead} />
      <Counter run={run} entry={view.lead} paragraphs={passageBlocks(view.lead, CONTRARY)} />
    </>
  );
}
