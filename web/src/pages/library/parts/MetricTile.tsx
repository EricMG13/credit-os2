import type { Metric } from "../slice";
import { YearChange } from "../../connected/report/YearChange";
import { CellValue } from "./CellValue";
import { TraceControl } from "./TraceControl";

import { MetricCard, METRIC_FIGURE } from "@/components/metric/MetricCard";

/**
 * The shared headline card, with the library's original value, qualification and source control. A tile with no trace draws the
 * missing-trace marker; `traced={false}` draws neither, for the Evidence page, which has no trace controls.
 */
export function MetricTile({ metric, traced = true }: { metric: Metric; traced?: boolean }) {
  return (
    <MetricCard
      as="li"
      label={metric.label}
      value={null}
      figure={<CellValue cell={metric.value} figureClass={METRIC_FIGURE} />}
      actions={
        traced ? (
          <TraceControl trace={metric.trace} label="Show sources for this figure" />
        ) : undefined
      }
    >
      {metric.yearChange && (
        <YearChange
          metricKey={metric.yearChange.key}
          change={metric.yearChange.change}
          unit={metric.yearChange.unit}
          prior={metric.yearChange.prior}
        />
      )}
      <span className="text-sm text-text-tertiary">{metric.note}</span>
    </MetricCard>
  );
}
