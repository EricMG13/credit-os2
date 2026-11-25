import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { EVENT_HEADERS, eventLane, eventRecords } from "./EventLane";
import { KEY_EVENTS, KEY_GAPS, KEY_ORDER, KEY_YEARS, type KeyEvent } from "./EventLane.fixture";

const cells = (e: KeyEvent) => [
  e.date,
  e.precision,
  e.published,
  e.event,
  e.status,
  e.source,
  e.relevance,
];

function draw(events: KeyEvent[] = KEY_EVENTS, evidenceInDrawer?: boolean) {
  const table = { line: 0, headers: EVENT_HEADERS, rows: events.map(cells), evidenceInDrawer };
  return render(eventLane(table, (index) => <span>owner-{String(index)}</span>));
}

function listItemOf(index: number) {
  const item = screen.getByText(`owner-${String(index)}`).closest("li");
  if (!item) throw new Error("no list item");
  return item;
}

function panelOf(index: number) {
  const panel = listItemOf(index).querySelector<HTMLElement>("[id$='-details']");
  if (!panel) throw new Error("no panel");
  return panel;
}

function markerOf(index: number) {
  const id = listItemOf(index).id;
  const marker = document.querySelector(`button[aria-controls="${id}"]`);
  if (!marker) throw new Error("no marker");
  return marker as HTMLElement;
}

const strip = () => screen.getByRole("group", { name: "Events by year" });
const list = () => screen.getByRole("group", { name: "Events in date order" });
const yearLabel = (n: number) => (n === 1 ? "1 event" : `${String(n)} events`);

it.each(["constructor", "toString", "valueOf"])(
  "ignores inherited precision name %s safely",
  (precision) => {
    const table = {
      line: 1,
      headers: EVENT_HEADERS,
      rows: [["2026-01-01", precision, "2025-12-01", "Event", "Historical", "Source", "Relevant"]],
    };
    expect(eventRecords(table)).toEqual([]);
  },
);

it("draws one marker and one list item per event, each marker pointing at a distinct row", () => {
  draw();
  const markers = Array.from(strip().querySelectorAll<HTMLElement>("button[aria-controls]"));
  const items = within(list()).getAllByRole("listitem");
  expect(markers).toHaveLength(KEY_EVENTS.length);
  expect(items).toHaveLength(KEY_EVENTS.length);
  const targets = markers.map((marker) =>
    document.getElementById(marker.getAttribute("aria-controls") ?? ""),
  );
  expect(new Set(targets).size).toBe(KEY_EVENTS.length);
  targets.forEach((target) => {
    expect(items).toContain(target);
  });
});

it.each(KEY_EVENTS.map((event, index) => [event.event + " " + event.date, event, index] as const))(
  "draws every module-written string of %s once, in the right year group",
  (_name, key, index) => {
    draw();
    const item = within(listItemOf(index));
    expect(item.getAllByText(key.event, { exact: true })).toHaveLength(1);
    expect(item.getAllByText(key.relevance, { exact: true })).toHaveLength(1);
    const panelEl = panelOf(index);
    const panel = within(panelEl);
    expect(panel.getAllByText(key.status, { exact: true })).toHaveLength(1);
    expect(panel.getAllByText(`Published ${key.published}`, { exact: true })).toHaveLength(1);
    expect(panel.getAllByText(key.source, { exact: true })).toHaveLength(1);
    expect(item.getAllByText(`${key.date} · ${key.precision}`, { exact: true })).toHaveLength(1);
    expect(
      item.queryAllByText(key.category, { exact: true }).filter((el) => !panelEl.contains(el)),
    ).toHaveLength(1);
    expect(listItemOf(index).querySelectorAll(".sr-only")).toHaveLength(0);
    const marker = markerOf(index);
    expect(marker).toHaveAccessibleName(
      `${key.event}, ${key.date}, ${key.precision}, ${key.status}`,
    );
    expect(marker).toHaveAttribute("data-event-category", key.category);
    expect(marker).toHaveAttribute("data-event-precision", key.precision);
    const n = KEY_EVENTS.filter((e) => e.year === key.year).length;
    expect(
      within(strip()).getByRole("group", { name: `${key.year}, ${yearLabel(n)}` }),
    ).toContainElement(marker);
    const group = within(list())
      .getAllByRole("group")
      .find((g) => g.textContent.startsWith(key.year) && g.contains(listItemOf(index)));
    expect(group).toBeDefined();
    expect(group).toHaveAccessibleName(key.year);
  },
);

it("draws year groups, gaps and titles in the key order", () => {
  draw();
  const stripYears = within(strip())
    .getAllByRole("group")
    .map((g) => g.getAttribute("aria-label"))
    .filter((label) => /^\d{4}, /.test(label ?? ""));
  expect(stripYears).toEqual(KEY_YEARS.map(([year, n]) => `${year}, ${yearLabel(n)}`));
  const listYears = within(list())
    .getAllByRole("group")
    .map((g) => [g.textContent.slice(0, 4), within(g).getAllByRole("listitem").length]);
  expect(listYears).toEqual(KEY_YEARS.map(([year, n]) => [year, n]));
  const gaps = Array.from(strip().querySelectorAll("*"))
    .filter((el) => /^No events /.test(el.textContent) && !el.children.length)
    .map((el) => el.textContent);
  expect(gaps).toEqual(KEY_GAPS);
  expect(within(strip()).getAllByText(/No events/)).toHaveLength(KEY_GAPS.length);
  const titles = within(list())
    .getAllByRole("listitem")
    .map((item) => KEY_ORDER.find((title) => within(item).queryByText(title, { exact: true })));
  expect(titles).toEqual(KEY_ORDER);
  const used = new Set<number>();
  const expectedOwners = KEY_ORDER.map((title) => {
    const at = KEY_EVENTS.findIndex((e, i) => e.event === title && !used.has(i));
    used.add(at);
    return `owner-${String(at)}`;
  });
  const owners = within(list())
    .getAllByRole("listitem")
    .map((item) => /owner-\d+/.exec(item.textContent)?.[0]);
  expect(owners).toEqual(expectedOwners);
});

it("orders the markers inside each year group like the key", () => {
  draw();
  const used = new Set<number>();
  const ordered = KEY_ORDER.map((title) => {
    const at = KEY_EVENTS.findIndex((e, i) => e.event === title && !used.has(i));
    used.add(at);
    return KEY_EVENTS[at] as KeyEvent;
  });
  KEY_YEARS.forEach(([year, n]) => {
    const group = within(strip()).getByRole("group", { name: `${year}, ${yearLabel(n)}` });
    const labels = Array.from(group.querySelectorAll("button"), (b) =>
      b.getAttribute("aria-label"),
    );
    expect(labels).toEqual(
      ordered
        .filter((e) => e.year === year)
        .map((e) => `${e.event}, ${e.date}, ${e.precision}, ${e.status}`),
    );
  });
});

it("leaves sources to the trace drawer when the host says so", () => {
  draw(KEY_EVENTS, true);
  KEY_EVENTS.forEach(({ source }) => {
    expect(screen.queryByText(source)).toBeNull();
  });
});

it("opens details one row at a time or all together, closed by default", () => {
  draw();
  const status = (index: number) =>
    within(panelOf(index)).getByText(KEY_EVENTS[index]?.status ?? "");
  expect(status(0)).not.toBeVisible();
  const one = within(listItemOf(0)).getByRole("button", { name: "Details for Senior notes due" });
  expect(one).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(one);
  expect(one).toHaveAttribute("aria-expanded", "true");
  expect(status(0)).toBeVisible();
  expect(status(1)).not.toBeVisible();
  fireEvent.click(one);
  expect(status(0)).not.toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Show all details" }));
  KEY_EVENTS.forEach((_, index) => {
    expect(status(index)).toBeVisible();
  });
  fireEvent.click(screen.getByRole("button", { name: "Hide all details" }));
  KEY_EVENTS.forEach((_, index) => {
    expect(status(index)).not.toBeVisible();
  });
});

it("moves focus from a marker to its row and links hover both ways", () => {
  draw();
  fireEvent.click(markerOf(1));
  expect(listItemOf(1)).toHaveFocus();
  fireEvent.mouseEnter(listItemOf(2));
  const active = () =>
    KEY_EVENTS.flatMap((_, index) => [
      ...(markerOf(index).dataset.active === "true" ? [`marker-${String(index)}`] : []),
      ...(listItemOf(index).dataset.active === "true" ? [`row-${String(index)}`] : []),
    ]);
  expect(active()).toEqual(["marker-2"]);
  fireEvent.mouseLeave(listItemOf(2));
  fireEvent.mouseEnter(markerOf(3));
  expect(active()).toEqual(["row-3"]);
});

it("has no headings, names only the categories present, and refuses an unplottable table", () => {
  const subset = KEY_EVENTS.filter((e) => e.category === "Historical" || e.category === "Scenario");
  draw(subset);
  expect(screen.queryAllByRole("heading")).toHaveLength(0);
  const legend = strip().textContent;
  expect(legend).toContain("Historical");
  expect(legend).toContain("Scenario");
  expect(legend).not.toContain("Scheduled");
  expect(legend).not.toContain("User reminder");
  expect(
    eventLane({
      line: 0,
      headers: EVENT_HEADERS,
      rows: [["2027-02-29", "day", "", "x", "Scheduled", "", ""]],
    }),
  ).toBeNull();
});

const toggle = (name: string) => screen.getByRole("button", { name });
const shown = () => within(list()).getAllByRole("listitem");

it("names each present category as a pressed toggle with its count, all on at the start", () => {
  draw();
  const group = within(screen.getByRole("group", { name: "Show categories" }));
  expect(group.getAllByRole("button")).toHaveLength(4);
  expect(group.getByRole("button", { name: "Historical, 6 events" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(group.getByRole("button", { name: "User reminder, 1 event" })).toBeInTheDocument();
  expect(shown()).toHaveLength(KEY_EVENTS.length);
});

it("hides and restores a category in strip, list, year groups and gaps", () => {
  draw();
  fireEvent.click(toggle("Historical, 6 events"));
  expect(toggle("Historical, 6 events")).toHaveAttribute("aria-pressed", "false");
  const kept = KEY_EVENTS.filter((e) => e.category !== "Historical");
  const keptTitles = KEY_ORDER.filter((title) => kept.some((e) => e.event === title));
  expect(
    shown().map((item) => KEY_ORDER.find((t) => within(item).queryByText(t, { exact: true }))),
  ).toEqual(keptTitles);
  expect(strip().querySelectorAll("button[aria-controls]")).toHaveLength(kept.length);
  KEY_EVENTS.forEach((e, index) => {
    if (e.category === "Historical")
      expect(screen.queryByText(`owner-${String(index)}`)).toBeNull();
  });
  ["1998", "2024"].forEach((year) => {
    expect(within(strip()).queryByRole("group", { name: new RegExp(`^${year}, `) })).toBeNull();
    expect(within(list()).queryByRole("group", { name: year })).toBeNull();
  });
  expect(within(strip()).getByRole("group", { name: "2026, 3 events" })).toBeInTheDocument();
  const gapTexts = Array.from(strip().querySelectorAll(".sr-only"), (el) => el.textContent);
  expect(gapTexts).toEqual(KEY_GAPS);
  fireEvent.click(toggle("Historical, 6 events"));
  expect(shown()).toHaveLength(KEY_EVENTS.length);
  expect(Array.from(strip().querySelectorAll(".sr-only"), (el) => el.textContent)).toEqual(
    KEY_GAPS,
  );
});

it("keeps open details across toggling and says so when every category is off", () => {
  draw();
  fireEvent.click(within(listItemOf(0)).getByRole("button", { name: /^Details for/ }));
  fireEvent.click(toggle("Historical, 6 events"));
  expect(within(panelOf(0)).getByText(KEY_EVENTS[0]?.status ?? "")).toBeVisible();
  ["Historical, 6 events", "Scheduled, 5 events", "Scenario, 2 events", "User reminder, 1 event"]
    .filter((name) => !name.startsWith("Historical"))
    .forEach((name) => {
      fireEvent.click(toggle(name));
    });
  expect(screen.getByRole("status")).toHaveTextContent("No categories are selected.");
  expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  expect(within(strip()).queryAllByRole("group", { name: /^\d{4}, / })).toHaveLength(0);
});

it("lets a row's own button close it while all details are shown", () => {
  draw();
  fireEvent.click(screen.getByRole("button", { name: "Show all details" }));
  const one = within(listItemOf(0)).getByRole("button", { name: /^Details for/ });
  fireEvent.click(one);
  expect(one).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByRole("button", { name: "Show all details" })).not.toHaveAttribute(
    "aria-pressed",
  );
  fireEvent.click(one);
  expect(screen.getByRole("button", { name: "Hide all details" })).toBeInTheDocument();
});

it("closes every row on Hide all details, including one clicked while all were shown", () => {
  draw();
  fireEvent.click(screen.getByRole("button", { name: "Show all details" }));
  fireEvent.click(within(listItemOf(0)).getByRole("button", { name: /^Details for/ }));
  fireEvent.click(screen.getByRole("button", { name: "Show all details" }));
  fireEvent.click(screen.getByRole("button", { name: "Hide all details" }));
  KEY_EVENTS.forEach((e, index) => {
    expect(within(panelOf(index)).getByText(e.status)).not.toBeVisible();
  });
});

const SHAPE_OF = {
  Historical: "filled circle",
  Scheduled: "half-filled circle",
  Scenario: "diamond outline",
  "User reminder": "ring",
} as const;

it.each(KEY_EVENTS.map((e, index) => [e.event + " " + e.date, e.category, index] as const))(
  "draws the %s mark as its own category shape in the strip and the row, never the dashed ring",
  (_name, category, index) => {
    draw();
    const expected = SHAPE_OF[category];
    expect(markerOf(index).querySelector("[data-shape]")).toHaveAttribute("data-shape", expected);
    expect(listItemOf(index).querySelector("[data-shape]")).toHaveAttribute("data-shape", expected);
    expect(document.querySelector('[data-shape="dashed ring"]')).toBeNull();
  },
);

it("draws the same shape in each legend toggle", () => {
  draw();
  const legend = screen.getByRole("group", { name: "Show categories" });
  const shapes = within(legend)
    .getAllByRole("button")
    .map((b) => b.querySelector("[data-shape]")?.getAttribute("data-shape"));
  expect(shapes).toEqual(["filled circle", "half-filled circle", "diamond outline", "ring"]);
});

// D-41 (WCAG 2.5.8): a pointer target is at least 24 by 24 CSS px; Tailwind's size-6 is 1.5rem.
it("draws every year marker as a 24 px mark, 32 px to a pointer, four to a row", () => {
  draw();
  const markers = Array.from(strip().querySelectorAll<HTMLElement>("button[aria-controls]"));
  expect(markers.length).toBeGreaterThan(0);
  for (const marker of markers) {
    expect(marker).toHaveClass("size-6");
    expect(marker).not.toHaveClass("size-3.5");
    // Each mark's pointer area reaches 4 px past it, so 8 px gaps keep neighbours' areas apart;
    // four 24 px markers and three 8 px gaps are 120 px, the row's cap (7.5rem).
    expect(marker).toHaveClass("after:-inset-1");
    expect(marker.parentElement).toHaveClass("gap-2", "max-w-[7.5rem]");
  }
});
