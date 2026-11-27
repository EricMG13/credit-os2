import { STACK } from "../../overview/structureData";
import type { TableViewData } from "../kit/LeadFrame";
import { LINE, NARROW, SIZE, textWidth, wrap } from "../kit/marks";
import { group } from "../kit/numbers";
import { safeText } from "../kit/reader";
import { cellText, type DebtStack, type StackFacility } from "./foundationData";

// The debt stack as a proportional column in the module's ranking order, the first claim at the
// top: each stated amount a segment, all on one scale (the Overview's capital stack, structureData
// `stackGeometry`, drawn here at the measured width with each facility's words beside it). A
// stated gap amount is a fixed hatched slot with the module's reason; a stated zero is a hairline;
// rankings are parted by a small break. The scale's total is geometry only, never printed.
// Overview's `stackGeometry` parts on the Secured flag and has a fixed 252 px column; here the
// break follows the stated ranking and the column is as tall as the words beside it.

export type StackSegment = {
  facility: StackFacility;
  /** The segment's top and height in px; a gap is the fixed slot, a zero a hairline. */
  y: number;
  height: number;
  kind: "amount" | "zero" | "gap" | "words";
  /** The facility's words beside the column: its name and its stated cells. */
  name: string[];
  detail: string[];
  /** A stated gap's or words' text, as written, on its own lines. */
  reason: string[];
  /** The top of the facility's words and their centre line, where the leader meets them. */
  textTop: number;
  textMiddle: number;
  amountText: string;
};

export type StackLayout = {
  narrow: boolean;
  width: number;
  height: number;
  column: number;
  textX: number;
  segments: StackSegment[];
  /** The y of each break between rankings. */
  breaks: number[];
};

const GAP_SLOT = STACK.gapSegment;
const RANK_BREAK = 14;
const AFTER = 10;
const SHORTEST = 120;

/** A facility's stated amount as the reader sees it, grouped; a gap or words as written. */
const amountText = (facility: StackFacility) =>
  facility.amount.kind === "number" ? group(facility.amount.text) : cellText(facility.amount);

/** How a facility is drawn: a filled rect only for a positive stated amount ("amount"). */
export function kindOf(facility: StackFacility): StackSegment["kind"] {
  const { amount } = facility;
  if (amount.kind === "gap") return "gap";
  if (amount.kind === "text" || amount.value < 0) return "words";
  return amount.value === 0 ? "zero" : "amount";
}

/** The facility's cells beside its name: ranking, secured flag and cumulative leverage as written. */
function facilityDetail(facility: StackFacility) {
  return [
    `Ranking ${String(facility.ranking)}`,
    `Secured: ${safeText(facility.secured)}`,
    `Cumulative leverage ${cellText(facility.leverage)}`,
  ].join(" · ");
}

/** Where each segment and its words sit at `width` px. */
export function stackLayout(stack: DebtStack, width: number): StackLayout {
  const narrow = width < NARROW;
  const column = narrow ? 40 : 64;
  const textX = column + (narrow ? 16 : 28);
  const room = width - textX;
  const amounts = stack.facilities.map(amountText);
  const stated = (facility: StackFacility) => ["amount", "zero"].includes(kindOf(facility));
  const widest = Math.max(
    0,
    ...stack.facilities.map((facility, at) =>
      stated(facility) ? textWidth(amounts[at] ?? "", SIZE.value) : 0,
    ),
  );
  // Words: the name (with the amount at the right end when wide), then the stated cells.
  let y = 0;
  const words = stack.facilities.map((facility, at) => {
    const previous = stack.facilities[at - 1];
    if (previous && previous.ranking !== facility.ranking) y += RANK_BREAK;
    const kind = kindOf(facility);
    const written = stated(facility);
    const name = wrap(safeText(facility.facility), narrow || !written ? room : room - widest - 16);
    const detail = wrap(
      narrow && written
        ? `${amounts[at] ?? ""} · ${facilityDetail(facility)}`
        : facilityDetail(facility),
      room,
    );
    const reason = written ? [] : wrap(amounts[at] ?? "", room);
    const lines = name.length + detail.length + reason.length;
    const top = y;
    y += lines * LINE + AFTER;
    return {
      facility,
      kind,
      name,
      detail,
      reason,
      top,
      middle: top + 6 + (lines * LINE) / 2 - LINE / 2,
    };
  });
  const textHeight = Math.max(SHORTEST, y - AFTER);
  // The column: as tall as the words; the stated positive amounts share what the slots leave.
  const breaks = words.flatMap((one, at) => {
    const previous = words[at - 1];
    return previous && previous.facility.ranking !== one.facility.ranking ? [at] : [];
  });
  const fixed = words.filter((one) => one.kind === "gap" || one.kind === "words").length * GAP_SLOT;
  const positive = stack.facilities.reduce(
    (total, facility) =>
      total +
      (facility.amount.kind === "number" && facility.amount.value > 0 ? facility.amount.value : 0),
    0,
  );
  const scale =
    positive > 0 ? Math.max(0, textHeight - fixed - breaks.length * RANK_BREAK) / positive : 0;
  let top = 0;
  const breakYs: number[] = [];
  const segments = words.map((one, at): StackSegment => {
    if (breaks.includes(at)) {
      breakYs.push(top + RANK_BREAK / 2);
      top += RANK_BREAK;
    }
    const { amount } = one.facility;
    const height =
      one.kind === "amount" && amount.kind === "number"
        ? amount.value * scale
        : one.kind === "zero"
          ? 0
          : GAP_SLOT;
    const segment: StackSegment = {
      facility: one.facility,
      y: top,
      height,
      kind: one.kind,
      name: one.name,
      detail: one.detail,
      reason: one.reason,
      textTop: one.top,
      textMiddle: one.middle,
      amountText: amounts[at] ?? "",
    };
    top += height;
    return segment;
  });
  return {
    narrow,
    width,
    height: Math.max(top, textHeight) + 4,
    column,
    textX,
    segments,
    breaks: breakYs,
  };
}

/** The figure's reading: each facility in ranking order with its stated cells. */
export function stackReading(stack: DebtStack) {
  const parts = stack.facilities.map(
    (facility) =>
      `${safeText(facility.facility)} ${amountText(facility)}, ${facilityDetail(facility)}`,
  );
  return `Debt stack, ${stack.unit}, in ranking order, first claim at the top: ${parts.join("; ")}.`;
}

/** The table view: every cell of each facility as written, the basis words without sources. */
export function stackTable(stack: DebtStack): TableViewData {
  return {
    caption: `Debt stack, ${stack.unit}`,
    headers: [
      "Facility",
      "Ranking",
      "Secured",
      `Amount, ${stack.unit}`,
      "Cumulative leverage",
      "Basis and limitation",
    ],
    rows: stack.facilities.map((facility) => [
      safeText(facility.facility),
      String(facility.ranking),
      safeText(facility.secured),
      amountText(facility),
      cellText(facility.leverage),
      facility.basis ?? "",
    ]),
  };
}
