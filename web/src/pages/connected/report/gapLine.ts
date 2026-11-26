import { gapContext } from "./forecastData";

type Gap = Parameters<typeof gapContext>[0];

/** A cell that is only a dash: the module wrote no value in it. */
const BARE_DASH = /^[—–-]$/u;

/**
 * The funding gap's line of context as every tile draws it. A horizon the row writes as a bare dash
 * (the module's Horizon row states its years in another column) is no horizon: it is left out
 * rather than drawn as "—". Every other line is `gapContext`'s own.
 */
export function gapLine(gap: Gap) {
  if (gap.horizon === null || !BARE_DASH.test(gap.horizon.trim())) return gapContext(gap);
  return [`${gap.name}: ${gap.label}`, gap.unit ?? (gap.unitInFigure ? null : "unit not stated")]
    .filter(Boolean)
    .join(" · ");
}
