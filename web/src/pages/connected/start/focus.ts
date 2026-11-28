import { moduleName } from "../api";
import { CUSTOM } from "./customSelection";
import { FieldProblem } from "./fields";
import { ANY_FOCUS } from "./plain";

/**
 * The modules a research question may be aimed at, in the service's order
 * (`research.contracts.receivers_for_focus`: CP-1C, CP-2, CP-DR or blank; anything else is refused).
 */
const FOCUS_MODULES = ["CP-1C", "CP-2", "CP-DR"] as const;

/** The modules the request runs: a custom run's choice completed by the rules (`requested`), else the preset's kept modules, or the whole preset when none was left out. */
export function runModules(
  pathway: string,
  requested: readonly string[],
  modules: readonly string[],
): readonly string[] {
  return pathway === CUSTOM || modules.length === 0 ? requested : modules;
}

/** Any, then each focus module the run requests. */
export function focusChoices(
  requested: readonly string[],
  pathway: string,
): (readonly [string, string])[] {
  return [
    ["", ANY_FOCUS],
    ...FOCUS_MODULES.filter((id) => requested.includes(id)).map(
      (id) => [id, moduleName(id, pathway)] as const,
    ),
  ];
}

/** Whether a question's saved focus is blank or one of the modules offered for the run. */
function focusOffered(focus: unknown, requested: readonly string[]): boolean {
  if (typeof focus !== "string" || focus.trim() === "") return true;
  return FOCUS_MODULES.some((id) => id === focus.trim() && requested.includes(id));
}

/** Refuses the first question whose focus is not offered: the analyst chooses it again. */
export function checkQuestionFocus(
  questions: unknown,
  requested: readonly string[],
  pathway: string,
): void {
  if (!Array.isArray(questions)) return;
  for (const question of questions as unknown[]) {
    if (typeof question !== "object" || question === null) continue;
    const { text, focus_module: focus } = question as Record<string, unknown>;
    if (focusOffered(focus, requested)) continue;
    // A focus that is not a non-blank string is always "offered", so it is one here.
    const code = String(focus).trim();
    const label = typeof text === "string" && text.trim() ? text.trim() : "New question";
    const reason = FOCUS_MODULES.some((id) => id === code)
      ? "is not requested in this run"
      : "is not a module a research question can be aimed at";
    throw new FieldProblem(
      "research_questions",
      `Choose the focus again for the research question “${label}”: ${moduleName(code, pathway)} ${reason}.`,
    );
  }
}
