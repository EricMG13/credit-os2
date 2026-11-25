import type { ReactNode } from "react";
import { Blocked } from "@/components/gap/Blocked";
import { blocked, type OutputEntry } from "../publishedReport";
import { GapNote } from "./overview/Tile";

/**
 * Why a figure from another module is not drawn, in the designed state: the blocked state (dashed
 * signal outline, the slashed "Not assessable" badge and the module's reason) when the module
 * could not run, else the hatched gap with the reason in words.
 */
export function ModuleGap({ entry, children }: { entry?: OutputEntry; children: string }) {
  if (entry && blocked(entry))
    return (
      <div className="rounded-ds-sm border border-dashed border-warning-mark p-3">
        <Blocked reason={children} />
      </div>
    );
  return <GapNote>{children}</GapNote>;
}

/** The small gap chip for one cell or figure: hatched, dashed, with its words. */
export function GapChip({ children }: { children: ReactNode }) {
  return (
    <span className="gap-hatch inline-flex w-fit items-center rounded-ds-xs border border-dashed border-border-gap px-1.5 py-0.5 text-caption text-gap-text">
      <span className="rounded-ds-xs bg-surface-card px-1">{children}</span>
    </span>
  );
}
