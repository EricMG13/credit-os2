import { useContext, useEffect, useId, useState, type ReactNode } from "react";
import { Segmented } from "@/components/kit/Segmented";
import { ChartPrintContext } from "./ChartPrintContext";

type ChartView = "chart" | "table";

interface ChartFrameProps {
  title: string;
  /** The heading level: the one that follows the heading of the section the chart sits in. */
  as?: "h3" | "h4";
  /** The basis of the figures, in small text under the chart. */
  note?: string;
  /** A line under the title, saying what the chart shows; the figure is described by it. */
  subtitle?: string;
  /** Drawn last in the header row, after the Figure or Table switch: the trace control. */
  actions?: ReactNode;
  /** Draws the chart or the table form of the same data. */
  children: (view: ChartView) => ReactNode;
}

/** A titled frame with the Figure or Table switch. It owns which side is shown. */
export function ChartFrame({
  title,
  as: Heading = "h4",
  note,
  subtitle,
  actions,
  children,
}: ChartFrameProps) {
  const [view, setView] = useState<ChartView>("chart");
  const print = useContext(ChartPrintContext);
  const hasSubtitle = subtitle !== undefined && subtitle !== "";
  const titleId = useId();
  const subtitleId = useId();
  useEffect(
    () => () => {
      if (!document.querySelector(".recharts-wrapper"))
        document.getElementById("recharts_measurement_span")?.remove();
    },
    [],
  );
  const heading = (
    <Heading
      id={titleId}
      className="min-w-48 flex-1 font-display text-h4 text-text-primary first-letter:uppercase"
    >
      {title}
    </Heading>
  );
  return (
    <figure
      aria-labelledby={titleId}
      aria-describedby={hasSubtitle ? subtitleId : undefined}
      className="group/trace relative flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        {hasSubtitle ? (
          <div className="min-w-48 flex-1">
            {heading}
            <p id={subtitleId} className="text-small text-text-tertiary">
              {subtitle}
            </p>
          </div>
        ) : (
          heading
        )}
        {!print && (
          // The one head of every figure: the Figure / Table switch, then the trace control last.
          <div className="ml-auto flex items-center gap-2">
            <Segmented
              label={`${title}: figure or table`}
              segments={[
                { key: "chart", label: "Figure" },
                { key: "table", label: "Table" },
              ]}
              current={view}
              onSelect={(key) => {
                setView(key === "table" ? "table" : "chart");
              }}
            />
            {actions}
          </div>
        )}
      </div>
      {children(print ? "chart" : view)}
      {note === undefined ? null : (
        <figcaption className="text-small text-text-secondary">{note}</figcaption>
      )}
    </figure>
  );
}
