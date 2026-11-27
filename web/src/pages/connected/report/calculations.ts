import type { TreeNode } from "@/pages/library/slice";
import { classifySections, plainModuleNames, type OutputEntry } from "../publishedReport";

const idPattern = /\b[A-Z]\d{1,4}\b/g;

type CalculationRow = {
  id: string;
  line: number;
  label: string;
  operation: string;
  value: string;
  details: string[];
  source: string;
};

function matchingIndexes(headers: string[], matches: (header: string) => boolean) {
  return headers.flatMap((header, index) => (matches(header) ? [index] : []));
}

function uniqueIndex(headers: string[], matches: (header: string) => boolean) {
  const indexes = matchingIndexes(headers, matches);
  return indexes.length === 1 ? indexes[0] : undefined;
}

function calculationRows(entry: OutputEntry): CalculationRow[] {
  return classifySections(entry.sections)
    .filter(({ role }) => role === "calculations")
    .flatMap(({ section }) => section.blocks)
    .flatMap((block) => {
      if (block.type !== "table") return [];
      const headers = block.headers.map((header) => header.trim());
      const id = uniqueIndex(headers, (header) => header.toLowerCase() === "id");
      const result = uniqueIndex(headers, (header) => /^result\b/i.test(header));
      const source = uniqueIndex(headers, (header) => /^(?:source|sources)$/i.test(header));
      const methods = matchingIndexes(headers, (header) =>
        /\b(?:operation|operands?|inputs?|formula|method)\b/i.test(header),
      );
      const calculations = matchingIndexes(
        headers,
        (header) => header.toLowerCase() === "calculation",
      );
      if (methods.length !== 1 || calculations.length > 1) return [];
      const operation = methods[0];
      if (
        id === undefined ||
        result === undefined ||
        source === undefined ||
        operation === undefined
      )
        return [];
      const label = calculations[0];
      return block.rows.flatMap((row) => {
        const key = row.cells[id] ?? "";
        const operationText = row.cells[operation] ?? "";
        if (!key) return [];
        const value = row.cells[result] ?? "";
        const sourceText = row.cells[source] ?? "";
        return [
          {
            id: key,
            line: row.line,
            label: (label === undefined ? "" : (row.cells[label] ?? "")) || key,
            operation: operationText,
            value,
            details: headers.flatMap((header, index) =>
              index === id || index === result || index === label
                ? []
                : row.cells[index]
                  ? [`${header}: ${row.cells[index]}`]
                  : [],
            ),
            source: sourceText,
          },
        ];
      });
    });
}

export function calculationNodes(
  entry: OutputEntry,
  references: string,
  selectedLine?: number,
): TreeNode[] {
  const rows = calculationRows(entry);
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  const byId = new Map(
    rows.flatMap((row) => {
      if (seen.has(row.id)) duplicates.add(row.id);
      seen.add(row.id);
      return [[row.id, row]];
    }),
  );
  const idsIn = (text: string) => [...new Set(text.match(idPattern) ?? [])];
  function node(id: string, ancestors: readonly string[]): TreeNode[] {
    const row = byId.get(id);
    if (
      !row ||
      !row.operation.trim() ||
      duplicates.has(id) ||
      ancestors.includes(id) ||
      ancestors.length >= 8
    )
      return [];
    return [
      {
        label: plainModuleNames(row.label || id),
        value: row.value || null,
        note: [id, ...row.details]
          .filter(Boolean)
          .map((part) => plainModuleNames(part))
          .join(" · "),
        children: idsIn(row.source).flatMap((child) => node(child, [...ancestors, id])),
      },
    ];
  }
  const selected = rows.find((row) => row.line === selectedLine)?.id;
  return (selected ? [selected] : idsIn(references)).flatMap((id) => node(id, []));
}
