import type { CatalogueRun } from "./publishedReport";
import { withUnit } from "./publishedReport";
import { YearChange } from "./report/YearChange";

const metricLabels = [
  ["net_leverage", "Net leverage"],
  ["leverage", "Gross leverage"],
  ["coverage", "Interest coverage"],
  ["revenue", "Revenue"],
  ["adjusted_ebitda", "Adjusted EBITDA"],
  ["cash", "Cash"],
] as const;

export function HeadlineFigures({ catalogue }: { catalogue?: CatalogueRun }) {
  const figures = metricLabels.flatMap(([key, name]) => {
    const figure = catalogue?.metrics[key];
    return figure?.value != null ? [{ key, name, figure }] : [];
  });
  if (!figures.length) return null;
  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3">
      {figures.map(({ key, name, figure }) => (
        <div className="rounded-ds-md border border-border-hairline bg-surface-card p-4" key={name}>
          <dt className="text-sm text-text-secondary">{name}</dt>
          <dd className="mt-1 font-display text-h3 whitespace-nowrap tabular-nums">
            {withUnit(figure.value ?? "", figure.unit)}
          </dd>
          {figure.prior && figure.change != null && (
            <dd>
              <YearChange
                metricKey={key}
                change={figure.change}
                unit={figure.unit}
                prior={figure.prior.period}
              />
            </dd>
          )}
          {figure.period && <dd className="text-sm text-text-secondary">{figure.period}</dd>}
        </div>
      ))}
    </dl>
  );
}
