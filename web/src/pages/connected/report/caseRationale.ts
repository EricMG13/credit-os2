import type { OutputEntry } from "../publishedReport";
import { readerReason } from "./overview/reason";
import { allTables } from "./leads/kit/tables";

const HEADERS = ["driver", "case", "rationale"] as const;

/**
 * The words the forward-model handoff gives for one case: the rationale of that case's revenue
 * growth assumption (the first driver it states for the case when it states no revenue growth), as
 * its assumption register writes it, with the driver named. Null when the handoff states none, or
 * only one that cites a source. Used only where the published model records no description.
 */
export function caseRationale(handoff: OutputEntry | undefined, rawGroup: string) {
  if (!handoff) return null;
  const group = rawGroup.trim().toLowerCase();
  const rows = allTables(handoff)
    .filter(({ table }) => HEADERS.every((name) => table.headers.includes(name)))
    .flatMap(({ table }) => {
      const at = (name: string) => table.headers.indexOf(name);
      return table.rows.flatMap(({ cells }) => {
        const named = (cells[at("case")] ?? "").trim().toLowerCase();
        const driver = (cells[at("driver")] ?? "").trim();
        const words = readerReason(cells[at("rationale")] ?? "");
        return named !== "" && group.startsWith(named) && driver && words
          ? [{ driver, words }]
          : [];
      });
    });
  const found = rows.find(({ driver }) => /^revenue growth$/i.test(driver)) ?? rows[0];
  return found ? `${found.driver}: ${found.words}` : null;
}
