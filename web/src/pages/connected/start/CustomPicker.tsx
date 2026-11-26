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
  usd,
} from "./customSelection";
import { pageEstimate, type IntakeView } from "./intake";

const NAME = "custom";
const CHECK =
  "flex items-center gap-2 text-small font-medium text-text-primary max-[480px]:min-h-11";

/**
 * The modules of a custom selection: every module the analyst may choose, by reader name, with what
 * it answers, what it needs first and what it is estimated to cost at the chosen effort. The rules
 * add what a chosen module needs, say why, and hold the two every run opens with. Three presets set
 * the choice; the sum, the hold and the cap follow it.
 */
export function CustomPicker({ view }: { view: IntakeView }) {
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
      <ul className="grid gap-2">
        {OFFERED.map((module) => {
          const reason = done.reasons[module.id];
          const row = figureOf(module.id);
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
                    checked={done.modules.includes(module.id)}
                    disabled={reason !== undefined}
                    onChange={(event) => {
                      view.toggleModule(module.id, event.target.checked);
                    }}
                  />
                  {moduleName(module.id, NAME)}
                </label>
                {row && <Figure className="text-small">{usd(row.cents)}</Figure>}
              </div>
              <p className="text-small text-text-secondary">{module.answers}</p>
              <p className="text-caption text-text-tertiary">
                {needs.length ? `Needs first: ${nameSentence(needs)}` : "Needs nothing first"}
                {module.modulesPageOnly && " · Modules page only"}
                {row && !row.measured && " · Not measured: the mean of the measured modules"}
              </p>
              {reason !== undefined && (
                <p className="text-caption text-text-secondary">
                  {`${(["CP-0", "CP-1"] as const).some((id) => id === module.id) ? "Always in" : "Added"}: ${reason}`}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {total ? (
        <EstimateFigures sum={total.sumCents / 100} hold={total.holdCents / 100} cap={total.cap} />
      ) : (
        <p className="text-small text-text-secondary">
          {`${ESTIMATE_LABEL}: the cap for a custom selection is unavailable. Reload the form.`}
        </p>
      )}
      <p className="text-caption text-text-secondary">
        The summary adds the comparison with an earlier run, and its cost, when one is listed.
      </p>
    </fieldset>
  );
}
