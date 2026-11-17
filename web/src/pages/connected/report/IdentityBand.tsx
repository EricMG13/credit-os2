import { ArrowDownRight, ArrowRight, ArrowUpRight, Building07 } from "@untitledui/icons";
import type { FC } from "react";
import type { IconProps } from "@/utils/is-react-component";
import { Button } from "@/components/base/buttons/button";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import {
  blocked,
  containsReference,
  evidencePath,
  readerText,
  type CatalogueRating,
  type CatalogueRun,
  type OutputEntry,
  type Table,
} from "../publishedReport";
import { moduleName } from "../api";
import { namedRow, namedTable } from "../reportView";
import { PublishedSource } from "./PublishedTrace";

const NO_DESCRIPTION = "Business description not in this run";
const NO_RATINGS = "Ratings not entered for this run";
const ENTERED = "Entered at run start";
const DESCRIPTION = "Business description";
const IN_EVIDENCE = "Business description in Evidence";

const outlookIcons: Record<string, FC<IconProps>> = {
  positive: ArrowUpRight,
  negative: ArrowDownRight,
  stable: ArrowRight,
};

const outlookColour: Record<string, string> = {
  positive: "text-success-text",
  negative: "text-error-text",
};

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

/** First hit wins: the register, then the Company profile `Business` row. */
function describeCompany(entry: OutputEntry | undefined) {
  if (!entry) return undefined;
  const register = registerRow(entry);
  const registered =
    register && filled(register.row.cells[register.table.headers.indexOf(DESCRIPTION)]);
  if (register && registered) return { text: registered, line: register.row.line };
  const business = profileCell(entry, "Business");
  return business?.text ? { text: business.text, line: business.line } : undefined;
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
function differingAgencies(entry: OutputEntry | undefined, ratings: CatalogueRating[]) {
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

function RatingTile({ rating }: { rating: CatalogueRating }) {
  const word = rating.outlook.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const Icon = outlookIcons[word];
  return (
    <li
      title={rating.date.trim() ? `as of ${rating.date}` : undefined}
      className="grid min-w-28 gap-0.5 rounded-lg border border-border-hairline bg-surface-card px-3 py-2"
    >
      <span className="text-xs text-text-tertiary">
        {rating.agency}
        {rating.scope === "facility" && <span className="ml-1">Facility</span>}
      </span>
      <span className="font-mono text-lg font-medium text-text-primary">{rating.label}</span>
      <span
        className={`flex items-center gap-1 text-sm ${outlookColour[word] ?? "text-text-secondary"}`}
      >
        {Icon && <Icon aria-hidden="true" className="size-4 shrink-0" />}
        {rating.outlook}
      </span>
    </li>
  );
}

export function IdentityBand({
  catalogue,
  entries,
  folder,
}: {
  catalogue: CatalogueRun | undefined;
  entries: OutputEntry[];
  folder: string;
}) {
  const entry = entries.find(
    (item) => item.selected && item.output.module === "CP-1A" && !blocked(item),
  );
  const described = describeCompany(entry);
  const referenced = described !== undefined && containsReference(described.text);
  const found = described && { ...described, text: readerText(described.text) };
  const handoffSector = sectorOf(entry);
  const sector =
    filled(catalogue?.sector) ??
    (handoffSector === undefined || containsReference(handoffSector)
      ? undefined
      : readerText(handoffSector));
  const ratings = catalogue?.ratings ?? [];
  const registered = entries.find(
    (item) => item.selected && item.output.module === "CP-2H" && !blocked(item),
  );
  const differing = differingAgencies(registered, ratings);
  return (
    <section
      aria-label="Company"
      className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4 border-b border-border-hairline pb-4"
    >
      <div className="flex min-w-0 flex-1 basis-80 items-start gap-3">
        <Building07 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-text-tertiary" />
        <div className="grid min-w-0 gap-1">
          {sector && <p className="text-xs text-text-tertiary">{sector}</p>}
          {found && entry ? (
            <p className={`${TRACE_HOST} flex items-start gap-2 text-text-primary`}>
              <span
                title={referenced ? undefined : found.text}
                className={referenced ? "min-w-0 text-text-tertiary" : "line-clamp-2 min-w-0"}
              >
                {referenced ? IN_EVIDENCE : found.text}
              </span>
              <PublishedSource href={evidencePath(folder, entry, found.line)} name={DESCRIPTION}>
                {DESCRIPTION}
              </PublishedSource>
            </p>
          ) : (
            <p className="text-text-tertiary">{NO_DESCRIPTION}</p>
          )}
        </div>
      </div>
      {ratings.length > 0 ? (
        <div className="grid gap-1">
          <ul className="flex flex-wrap gap-3">
            {ratings.map((rating, index) => (
              <RatingTile key={index} rating={rating} />
            ))}
          </ul>
          <p className="text-xs text-text-secondary">{ENTERED}</p>
          {differing.length > 0 && (
            <Button href="#modules/CP-2H" color="link-gray" size="sm">
              {`${moduleName("CP-2H")} shows a different rating for ${differing.join(", ")}`}
            </Button>
          )}
        </div>
      ) : (
        <p className="text-text-tertiary">{NO_RATINGS}</p>
      )}
    </section>
  );
}
