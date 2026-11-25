/** Text inside a figure drawn at its frame's own width: one pixel is one user unit. */
export const TEXT = 12;
/** An estimate of a 12 px glyph's advance: mono figures and body words. Generous, so a label
 * placed by it stays clear. */
const ADVANCE = { mono: 7.4, body: 7 } as const;

export const textWidth = (text: string, face: keyof typeof ADVANCE = "body") =>
  text.length * ADVANCE[face];

/** Words in lines that fit `room` pixels; a single word longer than the room keeps its own line. */
export function wrapText(text: string, room: number, face: keyof typeof ADVANCE = "body") {
  const most = Math.max(1, Math.floor(room / ADVANCE[face]));
  const lines: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const last = lines.at(-1);
    if (last !== undefined && last.length + 1 + word.length <= most)
      lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines.length ? lines : [""];
}

/** The least distance between two tick labels' centres. */
const TICK_GAP = 40;

/**
 * The ticks an axis `room` pixels long can label without crowding: zero first, then the two
 * ends, then the rest, each kept only when clear of every label already kept. A label is moved in
 * from an edge so it stays inside the axis.
 */
export function thinTicks(ticks: { label: string; x: number; value?: number }[], room: number) {
  const placed = ticks.map((tick) => {
    const half = textWidth(tick.label, "mono") / 2;
    return { ...tick, half, x: Math.min(Math.max(tick.x, half), Math.max(half, room - half)) };
  });
  const zero = placed.filter((tick) => tick.value === 0 || tick.label === "0");
  const ends = [placed[0], placed.at(-1)].filter((tick) => tick !== undefined);
  const kept: typeof placed = [];
  for (const tick of [...zero, ...ends, ...placed]) {
    const clear = kept.every(
      (other) =>
        other !== tick &&
        Math.abs(other.x - tick.x) >= Math.max(TICK_GAP, other.half + tick.half + 6),
    );
    if (clear && !kept.includes(tick)) kept.push(tick);
  }
  return kept.sort((a, b) => a.x - b.x).map(({ label, x }) => ({ label, x }));
}

/** A label's centre moved in from the edges of `room` so the label stays inside. */
export function inside(x: number, label: string, room: number, face: "mono" | "body" = "mono") {
  const half = textWidth(label, face) / 2;
  return Math.min(Math.max(x, half), Math.max(half, room - half));
}
