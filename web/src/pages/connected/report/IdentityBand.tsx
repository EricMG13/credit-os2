import { Button } from "@/components/base/buttons/button";
import {
  blocked,
  containsReference,
  readerText,
  type CatalogueRating,
  type CatalogueRun,
  type OutputEntry,
  type Table,
} from "../publishedReport";
import { moduleName } from "../api";
import { namedRow, namedTable } from "../reportView";

const DESCRIPTION = "Business description";

const filled = (text: string | undefined) => (text?.trim() ? text : undefined);

/** The register's own description row, when exactly one table under a `company_description` heading has exactly one row. */
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

/** Sector has its own chain: the register's Sector cell, then the profile's `Sector and segments`. */
function sectorOf(entry: OutputEntry | undefined) {
  if (!entry) return undefined;
  const register = registerRow(entry);
  const registered =
    register && filled(register.row.cells[register.table.headers.indexOf("Sector")]);
  return registered ?? profileCell(entry, "Sector and segments")?.text;
}

const REGISTER_HEADING = /^(?:\d+[.)] )?(?:\*\*|`)?T2R\.1(?:\*\*|`)?(?!\w|\.\d)/;
const same = (a: string | undefined, b: string | undefined) =>
  a?.trim().toLowerCase() === b?.trim().toLowerCase();

/** The one table under the single T2R.1-headed section with Agency and Rating columns; else none. */
function ratingRegister(entry: OutputEntry) {
  const sections = entry.sections.filter(({ heading }) => REGISTER_HEADING.test(heading));
  if (sections.length !== 1) return undefined;
  const tables = (sections[0]?.blocks ?? []).filter((block): block is Table => {
    if (block.type !== "table") return false;
    const names = block.headers.map((header) => header.trim().toLowerCase());
    return names.includes("agency") && names.includes("rating");
  });
  const [only] = tables;
  if (tables.length !== 1 || !only) return undefined;
  const names = only.headers.map((header) => header.trim().toLowerCase());
  return {
    agency: names.indexOf("agency"),
    level: names.indexOf("issuer/instrument"),
    rating: names.indexOf("rating"),
    rows: only.rows,
  };
}

const ISSUER_LEVEL = /\b(?:issuer|corporate family|cfr|icr|idr)\b/i;
const firstToken = (text: string | undefined) => text?.trim().split(/\s+/)[0]?.toLowerCase();

/** Entered issuer-scope agencies whose issuer-level register rows all carry another rating; each once. */
export function differingAgencies(entries: OutputEntry[], ratings: CatalogueRating[]) {
  const entry = entries.find(
    (item) => item.selected && item.output.module === "CP-2H" && !blocked(item),
  );
  const register = entry && ratingRegister(entry);
  if (!register || register.level < 0) return [];
  const differing = ratings
    .filter(({ scope }) => scope === "issuer")
    .filter(({ agency, label }) => {
      const rows = register.rows.filter(
        ({ cells }) =>
          same(cells[register.agency], agency) && ISSUER_LEVEL.test(cells[register.level] ?? ""),
      );
      return (
        rows.length > 0 &&
        !rows.some(({ cells }) => firstToken(cells[register.rating]) === label.trim().toLowerCase())
      );
    })
    .map(({ agency }) => agency);
  return [...new Set(differing)];
}

/**
 * An entered rating as one header chip: agency, rating and outlook in the analyst's words, all
 * neutral; whether an outlook is good or bad is not the page's to say.
 */
export function RatingChip({ rating, className }: { rating: CatalogueRating; className: string }) {
  const facility = rating.scope === "facility" ? " facility" : "";
  return (
    <li
      title={
        rating.date.trim() ? `Entered at run start, as of ${rating.date}` : "Entered at run start"
      }
      className={className}
    >
      {`${rating.agency}${facility} `}
      <span className="font-mono font-medium text-text-primary">{rating.label}</span>
      {rating.outlook.trim() && <span>{` · ${rating.outlook}`}</span>}
    </li>
  );
}

/** The header's identity facts: the sector line, the entered ratings and any agency the ratings module rates differently. */
export function reportIdentity(catalogue: CatalogueRun | undefined, entries: OutputEntry[]) {
  const entry = entries.find(
    (item) => item.selected && item.output.module === "CP-1A" && !blocked(item),
  );
  const handoffSector = sectorOf(entry);
  const sector =
    filled(catalogue?.sector) ??
    (handoffSector === undefined || containsReference(handoffSector)
      ? undefined
      : readerText(handoffSector));
  const ratings = catalogue?.ratings ?? [];
  return { sector, ratings, differing: differingAgencies(entries, ratings) };
}

/** The way to the ratings module when it shows another rating than the one entered. */
export function DifferingRating({ differing }: { differing: string[] }) {
  if (!differing.length) return null;
  return (
    <Button
      href="#modules/CP-2H"
      color="link-gray"
      size="sm"
      className="min-h-8 text-left whitespace-normal max-[480px]:min-h-11"
    >
      {`${moduleName("CP-2H")} shows a different rating for ${differing.join(", ")}`}
    </Button>
  );
}
