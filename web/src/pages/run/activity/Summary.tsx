import type { ReactNode } from "react";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { Card } from "@/components/card/Card";
import { Missing } from "@/components/gap/Missing";
import type { RunFigure, RunRecord } from "../slice-activity";

function Item({
  caption,
  value,
  children,
}: {
  caption: string;
  value: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-caption font-medium text-text-tertiary">{caption}</span>
      <span className="text-metric tabular-nums text-text-primary">{value}</span>
      {children}
    </div>
  );
}

function WithBar({ caption, figure }: { caption: string; figure: RunFigure }) {
  const value = figure.value ?? <Missing />;
  if (figure.bar === null)
    return (
      <Item caption={caption} value={value}>
        <span className="text-sm text-text-tertiary">{figure.note}</span>
      </Item>
    );
  const { label, value: at, max } = figure.bar;
  return (
    <Item caption={caption} value={value}>
      <ProgressBar value={at} max={max} label={label} labelBelow />
    </Item>
  );
}

/** Spend, modules finished and elapsed time, formatted by the caller. */
export function Summary({
  run,
  spendCaption = "Spend and cap",
}: {
  run: Pick<RunRecord, "spend" | "finished" | "elapsed">;
  spendCaption?: string;
}) {
  return (
    <Card>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-8">
        <WithBar caption={spendCaption} figure={run.spend} />
        <WithBar caption="Modules finished" figure={run.finished} />
        <Item caption="Elapsed" value={run.elapsed.value ?? <Missing />}>
          <span className="text-sm text-text-tertiary">{run.elapsed.note}</span>
        </Item>
      </div>
    </Card>
  );
}
