import { containsReference, type Table } from "../publishedReport";

const archivedPage =
  /(,?\s+)?\b[AQ] (?:page(?:\s*:\s*|\s+)\d+|pages(?:\s*:\s*|\s+)\d+(?:\s+and\s+\d+|[–-]\d+)*)\b/gu;
const standaloneCalculation = /^C\d+(?:(?:[–-]| and )C\d+)?$/u;

export function printableBasis(basis: string) {
  return basis
    .split(";")
    .map((clause) =>
      clause
        .replace(archivedPage, "")
        .replace(/^\s*,\s*/, "")
        .trim()
        .replace(standaloneCalculation, "")
        .replace(/\b(calculated|rolling) C\d+(?=[,.]|$)/giu, "$1"),
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
