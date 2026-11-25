import { byStage } from "./stages";

/** One module of each stage, in stage order: probes `byStage` so the stage list is not copied. */
const FIRSTS = ["CP-0", "CP-1", "CP-1A", "CP-3", "CP-5"];
const NAMES = byStage(FIRSTS.map((id) => ({ id }))).map(({ name }) => name);

/** The stage a module belongs to and its fixed number, 1 to 5; 0 for a module outside them. */
export function stageOf(id: string) {
  const name = byStage([{ id }])[0]?.name ?? "Other";
  return { name, number: NAMES.indexOf(name) + 1, of: NAMES.length };
}

/** A stage's fixed number as drawn, "01" to "05"; none for Other. */
export function stageLabel(name: string) {
  const at = NAMES.indexOf(name);
  return at < 0 ? "" : String(at + 1).padStart(2, "0");
}
