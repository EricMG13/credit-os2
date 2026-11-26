/** Measures a rendered SVG figure's text the way a browser draws it, for the marks' tests. */
type Box = { left: number; right: number; top: number; bottom: number };

const num = (element: Element, name: string) => Number(element.getAttribute(name));

/** A text's size in user units: its font-size attribute. */
const fontOf = (text: Element) => num(text, "font-size");

/** A text label's box, from its position, anchor and font size (monospace, 0.6 em a glyph). */
function labelBox(text: Element): Box {
  const size = fontOf(text);
  const width = text.textContent.length * size * 0.6;
  const x = num(text, "x");
  const y = num(text, "y");
  const anchor = text.getAttribute("text-anchor") ?? "start";
  const left = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  return { left, right: left + width, top: y - size * 0.8, bottom: y + size * 0.2 };
}

/** Whether a drawn line passes through a box (Liang-Barsky clipping). */
function crosses(line: Element, box: Box) {
  const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map((name) => num(line, name)) as [
    number,
    number,
    number,
    number,
  ];
  let [from, to] = [0, 1];
  const edges = [
    [x1 - x2, x1 - box.left],
    [x2 - x1, box.right - x1],
    [y1 - y2, y1 - box.top],
    [y2 - y1, box.bottom - y1],
  ] as const;
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) from = Math.max(from, t);
    else to = Math.min(to, t);
    if (from > to) return false;
  }
  return true;
}

const meet = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const labels = (mark: Element) => [...mark.querySelectorAll("text:not([data-tick])")];

/** The figure labels of a mark (not its axis ticks) that a connector or gridline strikes. */
export function struck(mark: Element, lines: string) {
  return labels(mark).flatMap((text) =>
    [...mark.querySelectorAll(lines)].some((line) => crosses(line, labelBox(text)))
      ? [text.textContent]
      : [],
  );
}

const viewOf = (mark: Element) => {
  const [, , width = 0, height = 0] = (mark.getAttribute("viewBox") ?? "").split(" ").map(Number);
  return { width, height };
};

/** The labels of a mark that reach outside its drawing. */
export function outside(mark: Element) {
  const { width, height } = viewOf(mark);
  return [...mark.querySelectorAll("text")].flatMap((text) => {
    const box = labelBox(text);
    return box.left < 0 || box.right > width || box.top < 0 || box.bottom > height
      ? [text.textContent]
      : [];
  });
}

/** Pairs of texts of a mark that overprint each other. */
export function overprinted(mark: Element) {
  const texts = [...mark.querySelectorAll("text")];
  return texts.flatMap((text, at) =>
    texts
      .slice(at + 1)
      .filter((other) => meet(labelBox(text), labelBox(other)))
      .map((other) => `${text.textContent} / ${other.textContent}`),
  );
}

/** Texts drawn under `least` px on screen when the mark is rendered `rendered` px wide. */
export function tooSmall(mark: Element, rendered: number, least = 12) {
  const scale = rendered / viewOf(mark).width;
  return [...mark.querySelectorAll("text")].flatMap((text) =>
    fontOf(text) * scale >= least - 1e-6
      ? []
      : [`${text.textContent} at ${String(fontOf(text) * scale)}`],
  );
}
