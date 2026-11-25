import { containsReference, type Table } from "../publishedReport";

const archivedPage =
  /(,?\s+)?\b[AQ] (?:page(?:\s*:\s*|\s+)\d+|pages(?:\s*:\s*|\s+)\d+(?:\s+and\s+\d+|[–-]\d+)*)\b/gu;
const standaloneCalculation = /^C\d+(?:(?:[–-]| and )C\d+)?$/u;
// A whole clause that is nothing but a named document and its pages, as a module writes it in words:
// "June quarterly report pages 18–19, 63–66", "Annual report page 153". The clause is the source
// reference; the qualification is in the clauses beside it. A page inside a sentence of its own
// words is not this, stays, and gates the row.
const PAGES = String.raw`\d+(?:[–-]\d+)?(?:(?:,\s*|\s+and\s+)\d+(?:[–-]\d+)?)*`;
// Only an allowlist of document-name words may precede the locator: months, fiscal-period words,
// four-digit years and document nouns. Any other word (an amount, a currency, a negation, a
// qualifier such as "unaudited" or "draft") makes the clause more than a citation, so it stays and
// gates the row.
const DOCUMENT_WORD = String.raw`(?:january|february|march|april|may|june|july|august|september|october|november|december|fy\d{2,4}|q[1-4]|first|second|third|fourth|quarter|quarterly|annual|interim|half-year|year-end|(?:19|20)\d{2}|financial|credit|report|filing|statements?|agreement|indenture|prospectus|presentation|release|form|10-[kq]|8-k)`;
const citationClause = new RegExp(
  String.raw`^(?:${DOCUMENT_WORD}\s+)*(?:report|filing|statements?|agreement|indenture|prospectus|10-[KQ]|8-K)\s+(?:pages?|pp?\.)\s*${PAGES}\.?$`,
  "iu",
);

export function printableBasis(basis: string) {
  return basis
    .split(";")
    .map((clause) =>
      clause
        .replace(archivedPage, "")
        .replace(/^\s*,\s*/, "")
        .trim()
        .replace(standaloneCalculation, "")
        .replace(/\b(calculated|rolling) C\d+(?=[,.]|$)/giu, "$1")
        .replace(citationClause, ""),
    )
    .filter((clause) => /[^.,\s]/u.test(clause))
    .join("; ");
}

export function redactArchivedLocator(passage: string) {
  return passage.replace(
    archivedPage,
    (_, separator?: string) => `${separator ?? ""}[source locator omitted]`,
  );
}

const basisHeaders = [
  "Basis and limitation",
  "Basis and source",
  "Status, definition and evidence",
];
const identificationHeaders = ["Period", "Reporting unit", "Unit"];

/** Observations carry their basis. An unresolved mixed reference gates the row as a whole. */
export function printableTable(table: Table, unresolvedNote = false) {
  const basis = table.headers.findIndex((header) => basisHeaders.includes(header));
  const headers = table.headers.map((header, at) =>
    at === basis && header === "Basis and source" ? "Basis and limitation" : header,
  );
  let withheld = false;
  const rows = table.rows.map((row) => {
    const cells = row.cells.map((cell, at) =>
      (at === basis ? printableBasis(cell) : cell)
        .replace(/; C\d+(?:(?:[–-]| and )C\d+)?$/u, "")
        .replace(/^Calculated C\d+(?=,)/u, "Calculated"),
    );
    const unresolvedBasis = containsReference(cells[basis] ?? "");
    if (!unresolvedNote && !unresolvedBasis) return { ...row, cells };
    withheld = true;
    return {
      ...row,
      cells: cells.map((cell, at) => {
        if (at === basis)
          return unresolvedBasis
            ? "The observation qualification is only available in Evidence."
            : cell;
        if (at === 0 || identificationHeaders.includes(table.headers[at] ?? "")) return cell;
        return "Withheld";
      }),
    };
  });
  return { table: { ...table, headers, rows }, withheld };
}
