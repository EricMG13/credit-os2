import { InfoCircle } from "@untitledui/icons";
import { MetricCard, METRIC_FIGURE } from "@/components/metric/MetricCard";
import { Missing } from "@/components/gap/Missing";
import { Withheld } from "@/components/gap/Withheld";
import type { Metric } from "../slice/types";
import { PressTip } from "./StatementTable";
import { TraceControl } from "./TraceControl";

/**
 * One headline figure as its own card: label with its definition, a trace control, then the value
 * and the delivered delta line. A missing value draws "n.a." and a withheld one the kit's Withheld,
 * each with its delivered sentence. The shared MetricCard supplies the visual frame; this adapter preserves the delivered forms.
 */
export function MetricTile({ metric }: { metric: Metric }) {
  const { value } = metric;
  return (
    <MetricCard
      label={metric.label}
      value={null}
      definitionControl={
        <PressTip
          title={metric.definition}
          aria-label={`About ${metric.label}`}
          className="rounded-ds-xs text-text-tertiary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <InfoCircle aria-hidden="true" className="size-4" />
        </PressTip>
      }
      actions={
        metric.trace === null ? undefined : (
          <TraceControl href={metric.trace} label={`Show the sources for ${metric.label}`} />
        )
      }
      figure={
        "withheld" in value ? (
          <Withheld reason={metric.note ?? undefined} />
        ) : (
          <span
            className={`${METRIC_FIGURE} ${value.text === null ? "font-normal" : "font-semibold"}`}
          >
            {value.text === null ? <Missing /> : value.text}
          </span>
        )
      }
      delta={
        "withheld" in value || metric.delta === null ? undefined : (
          <span className="inline-flex items-center rounded-ds-sm border border-border-hairline px-2 py-0.5 text-sm font-medium whitespace-nowrap text-text-secondary">
            {metric.delta}
          </span>
        )
      }
    >
      {"withheld" in value || metric.note === null ? null : (
        <p className="text-small text-text-tertiary">{metric.note}</p>
      )}
    </MetricCard>
  );
}
