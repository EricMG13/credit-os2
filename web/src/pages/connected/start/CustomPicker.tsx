import { useId } from "react";
import { Button } from "@/components/base/buttons/button";
import { moduleName } from "../api";
import { Figure } from "../report/overview/Tile";
import { EstimateFigures, nameSentence } from "./CustomEstimate";
import {
  ESTIMATE_LABEL,
  OFFERED,
  PRESETS,
  complete,
  customEffort,
  estimate,
  PHASES,
  phaseScopeNote,
  togglePhase,
  usd,
} from "./customSelection";
import { pageEstimate, type IntakeView } from "./intake";

const NAME = "custom";
const CHECK = "flex items-center gap-2 text-small font-medium text-text-primary";
const CAPTION =
  "The summary adds the comparison with an earlier run, and its cost, when one is listed.";

/**
 * The modules of a custom selection: every module the analyst may choose, by reader name, with what
 * it answers, what it needs first and what it is estimated to cost at the chosen effort. The rules
 * add what a chosen module needs, say why, and hold the two every run opens with. Three presets set
 * the choice; the sum, the hold and the cap follow it.
 */
export function CustomPicker({ view }: { view: IntakeView }) {
  const prefix = useId();
  const done = complete(view.modules);
  const effort = customEffort(view.effort);
  const ceiling = Number(view.caps[NAME]);
  const total = pageEstimate(view.modules, view.effort, view.caps);
  const chosenRows = new Map(total?.rows.map((row) => [row.module, row]));
  /** A module's figure as it counts in this selection, or as it would if it were added to it. */
  const figureOf = (id: string) =>
    chosenRows.get(id) ??
    estimate(complete([...view.modules, id]), {
      compared: false,
      effort,
      ceiling: Number.isFinite(ceiling) ? ceiling : Infinity,
    }).rows.find((row) => row.module === id);
  return (
    <fieldset className="grid min-w-0 gap-3 lg:col-span-2">
      <legend className="mb-2 text-small font-medium text-text-primary">
        Modules for this run
      </legend>
      <div role="group" aria-label="Start from" className="flex flex-wrap items-center gap-2">
        <span className="text-small text-text-secondary">Start from</span>
        {PRESETS.map((preset) => (
          <Button
            key={preset.id}
            color="secondary"
            size="sm"
            onPress={() => {
              view.chooseModules([...preset.modules]);
            }}
          >
            {preset.name}
          </Button>
        ))}
      </div>
      {total ? (
        <EstimateFigures sum={total.sumCents / 100} hold={total.holdCents / 100} cap={total.cap}>
          <p className="mt-2 text-caption text-text-secondary">{CAPTION}</p>
        </EstimateFigures>
      ) : (
        <p className="text-small text-text-secondary">
          {`${ESTIMATE_LABEL}: the cap for a custom selection is unavailable. Reload the form. ${CAPTION}`}
        </p>
      )}
      <ul className="grid gap-2 lg:grid-cols-2">
        {OFFERED.map((module, at) => {
          const reason = done.reasons[module.id];
          const row = figureOf(module.id);
          const chosen = done.modules.includes(module.id);
          const phases = PHASES[module.id] ?? [];
          const hasSelectedPhase = phases.some(({ id }) => view.modules.includes(id));
          const scopeNote = phaseScopeNote(module.id, hasSelectedPhase);
          const ids = ["answers", "needs", "reason"].map(
            (part) => `${prefix}-${String(at)}-${part}`,
          );
          const needs = module.required.map((id) => moduleName(id, NAME));
          return (
            <li
              key={module.id}
              className="grid gap-1 rounded-ds-md border border-border-hairline px-3 py-2"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <label className={CHECK}>
                  <input
                    type="checkbox"
                    checked={chosen}
                    aria-describedby={ids.slice(0, reason === undefined ? 2 : 3).join(" ")}
                    disabled={reason !== undefined}
                    onChange={(event) => {
                      const phaseIds = phases.map(({ id }) => id);
                      const next = view.modules.filter(
                        (id) => id !== module.id && !phaseIds.includes(id),
                      );
                      if (event.target.checked) next.push(module.id);
                      view.chooseModules(next);
                    }}
                  />
                  {moduleName(module.id, NAME)}
                </label>
                {row &&
                  (chosen ? (
                    <Figure className="text-small">{usd(row.cents)}</Figure>
                  ) : (
                    <Figure className="text-small text-text-tertiary">{`+ ${usd(row.cents)}`}</Figure>
                  ))}
              </div>
              <p id={ids[0]} className="text-small text-text-secondary">
                {module.answers}
              </p>
              <p id={ids[1]} className="text-caption text-text-tertiary">
                {needs.length ? `Needs first: ${nameSentence(needs)}` : "Needs nothing first"}
                {module.modulesPageOnly && " · No report section of its own"}
                {row && !row.measured && " · Not measured: the mean of the measured modules"}
              </p>
              {reason !== undefined && (
                <p id={ids[2]} className="text-caption text-text-secondary">
                  {`${(["CP-0", "CP-1"] as const).some((id) => id === module.id) ? "Always in" : "Added"}: ${reason}`}
                </p>
              )}
              {chosen && phases.length > 0 && (
                <fieldset className="ml-6 grid gap-2 border-l-2 border-action pl-3">
                  <legend className="text-caption font-medium text-text-primary">
                    Scope inside this module
                  </legend>
                  {phases.map((phase, phaseAt) => (
                    <label key={phase.id} className={CHECK}>
                      <input
                        type="checkbox"
                        checked={view.modules.includes(phase.id)}
                        aria-label={phase.name}
                        aria-describedby={`${prefix}-${String(at)}-phase-${String(phaseAt)}`}
                        onChange={() => {
                          view.chooseModules(togglePhase(view.modules, module.id, phase.id));
                        }}
                      />
                      {phase.name}
                    </label>
                  ))}
                  <ul className="grid gap-2">
                    {phases.map((phase, phaseAt) => (
                      <li
                        key={phase.id}
                        className="grid gap-0.5 border-l border-border-hairline pl-3 text-caption text-text-secondary"
                      >
                        <span>{phase.answers}</span>
                        <span>Needs first: {phase.upstream}</span>
                        <span>{scopeNote}</span>
                        {phase.related && <span>{phase.related}</span>}
                        <span
                          id={`${prefix}-${String(at)}-phase-${String(phaseAt)}`}
                          className="sr-only"
                        >
                          {phase.answers} Needs first: {phase.upstream}. {scopeNote}{" "}
                          {phase.related ?? ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-caption text-text-tertiary">
                    This uses the full module estimate because phase-only costs have not been
                    measured. Selecting a phase does not add a model call.
                  </p>
                </fieldset>
              )}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
