import {
  evidenceLink,
  factsOf,
  latestRun,
  type Coverage,
  type CoverageRun,
  type Fact,
  type Issuer,
} from "../coverageData";
import { reportPath, tableBox, th } from "./shared";

const YIELD = "cp-3d/yield-against-maturity/yield";

type Props = {
  data: Coverage;
  issuers: readonly Issuer[];
  selected: string | null;
  onSelect: (issuer: string) => void;
};

type MarketRow = { issuer: Issuer; run?: CoverageRun; fact?: Fact };

function observations(data: Coverage, issuers: readonly Issuer[]) {
  const rows: MarketRow[] = [];
  for (const issuer of issuers) {
    const run = latestRun(issuer);
    const facts = run ? factsOf(data, run.key, YIELD) : [];
    if (facts.length === 0) rows.push({ issuer, run });
    else for (const fact of facts) rows.push({ issuer, run, fact });
  }
  return rows;
}

function statedYield(fact: Fact) {
  if (fact.at === null || fact.gap) return fact.text;
  return fact.unit ? `${fact.text} ${fact.unit}` : fact.text;
}

function trace(row: MarketRow) {
  if (!row.run) return null;
  return row.fact ? evidenceLink(row.run, row.fact) : reportPath(row.run.folder);
}

export function Market({ data, issuers, selected, onSelect }: Props) {
  const rows = observations(data, issuers);

  return (
    <section aria-label="Market" className="grid gap-3">
      <header className="grid gap-1">
        <h2 className="font-display text-h3 text-text-primary">Market observations</h2>
        <p role="status" className="text-small text-text-secondary">
          This page could not read yields and maturities for {issuers.length} issuers.
        </p>
        <p className="text-caption text-text-secondary">
          Maturity is not a typed figure and cannot be placed. Quote dates and yields below are
          shown as written for each issuer’s newest run. The run as-of date is shown separately.
        </p>
      </header>

      <div className={tableBox}>
        <table aria-label="Market observations" className="w-full text-left text-small">
          <thead>
            <tr className="border-b border-border-hairline text-caption">
              <th className={th}>Issuer</th>
              <th className={th}>Instrument</th>
              <th className={th}>Run as-of date</th>
              <th className={th}>Quote date</th>
              <th className={th}>Yield as written</th>
              <th className={th}>Maturity</th>
              <th className={th}>Basis and limitation</th>
              <th className={th}>Trace</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const { issuer, run, fact } = row;
              const href = trace(row);
              return (
                <tr
                  key={`${issuer.key}-${fact?.output ?? "no-yield"}-${String(fact?.line ?? index)}`}
                  className="border-t border-border-subtle align-top"
                >
                  <th scope="row" className="p-3 font-medium">
                    <button
                      type="button"
                      aria-pressed={issuer.key === selected}
                      onClick={() => {
                        onSelect(issuer.key);
                      }}
                    >
                      {issuer.name}
                    </button>
                  </th>
                  <td className="p-3">
                    {fact?.row ?? (fact ? "Instrument not stated" : "No typed yield")}
                  </td>
                  <td className="p-3">
                    {run?.asOf ? <time dateTime={run.asOf}>{run.asOf}</time> : "Date not recorded"}
                  </td>
                  <td className="p-3">{fact?.quoteDate ?? (fact ? "Not stated" : "Not read")}</td>
                  <td className="p-3 font-mono tabular-nums">
                    {fact ? statedYield(fact) : <span className="gap-hatch">Not read</span>}
                  </td>
                  <td className="p-3">
                    <span className="gap-hatch">Not typed</span>
                  </td>
                  <td className="p-3">
                    {fact?.basis ?? (fact ? "Not stated" : "No typed yield fact in newest run.")}
                  </td>
                  <td className="p-3">
                    {href ? (
                      <a href={href} aria-label="Open run">
                        Open run
                      </a>
                    ) : (
                      "No run link available"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
