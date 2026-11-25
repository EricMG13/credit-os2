/** The five stages of a run, in order: the reader's questions and the pipeline's shape. */
const STAGES = [
  { name: "Sources", modules: ["CP-0"] },
  { name: "Financials", modules: ["CP-1", "CP-1B", "CP-1C", "CP-1D", "CP-MODEL", "CP-L10"] },
  {
    name: "Credit",
    modules: ["CP-1A", "CP-DR", "CP-2", "CP-2A", "CP-2D", "CP-2E", "CP-2G", "CP-2H"],
  },
  { name: "Structure and market", modules: ["CP-3", "CP-3C", "CP-3D", "CP-4", "CP-4C"] },
  { name: "Validation and decision", modules: ["CP-5", "CP-6", "CP-8"] },
] as const;

const OTHER = "Other";

/** Rows grouped by stage, in stage order and, within a stage, in module order; a module no stage names is drawn last under Other. */
export function byStage<Row extends { id: string }>(rows: readonly Row[]) {
  const known = new Set<string>(STAGES.flatMap((stage) => stage.modules));
  const groups: { name: string; rows: Row[] }[] = STAGES.map((stage) => ({
    name: stage.name,
    // In the stage's own module order, not the order the rows arrived in.
    rows: stage.modules.flatMap((code) => rows.filter((row) => row.id === code)),
  }));
  groups.push({ name: OTHER, rows: rows.filter((row) => !known.has(row.id)) });
  return groups.filter((group) => group.rows.length > 0);
}
