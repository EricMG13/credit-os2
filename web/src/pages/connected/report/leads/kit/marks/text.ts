/** Below this measured width a mark draws its narrow layout: one measure per row, label above. */
export const NARROW = 520;

/** Real text sizes in px (the viewBox is the measured width, so one unit is one pixel). */
export const SIZE = { label: 12, value: 12, tick: 12 } as const;

/** The two bar heights of every lead mark: a bar (a value, a level, a step) and a slim bar (a prior period, a thin strip). */
export const BAR = 16;
export const SLIM = 5;

/** Line pitch for wrapped 12 px text. */
export const LINE = 15;

/**
 * A conservative width estimate for text: 0.6 em per character, which holds Geist Mono and is
 * wider than Geist's average, so a box laid out with it does not run into its neighbour.
 */
export const textWidth = (text: string, size: number = SIZE.label) => text.length * size * 0.6;

/** Words wrapped into lines no wider than `width` px; a word longer than a line stands alone. */
export function wrap(text: string, width: number, size: number = SIZE.label) {
  const most = Math.max(1, Math.floor(width / (size * 0.6)));
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > most && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/** The stated figure with its sign shown: `+70`, `−10`, `0`. A hyphen minus becomes U+2212. */
export function signedText(text: string, value: number) {
  const bare = text.trim();
  // An accounting negative, "(10)", is written with the minus sign.
  const trimmed = /^\(.*\)$/.test(bare) ? `−${bare.slice(1, -1)}` : bare.replace(/^-/, "−");
  if (/^[+−]/.test(trimmed)) return trimmed;
  return value > 0 ? `+${trimmed}` : value < 0 ? `−${trimmed}` : trimmed;
}

/** A colon-free id for SVG `url(#…)` references, from React's `useId`. */
export const svgId = (id: string, part: string) => `${id.replace(/[^\w-]/g, "")}-${part}`;

/**
 * A gap's words as a mark draws them: "—" for a cell the source left as a dash (the reason, or
 * the stated-gap reason, is exactly "source dash"); any other text as given.
 */
export const gapWords = (text: string) =>
  /^(?:Not (?:supplied|calculable|calculated|applicable):\s*)?source dash$/i.test(text.trim())
    ? "—"
    : text;
