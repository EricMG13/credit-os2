import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ReportReader } from "./ReportLibrary";
import { IdentityBand } from "./report/IdentityBand";
import { readerText } from "./publishedReport";
import type {
  Block,
  CatalogueRating,
  OutputEntry,
  PublishedRun,
  Section,
  Snapshot,
} from "./publishedReport";

const GAP_DESCRIPTION = "Business description not in this run";
const GAP_RATINGS = "Ratings not entered for this run";

const table = (line: number, headers: string[], rows: string[][]): Block => ({
  type: "table",
  line,
  headers,
  rows: rows.map((cells, index) => ({ line: line + 2 + index, cells })),
});
const section = (heading: string, line: number, blocks: Block[]): Section => ({
  heading,
  level: 3,
  line,
  blocks,
});
const profile = (rows: string[][]) =>
  section("Company profile", 10, [table(12, ["Field", "Detail"], rows)]);
const register = (cells: string[]) =>
  section("company_description - Register", 20, [
    table(22, ["Issuer", "Business description", "Country", "Sector"], [cells]),
  ]);

type Rating = {
  label: string;
  agency: string;
  scope: "issuer" | "facility";
  outlook: string;
  date: string;
};

function fixture({
  handoff,
  ratings,
  sector = "",
}: {
  handoff?: Section[];
  ratings?: Rating[];
  sector?: string;
} = {}) {
  const modules = handoff ? { "CP-1A": { outputs: ["cp1a"], default: "cp1a" } } : {};
  const run = {
    folder: "acme",
    issuer: "Acme",
    asOf: "2026-11-16",
    period: "FY2026",
    pathway: "credit_snapshot",
    modules,
    evidence: { sources: [], unused: [], unrecorded: [], handoffs: [], downloads: [], zip: null },
  } as unknown as PublishedRun;
  return {
    catalogue: {
      real: [
        {
          id: "acme",
          name: "Acme",
          issuer: "Acme",
          title: "",
          date: "",
          period: "FY2026",
          sector,
          metrics: {},
          ratings,
        },
      ],
    },
    workspace: {
      runs: { acmeKey: run },
      outputs: handoff
        ? {
            cp1a: {
              id: "cp1a",
              run: "acmeKey",
              module: "CP-1A",
              sha256: "a".repeat(64),
              label: "CP-1A",
              href: "",
            },
          }
        : {},
      handoffs: handoff ? { ["a".repeat(64)]: handoff } : {},
      models: [],
    },
    chips: {},
  } as unknown as Snapshot;
}

async function band(snapshot: Snapshot, hash = "#overview") {
  window.history.replaceState(null, "", `/${hash}`);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(snapshot)));
  render(<ReportReader id="acme" mode="synthetic" />);
  return await screen.findByRole("region", { name: "Company" });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

const ratings: Rating[] = [
  { label: "B1", agency: "Moody's", scope: "issuer", outlook: "Stable", date: "2026-09-30" },
  { label: "B+", agency: "S&P", scope: "facility", outlook: "Positive", date: "2026-08-15" },
];

it("draws each rating as a tile, in order, with Facility beside a facility agency", async () => {
  const el = await band(fixture({ ratings }));
  const text = el.textContent;
  const order = ["Moody's", "B1", "Stable", "S&P", "Facility", "B+", "Positive"].map((word) =>
    text.indexOf(word),
  );
  expect(order.every((at) => at >= 0)).toBe(true);
  expect(order).toEqual([...order].sort((a, b) => a - b));
  expect(el.querySelector('[title="as of 2026-09-30"]')).not.toBeNull();
  expect(el.querySelector('[title="as of 2026-08-15"]')).not.toBeNull();
  expect(within(el).queryByText(GAP_RATINGS)).toBeNull();
});

it("captions the ratings as entered at run start, once, only when there are ratings", async () => {
  const el = await band(fixture({ ratings }));
  expect(within(el).getAllByText("Entered at run start")).toHaveLength(1);
  expect(within(el).getByText("Entered at run start")).toBeVisible();
  cleanup();
  const none = await band(fixture());
  expect(within(none).queryByText("Entered at run start")).toBeNull();
});

it("draws the handoff's description and sector exactly", async () => {
  const el = await band(
    fixture({
      handoff: [
        profile([
          ["Business", "Designs and makes proprietary aircraft components."],
          ["Sector and segments", "Aerospace and defence components"],
        ]),
      ],
    }),
  );
  expect(within(el).getByText("Designs and makes proprietary aircraft components.")).toBeVisible();
  expect(within(el).getByText("Aerospace and defence components")).toBeVisible();
  expect(
    within(el).getByRole("button", { name: "Show sources for Business description" }),
  ).toBeInTheDocument();
});

it("prefers the catalogue sector over the handoff's", async () => {
  const el = await band(
    fixture({
      sector: "Aerospace & defense",
      handoff: [
        profile([
          ["Business", "Designs and makes proprietary aircraft components."],
          ["Sector and segments", "Aerospace and defence components"],
        ]),
      ],
    }),
  );
  expect(within(el).getByText("Aerospace & defense")).toBeVisible();
  expect(within(el).queryByText("Aerospace and defence components")).toBeNull();
});

it("prefers the company_description register over a Company profile table", async () => {
  const el = await band(
    fixture({
      handoff: [
        profile([["Business", "From the profile."]]),
        register(["Acme", "From the register.", "UK", "Industrial sector"]),
      ],
    }),
  );
  expect(within(el).getByText("From the register.")).toBeVisible();
  expect(within(el).queryByText("From the profile.")).toBeNull();
  expect(within(el).getByText("Industrial sector")).toBeVisible();
});

it("shows both gaps with no CP-1A and no ratings", async () => {
  const el = await band(fixture());
  expect(within(el).getByText(GAP_DESCRIPTION)).toBeVisible();
  expect(within(el).getByText(GAP_RATINGS)).toBeVisible();
});

it("shows the gap rather than guess between two Business rows", async () => {
  const el = await band(
    fixture({
      handoff: [
        profile([
          ["Business", "First."],
          ["Business", "Second."],
        ]),
      ],
    }),
  );
  expect(within(el).getByText(GAP_DESCRIPTION)).toBeVisible();
  expect(within(el).queryByText("First.")).toBeNull();
  expect(within(el).queryByText("Second.")).toBeNull();
});

it("sits between the heading and the report navigation on every tab", async () => {
  for (const hash of ["#overview", "#modules", "#forecast", "#evidence"]) {
    const el = await band(fixture({ ratings }), hash);
    const heading = screen.getByRole("heading", { level: 1 });
    const nav = screen.getByRole("navigation", { name: "Report sections" });
    expect(heading.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(el.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(el.tagName).toBe("SECTION");
    cleanup();
  }
});

const bandEntry = (sections: Section[]) =>
  ({
    selected: true,
    output: { module: "CP-1A", id: "x", label: "CP-1A" },
    sections,
  }) as unknown as OutputEntry;
const emptyCatalogue = {
  id: "a",
  name: "A",
  issuer: "A",
  title: "",
  date: "",
  period: "",
  sector: "",
  metrics: {},
};

it("shows the unambiguous profile sector when Business rows are ambiguous", () => {
  render(
    <IdentityBand
      catalogue={emptyCatalogue}
      folder="f"
      entries={[
        bandEntry([
          section("Company profile", 10, [
            table(
              12,
              ["Field", "Detail"],
              [
                ["Business", "One."],
                ["Business", "Two."],
                ["Sector and segments", "Aero"],
              ],
            ),
          ]),
        ]),
      ]}
    />,
  );
  const el = screen.getByRole("region", { name: "Company" });
  expect(within(el).queryByText("Aero")).not.toBeNull();
  cleanup();
});

it("falls back to the profile sector when the register Sector cell is empty", () => {
  render(
    <IdentityBand
      catalogue={emptyCatalogue}
      folder="f"
      entries={[
        bandEntry([
          profile([
            ["Business", "P."],
            ["Sector and segments", "Aero"],
          ]),
          register(["A", "R.", "UK", ""]),
        ]),
      ]}
    />,
  );
  const el = screen.getByRole("region", { name: "Company" });
  expect(within(el).queryByText("R.")).not.toBeNull();
  expect(within(el).queryByText("Aero")).not.toBeNull();
  cleanup();
});

const outlookStatus = (el: HTMLElement, word: string) => {
  const holder = within(el).getByText(word).closest("span") as HTMLElement;
  return ["text-success-text", "text-error-text"].filter((name) => holder.className.includes(name));
};

it("colours the outlook only for Positive and Negative, by its first word", async () => {
  const outlooks = ["Positive", "Negative watch", "Stable", "Developing"];
  const el = await band(
    fixture({
      ratings: outlooks.map((outlook, index) => ({
        label: `R${String(index)}`,
        agency: `Agency ${String(index)}`,
        scope: "issuer" as const,
        outlook,
        date: "2026-09-30",
      })),
    }),
  );
  expect(outlookStatus(el, "Positive")).toEqual(["text-success-text"]);
  expect(outlookStatus(el, "Negative watch")).toEqual(["text-error-text"]);
  expect(outlookStatus(el, "Stable")).toEqual([]);
  expect(outlookStatus(el, "Developing")).toEqual([]);
});

it("draws handoff company text through readerText, and the catalogue sector as entered", async () => {
  const raw = "Makes components; see CP-2A for the downside case.";
  const el = await band(fixture({ handoff: [profile([["Business", raw]])] }));
  const shown = readerText(raw);
  expect(shown).not.toContain("CP-2A");
  const span = within(el).getByText(shown);
  expect(span.textContent).toBe(shown);
  expect(span.getAttribute("title")).toBe(shown);
  cleanup();
  const own = await band(fixture({ sector: "Sector CP-1 note" }));
  expect(within(own).getByText("Sector CP-1 note")).toBeVisible();
});

it("draws a handoff sector through readerText", async () => {
  const raw = "Aerospace, see CP-2A";
  const el = await band(fixture({ handoff: [profile([["Sector and segments", raw]])] }));
  expect(within(el).getByText(readerText(raw))).toBeVisible();
  expect(readerText(raw)).not.toContain("CP-2A");
});

const FILE = "TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl";

it("draws no description text or title when the handoff's description holds a file name", async () => {
  const raw = `Designs aircraft components (${FILE}, page 4).`;
  const el = await band(fixture({ handoff: [profile([["Business", raw]])] }));
  expect(el.innerHTML).not.toContain(FILE);
  expect(el.querySelector("[title]")).toBeNull();
  expect(within(el).getByText("Business description in Evidence")).toBeVisible();
});

it("draws no description text when the register's description holds a register id", async () => {
  const raw = "Makes components; see CP-1A-FACT-004.";
  const el = await band(fixture({ handoff: [register(["A", raw, "US", "Aero"])] }));
  expect(el.innerHTML).not.toContain("CP-1A-FACT-004");
  expect(within(el).getByText("Business description in Evidence")).toBeVisible();
});

it("omits a handoff sector that holds a reference", async () => {
  const raw = `Aerospace per ${FILE}`;
  const el = await band(fixture({ handoff: [profile([["Sector and segments", raw]])] }));
  expect(el.innerHTML).not.toContain(FILE);
});

it("gives a rating with no date no title", async () => {
  const el = await band(
    fixture({
      ratings: [{ label: "B1", agency: "Moody's", scope: "issuer", outlook: "", date: "" }],
    }),
  );
  expect(el.querySelector("li")?.hasAttribute("title")).toBe(false);
});

const NOTE = "Ratings & triggers shows a different rating for";
const HEAD = ["Agency", "Issuer/instrument", "Rating", "Outlook/watch", "Effective date"];
const evidenceRegister = (rows: string[][], heading = "T2R.1 Rating evidence register") =>
  section(heading, 30, [table(32, HEAD, rows)]);
const ratingsEntry = (sections: Section[], state?: { established: boolean }) =>
  ({
    selected: true,
    output: { module: "CP-2H", id: "y", label: "CP-2H", state },
    sections,
  }) as unknown as OutputEntry;
const entered = (agency: string, label: string): CatalogueRating => ({
  label,
  agency,
  scope: "issuer",
  outlook: "Negative",
  date: "2025-01-01",
});
const bandWith = (entry: OutputEntry | undefined, rated: CatalogueRating[]) => {
  render(
    <IdentityBand
      catalogue={{ ...emptyCatalogue, ratings: rated }}
      folder="f"
      entries={entry ? [entry] : []}
    />,
  );
  return screen.getByRole("region", { name: "Company" });
};
const moody = [entered("Moody's", "B1")];

it("notes a different rating for the agency, links to the module, keeps the entered rating", () => {
  const el = bandWith(
    ratingsEntry([
      evidenceRegister([["Moody's", "Issuer", "B2", "Negative", "2025-01-10", "a source"]]),
    ]),
    moody,
  );
  expect(within(el).getByText(`${NOTE} Moody's`)).toBeVisible();
  const link = within(el).getByRole("link", { name: `${NOTE} Moody's` });
  expect(link.getAttribute("href")).toMatch(/#modules\/CP-2H$/);
  expect(within(el).getByText("B1")).toBeVisible();
  expect(el.textContent).not.toContain("B2");
  expect(el.textContent).not.toContain("CP-2H");
});

it("draws no note when the rating matches after case and spacing", () => {
  const el = bandWith(
    ratingsEntry([evidenceRegister([["moody's", "Issuer", " b1 ", "Negative", ""]])]),
    moody,
  );
  expect(within(el).queryByText(new RegExp(NOTE))).toBeNull();
});

it("draws no note when any row for the agency has the entered rating", () => {
  const el = bandWith(
    ratingsEntry([
      evidenceRegister([
        ["Moody's", "Instrument", "B2", "", ""],
        ["Moody's", "Issuer", "B1", "", ""],
      ]),
    ]),
    moody,
  );
  expect(within(el).queryByText(new RegExp(NOTE))).toBeNull();
});

it("names every differing agency, in entered order, once", () => {
  const el = bandWith(
    ratingsEntry([
      evidenceRegister([
        ["Moody's", "Issuer", "B2", "", ""],
        ["S&P", "Issuer", "B", "", ""],
      ]),
    ]),
    [entered("Moody's", "B1"), entered("S&P", "B+")],
  );
  expect(within(el).getAllByText(new RegExp(NOTE))).toHaveLength(1);
  expect(within(el).getByText(`${NOTE} Moody's, S&P`)).toBeVisible();
});

it("draws no note for an agency absent from the register, without CP-2H, or when it is blocked", () => {
  const fitch = ratingsEntry([evidenceRegister([["Fitch", "Issuer", "B", "", ""]])]);
  expect(within(bandWith(fitch, moody)).queryByText(new RegExp(NOTE))).toBeNull();
  cleanup();
  expect(within(bandWith(undefined, moody)).queryByText(new RegExp(NOTE))).toBeNull();
  cleanup();
  const closed = ratingsEntry([evidenceRegister([["Moody's", "Issuer", "B2", "", ""]])], {
    established: false,
  });
  expect(within(bandWith(closed, moody)).queryByText(new RegExp(NOTE))).toBeNull();
});

it("recognises the register heading the way the back end does", () => {
  const rows = [["Moody's", "Issuer", "B2", "", ""]];
  const noted = (heading: string) => {
    const el = bandWith(ratingsEntry([evidenceRegister(rows, heading)]), moody);
    const found = within(el).queryByText(new RegExp(NOTE)) !== null;
    cleanup();
    return found;
  };
  expect(noted("1. **T2R.1** — Rating evidence register")).toBe(true);
  expect(noted("`T2R.1` Rating evidence")).toBe(true);
  expect(noted("T2R.10 Rating evidence register")).toBe(false);
  expect(noted("T2R.1.2 Rating evidence register")).toBe(false);
  expect(noted("Rating evidence register")).toBe(false);
});

it("draws no note when two sections match the register", () => {
  const rows = [["Moody's", "Issuer", "B2", "", ""]];
  const el = bandWith(
    ratingsEntry([evidenceRegister(rows), evidenceRegister(rows, "T2R.1 again")]),
    moody,
  );
  expect(within(el).queryByText(new RegExp(NOTE))).toBeNull();
});

const FULL_HEAD = [
  "agency",
  "issuer/instrument",
  "rating",
  "outlook/watch",
  "effective date",
  "source",
  "locator",
  "status",
];
const fullRow = (agency: string, level: string, rating: string) => [
  agency,
  level,
  rating,
  "",
  "",
  "",
  "",
  "",
];
const fullRegister = (rows: string[][], head = FULL_HEAD) =>
  ratingsEntry([section("T2R.1 Rating evidence register", 30, [table(32, head, rows)])]);
const facility = (agency: string, label: string): CatalogueRating => ({
  ...entered(agency, label),
  scope: "facility",
});
const noteCount = (el: HTMLElement) => within(el).queryAllByText(new RegExp(NOTE)).length;

it("compares only the issuer rating, never a facility entry", () => {
  const el = bandWith(fullRegister([fullRow("Moody's", "Issuer (CFR)", "B1")]), [
    entered("Moody's", "B1"),
    facility("Moody's", "B2"),
  ]);
  expect(noteCount(el)).toBe(0);
});

it("draws no note when the register lists only instrument rows for the agency", () => {
  const el = bandWith(fullRegister([fullRow("Moody's", "Senior secured notes", "B2")]), moody);
  expect(noteCount(el)).toBe(0);
});

it("treats a qualified register rating as equal by its first word", () => {
  const el = bandWith(
    fullRegister([fullRow("Moody's", "Corporate family rating", "B1 (CFR)")]),
    moody,
  );
  expect(noteCount(el)).toBe(0);
});

it("notes a difference when the issuer row differs, even if an instrument row matches", () => {
  const el = bandWith(
    fullRegister([
      fullRow("Moody's", "Issuer", "B2"),
      fullRow("Moody's", "Senior secured notes", "B1"),
    ]),
    moody,
  );
  expect(within(el).getByText(`${NOTE} Moody's`)).toBeVisible();
});

it("names an agency once when two issuer entries both differ", () => {
  const el = bandWith(fullRegister([fullRow("Moody's", "Issuer", "B2")]), [
    entered("Moody's", "B1"),
    entered("Moody's", "Ba3"),
  ]);
  expect(within(el).getByText(`${NOTE} Moody's`)).toBeVisible();
});

it("draws no note for a facility-only entry against an issuer register row", () => {
  const el = bandWith(fullRegister([fullRow("S&P", "Issuer", "B")]), [facility("S&P", "B+")]);
  expect(noteCount(el)).toBe(0);
});

it("draws no note when the register has no issuer/instrument column", () => {
  const el = bandWith(fullRegister([["Moody's", "B2"]], ["agency", "rating"]), moody);
  expect(noteCount(el)).toBe(0);
});
