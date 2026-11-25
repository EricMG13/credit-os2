import { FileSearch02, FileX02 } from "@untitledui/icons";
import { useContext } from "react";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";
import { RunContext } from "./RunContext";

/** Put on the element that holds a control, so hovering the figure reveals it. */
export const TRACE_HOST = "group/trace relative";

/** What a control and the marker for a missing trace share: one 32 px footprint (44 px to the touch on a phone), so either goes wherever a control goes. */
const FOOTPRINT =
  "relative flex size-8 flex-none items-center justify-center rounded-ds-sm border bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2 max-[480px]:z-10 max-[480px]:after:absolute max-[480px]:after:-inset-[7px]";

/**
 * The one trace control per paragraph, row or figure. Visible at rest at every width; its box border
 * shows on hover of its host, on keyboard focus, and for every control while the frame's Show sources is on.
 * A `null` or absent trace is a figure whose handoff recorded no source: it draws the missing-trace marker
 * in the control's place, with the same footprint, so every paragraph, row or figure shows either a
 * control or a sign that no source was recorded.
 */
export function TraceControl({
  trace,
  label,
}: {
  trace?: string | null;
  /** The accessible name, the mock's own for the item: "Show sources for this figure", "…the bottom line". */
  label: string;
}) {
  const run = useContext(RunContext);
  if (run === null) throw new Error("TraceControl was drawn outside a RunFrame");
  if (trace === null || trace === undefined) {
    return <MissingTrace label={label} />;
  }
  if (!Object.hasOwn(run.traces, trace)) {
    throw new RangeError(`the run holds no trace "${trace}"`);
  }
  return (
    <TraceButton
      label={label}
      open={() => {
        run.open(trace);
      }}
    />
  );
}

/**
 * The tooltip opens under the control, its end at the control's end: a trace sits at the top right
 * of its item, so above or beside it there is often another control, under it the item's own body.
 */
const TIP = "bottom right";

export function TraceButton({ label, open }: { label: string; open: () => void }) {
  return (
    <Tooltip title="Show sources" placement={TIP}>
      <TooltipTrigger
        aria-label={label}
        onPress={open}
        className={cx(
          FOOTPRINT,
          "cursor-pointer transition-colors duration-150 motion-reduce:transition-none",
          "border-transparent text-text-tertiary hover:border-border-control hover:bg-action-subtle hover:text-action focus-visible:border-border-control focus-visible:ring-focus group-hover/trace:border-border-control in-data-[sources=on]:border-border-control",
        )}
      >
        <FileSearch02 aria-hidden="true" className="size-4" />
      </TooltipTrigger>
    </Tooltip>
  );
}

/**
 * The control's place where no source was recorded: a dashed outline in the gap treatment and a file with a
 * cross, in the control's footprint. It stays in the tab order, so the tooltip "No source recorded" reaches
 * the keyboard, and it is `aria-disabled`: it opens nothing. The outline shows at rest, as the control's icon does.
 */
function MissingTrace({ label }: { label: string }) {
  return (
    <Tooltip title="No source recorded" placement={TIP}>
      <TooltipTrigger
        aria-label={`${label}: no source recorded`}
        aria-disabled="true"
        className={cx(
          FOOTPRINT,
          "cursor-default border-dashed",
          "border-border-gap text-gap-text focus-visible:ring-focus",
        )}
      >
        <FileX02 aria-hidden="true" className="size-4" />
      </TooltipTrigger>
    </Tooltip>
  );
}
