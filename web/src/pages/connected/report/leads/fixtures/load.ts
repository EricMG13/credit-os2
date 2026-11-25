import type { OutputEntry, PublishedRun, Snapshot } from "../../../publishedReport";
import type { ReportView } from "../../../reportView";
import type { LeadProps } from "../types";
import cp0 from "./cp0_synthetic.json";
import cp1 from "./cp1_tdg_fy2024.json";
import cp1b from "./cp1b_tdg_fy2024.json";
import cp5 from "./cp5_synthetic.json";
import cp6 from "./cp6_synthetic.json";
import creditScreening from "./credit_screening_cpl10.json";
import distressedCp1 from "./distressed_cp1.json";
import earningsUpdateCp1Draft1 from "./earnings_update_cp1_draft1.json";
import relativeValueCp1 from "./relative_value_cp1.json";

type Fixture = { module: string; charts: unknown[]; sections: unknown[] };

/** A retained or synthetic handoff, parsed as the library parses it, as the module's selected entry. */
function fixtureEntry(data: Fixture): OutputEntry {
  return {
    output: {
      module: data.module,
      id: `run/${data.module}`,
      label: data.module,
      sha256: `hash-${data.module}`,
      href: `${data.module}.md`,
      charts: data.charts,
    } as OutputEntry["output"],
    sections: data.sections as OutputEntry["sections"],
    selected: true,
  };
}

/** What a lead is given for one entry: the entry is the run's only, selected, output. */
export function leadProps(entry: OutputEntry, models: unknown[] = []): LeadProps {
  return {
    snapshot: {} as Snapshot,
    run: { folder: "run" } as PublishedRun,
    view: { entries: [entry], models } as unknown as ReportView,
    entry,
    entryIndex: 0,
  };
}

/** TransDigm FY2024 CP-1 (retained, outdated evidence: shape and scope only). */
export const cp1Entry = () => fixtureEntry(cp1);
/** TransDigm CP-1 on the relative value pathway, draft 1 (retained, outdated): one period, FY2024, and wide segment rows. */
export const relativeValueCp1Entry = () => fixtureEntry(relativeValueCp1);
/** TransDigm CP-1 on the distressed pathway, draft 1 (retained, outdated): FY2023 and FY2024, segment rows by measure. */
export const distressedCp1Entry = () => fixtureEntry(distressedCp1);
/** TransDigm CP-1 earnings update, draft 1 (retained, outdated): the accepted draft's shapes, earlier lines. */
export const earningsUpdateCp1Draft1Entry = () => fixtureEntry(earningsUpdateCp1Draft1);
/** TransDigm FY2024 CP-1B, the T4.4 and T4.6 tables only. */
export const cp1bEntry = () => fixtureEntry(cp1b);
export const cp0Entry = () => fixtureEntry(cp0);
export const cp5Entry = () => fixtureEntry(cp5);
export const cp6Entry = () => fixtureEntry(cp6);
/** The synthetic credit screening CP-L10 handoff (tests/fixtures/credit-screening/CP-L10.md), parsed as the library parses it. */
export const creditScreeningEntry = () => fixtureEntry(creditScreening);
