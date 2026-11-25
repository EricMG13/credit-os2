import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import { blocked, evidencePath, type OutputEntry, type Table } from "../publishedReport";
import { namedRow, namedTable } from "../reportView";
import { citesSource, proseWithoutMachinery } from "./moduleRecordsModel";
import { PublishedSource } from "./PublishedTrace";

/*
 * What Business & governance says the issuer is. These are the rules the report header used for
 * its business description before the redesign moved it here: the company_description register
 * over the Company profile's Business row; two candidate rows are a gap, never a guess; text
 * through readerText (in proseWithoutMachinery); a description that cites a file or register id is not printed, only its
 * place in Evidence; a register code it cites goes with the words that cite it, or, where that
 * leaves no clean sentence, the description is not printed either.
 */

const NO_DESCRIPTION = "Business description not in this run";
const DESCRIPTION = "Business description";
const IN_EVIDENCE = "Business description in Evidence";
const ON_SELECTED = "The business description is shown for the selected output.";

const filled = (text: string | undefined) => (text?.trim() ? text : undefined);

/** The register's own row, when exactly one table under a `company_description` heading has exactly one row. */
function registerRow(entry: OutputEntry) {
  const tables = entry.sections
    .filter((section) => section.heading.includes("company_description"))
    .flatMap(({ blocks }) => blocks)
    .filter(
      (block): block is Table => block.type === "table" && block.headers.includes(DESCRIPTION),
    );
  const [only] = tables;
  const [row] = only?.rows ?? [];
  if (tables.length !== 1 || only?.rows.length !== 1 || !row) return undefined;
  return { table: only, row };
}

function profileCell(entry: OutputEntry, field: string) {
  const row = namedRow(namedTable(entry, "Company profile", []), ({ cells }) => cells[0] === field);
  return row && { line: row.line, text: filled(row.cells[1]) };
}

/** First hit wins: the register, then the Company profile `Business` row. */
function describeCompany(entry: OutputEntry) {
  const register = registerRow(entry);
  const registered =
    register && filled(register.row.cells[register.table.headers.indexOf(DESCRIPTION)]);
  if (register && registered) return { text: registered, line: register.row.line };
  const business = profileCell(entry, "Business");
  return business?.text ? { text: business.text, line: business.line } : undefined;
}

/** Sector: the register's Sector cell, then the profile's `Sector and segments`. */
function sectorOf(entry: OutputEntry) {
  const register = registerRow(entry);
  const registered =
    register && filled(register.row.cells[register.table.headers.indexOf("Sector")]);
  const sector = registered ?? profileCell(entry, "Sector and segments")?.text;
  return sector === undefined || citesSource(sector)
    ? undefined
    : proseWithoutMachinery(sector) || undefined;
}

/** The issuer's sector and business description, as Business & governance states them. */
export function CompanyProfile({ entry, folder }: { entry: OutputEntry; folder: string }) {
  // A blocked module's frame states that it could not run; the description adds nothing there.
  if (blocked(entry)) return null;
  // Only the selected output describes the issuer, as the report header did.
  if (!entry.selected) return <p className="pt-1 text-small text-text-tertiary">{ON_SELECTED}</p>;
  const described = describeCompany(entry);
  const sector = sectorOf(entry);
  const shown = described && !citesSource(described.text) && proseWithoutMachinery(described.text);
  const referenced = described !== undefined && !shown;
  return (
    <div className="flex min-w-0 flex-col gap-1 pt-1">
      {sector && <p className="text-caption text-text-tertiary">{sector}</p>}
      {described ? (
        <p className={`${TRACE_HOST} flex items-start gap-2 text-small text-text-primary`}>
          <span className={referenced ? "min-w-0 text-text-tertiary" : "min-w-0"}>
            {shown || IN_EVIDENCE}
          </span>
          <PublishedSource href={evidencePath(folder, entry, described.line)} name={DESCRIPTION}>
            {DESCRIPTION}
          </PublishedSource>
        </p>
      ) : (
        <p className="text-small text-text-tertiary">{NO_DESCRIPTION}</p>
      )}
    </div>
  );
}
