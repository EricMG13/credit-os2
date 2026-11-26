import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ReportReader } from "./ReportLibrary";
import { readerText } from "./publishedReport";
import type { Block, PublishedRun, Section, Snapshot } from "./publishedReport";

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

type RatingsOutput = { sections: Section[]; state?: { established: boolean } };

function fixture({
  handoff,
  ratings,
  sector = "",
  ratingsOutput,
}: {
  handoff?: Section[];
  ratings?: Rating[];
  sector?: string;
  ratingsOutput?: RatingsOutput;
} = {}) {
  const modules = {
    ...(handoff && { "CP-1A": { outputs: ["cp1a"], default: "cp1a" } }),
    ...(ratingsOutput && { "CP-2H": { outputs: ["cp2h"], default: "cp2h" } }),
  };
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
      outputs: {
        ...(handoff && {
          cp1a: {
            id: "cp1a",
            run: "acmeKey",
            module: "CP-1A",
            sha256: "a".repeat(64),
            label: "CP-1A",
            href: "",
          },
        }),
        ...(ratingsOutput && {
          cp2h: {
            id: "cp2h",
            run: "acmeKey",
            module: "CP-2H",
            sha256: "b".repeat(64),
            label: "CP-2H",
            href: "",
            state: ratingsOutput.state,
          },
        }),
      },
      handoffs: {
        ...(handoff && { ["a".repeat(64)]: handoff }),
        ...(ratingsOutput && { ["b".repeat(64)]: ratingsOutput.sections }),
      },
      models: [],
    },
    chips: {},
  } as unknown as Snapshot;
}

/** The report header: the region the h1 names, drawn on every report page. */
async function band(snapshot: Snapshot, hash = "#overview") {
  window.history.replaceState(null, "", `/${hash}`);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(snapshot)));
  render(<ReportReader id="acme" mode="synthetic" />);
  return await screen.findByRole("region", { name: "Acme" });
}

const facts = (header: HTMLElement) => within(header).getByRole("list", { name: "Run facts" });
/** The rating chips among the run's fact chips; only they carry the "Entered at run start" title. */
const ratingChips = (header: HTMLElement) =>
  within(facts(header))
    .getAllByRole("listitem")
    .filter((chip) => chip.getAttribute("title")?.startsWith("Entered at run start"));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

const ratings: Rating[] = [
  { label: "B1", agency: "Moody's", scope: "issuer", outlook: "Stable", date: "2026-09-30" },
  { label: "B+", agency: "S&P", scope: "facility", outlook: "Positive", date: "2026-08-15" },
];

it("draws each rating as a chip in the run facts, in order, with facility beside a facility agency", async () => {
  const el = await band(fixture({ ratings }));
  const chips = ratingChips(el);
  expect(chips.map((chip) => chip.textContent)).toEqual([
    "Moody's B1 · Stable",
    "S&P facility B+ · Positive",
  ]);
  expect(chips[0]).toHaveAttribute("title", "Entered at run start, as of 2026-09-30");
  expect(chips[1]).toHaveAttribute("title", "Entered at run start, as of 2026-08-15");
  expect(chips[0]).toBeVisible();
  expect(within(el).queryByText("Ratings not entered for this run")).toBeNull();
});

it("captions the ratings as entered at run start, once and visibly, only when there are ratings", async () => {
  const el = await band(fixture({ ratings }));
  expect(ratingChips(el)).toHaveLength(2);
  expect(within(el).getAllByText("Ratings entered at run start")).toHaveLength(1);
  expect(within(el).getByText("Ratings entered at run start")).toBeVisible();
  // It follows the chips on their line: it never takes a row to itself and splits the facts.
  const caption = within(el).getByText("Ratings entered at run start");
  expect(caption).not.toHaveClass("basis-full");
  expect(caption.previousElementSibling).toBe(ratingChips(el).at(-1));
  expect(caption.nextElementSibling).toBeNull();
  cleanup();
  const none = await band(fixture());
  expect(ratingChips(none)).toHaveLength(0);
  expect(within(none).queryByText("Ratings entered at run start")).toBeNull();
  expect(within(facts(none)).getByText("Ratings not entered")).toBeVisible();
});

it("draws the sector exactly, and no business description, from the handoff", async () => {
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
  expect(within(el).getByText("Aerospace and defence components")).toBeVisible();
  expect(within(el).queryByRole("button", { name: /Show sources/ })).toBeNull();
});

it("draws no business description text anywhere in the header, from the profile or the register", async () => {
  const profileText = "Designs and makes proprietary aircraft components.";
  const registerText = "Register description of the business.";
  const el = await band(
    fixture({
      handoff: [
        profile([
          ["Business", profileText],
          ["Sector and segments", "Aero"],
        ]),
        register(["Acme", registerText, "UK", ""]),
      ],
    }),
  );
  expect(within(el).getByText("Aero")).toBeVisible();
  expect(el.textContent).not.toContain(profileText);
  expect(el.textContent).not.toContain(registerText);
  expect(within(el).queryByText("Business description")).toBeNull();
  expect(within(el).queryByText("Business description not in this run")).toBeNull();
  expect(within(el).queryByText("Business description in Evidence")).toBeNull();
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

it("prefers the company_description register's Sector cell over the profile's sector", async () => {
  const el = await band(
    fixture({
      handoff: [
        profile([
          ["Business", "From the profile."],
          ["Sector and segments", "Profile sector"],
        ]),
        register(["Acme", "From the register.", "UK", "Industrial sector"]),
      ],
    }),
  );
  expect(within(el).getByText("Industrial sector")).toBeVisible();
  expect(within(el).queryByText("Profile sector")).toBeNull();
});

it("shows the ratings gap and no sector line with no CP-1A, no catalogue sector and no ratings", async () => {
  const el = await band(fixture());
  expect(el.querySelector("h1 + p")).toBeNull();
  expect(ratingChips(el)).toHaveLength(0);
  expect(within(facts(el)).getByText("Ratings not entered")).toBeVisible();
});

it("shows the unambiguous profile sector when Business rows are ambiguous", async () => {
  const el = await band(
    fixture({
      handoff: [
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
      ],
    }),
  );
  expect(within(el).getByText("Aero")).toBeVisible();
  expect(el.textContent).not.toMatch(/One\.|Two\./);
});

it("falls back to the profile sector when the register Sector cell is empty", async () => {
  const el = await band(
    fixture({
      handoff: [
        profile([
          ["Business", "P."],
          ["Sector and segments", "Aero"],
        ]),
        register(["A", "R.", "UK", ""]),
      ],
    }),
  );
  expect(within(el).getByText("Aero")).toBeVisible();
  expect(el.textContent).not.toContain("R.");
});

it("draws the heading, the sector, the run facts and the section control in that order on every tab", async () => {
  for (const hash of ["#overview", "#changes", "#modules", "#forecast", "#evidence", "#calendar"]) {
    const el = await band(fixture({ ratings, sector: "Industrial machinery" }), hash);
    const heading = within(el).getByRole("heading", { level: 1, name: "Acme" });
    const sector = within(el).getByText("Industrial machinery");
    const list = facts(el);
    const nav = within(el).getByRole("navigation", { name: "Report sections" });
    const before = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect([before(heading, sector), before(sector, list), before(list, nav)], hash).toEqual([
      true,
      true,
      true,
    ]);
    expect(el.tagName).toBe("SECTION");
    cleanup();
  }
});

/** The outlook's own span inside a rating chip; its class carries the colour. */
const outlookStatus = (el: HTMLElement, word: string) => {
  const holder = within(el).getByText(new RegExp(`${word}$`));
  return ["text-success-text", "text-warning-text", "text-error-text"].filter((name) =>
    holder.className.includes(name),
  );
};

it("draws every outlook neutral, in the analyst's words, with no direction of the page's own", async () => {
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
  for (const outlook of outlooks) expect(outlookStatus(el, outlook)).toEqual([]);
  expect(facts(el).querySelector("svg")).toBeNull();
  expect(ratingChips(el).map((chip) => chip.textContent)).toEqual(
    outlooks.map((outlook, index) => `Agency ${String(index)} R${String(index)} · ${outlook}`),
  );
});

it("draws the catalogue sector as entered", async () => {
  const own = await band(fixture({ sector: "Sector CP-1 note" }));
  expect(within(own).getByText("Sector CP-1 note")).toBeVisible();
});

it("keeps Deliverables identity metadata while omitting handoff-derived identity details", async () => {
  const [enteredRating] = moody;
  if (!enteredRating) throw new Error("Expected a fixture rating");
  const snapshot = fixture({
    sector: "Sector CP-1 note",
    ratings: [{ ...enteredRating, outlook: "Watch negative per CP-2H" }],
    ratingsOutput: {
      sections: [evidenceRegister([fullRow("Moody's", "Issuer (CFR)", "B2")])],
    },
  });
  const [catalogue] = snapshot.catalogue.real;
  if (!catalogue) throw new Error("Expected a fixture catalogue row");
  catalogue.ticker = "CP-2H ticker";
  catalogue.period = "FY2026 CP-2H period";
  const el = await band(snapshot, "#deliverables");
  expect(screen.getByRole("heading", { level: 1, name: "Acme" })).toBeVisible();
  expect(facts(el)).toHaveTextContent("As of 16 November 2026");
  expect(within(el).getByRole("navigation", { name: "Report sections" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Deliverables" })).toBeVisible();
  expect(screen.queryByText("Sector CP-1 note")).toBeNull();
  expect(screen.queryByText(new RegExp(NOTE))).toBeNull();
  expect(document.body.textContent).not.toContain("CP-1");
  expect(document.body.textContent).not.toContain("CP-2H");
  expect(within(facts(el)).getByText("Full credit assessment")).toBeVisible();
});

it("omits an invalid free-text run date from Deliverables metadata", async () => {
  const snapshot = fixture();
  const run = snapshot.workspace.runs.acmeKey;
  if (!run) throw new Error("Expected a fixture run");
  run.asOf = "CP-2H";
  const el = await band(snapshot, "#deliverables");
  expect(document.body.textContent).not.toContain("CP-2H");
  expect(within(facts(el)).queryByText(/As of/)).toBeNull();
});

it("draws a handoff sector through readerText", async () => {
  const raw = "Aerospace, see CP-2A";
  const el = await band(fixture({ handoff: [profile([["Sector and segments", raw]])] }));
  expect(within(el).getByText(readerText(raw))).toBeVisible();
  expect(readerText(raw)).not.toContain("CP-2A");
});

const FILE = "TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl";

it("omits a handoff sector that holds a reference", async () => {
  const raw = `Aerospace per ${FILE}`;
  const el = await band(fixture({ handoff: [profile([["Sector and segments", raw]])] }));
  expect(el.innerHTML).not.toContain(FILE);
  expect(el.querySelector("h1 + p")).toBeNull();
  expect(facts(el).querySelector("[title]")).toBeNull();
});

it("gives a rating with no date a title that says only that it was entered at run start", async () => {
  const el = await band(
    fixture({
      ratings: [{ label: "B1", agency: "Moody's", scope: "issuer", outlook: "", date: "" }],
    }),
  );
  const [chip] = ratingChips(el);
  expect(chip).toHaveAttribute("title", "Entered at run start");
  expect(chip?.textContent).toBe("Moody's B1");
});

const NOTE = "Ratings & triggers shows a different rating for";
const HEAD = ["Agency", "Issuer/instrument", "Rating", "Outlook/watch", "Effective date"];
const evidenceRegister = (rows: string[][], heading = "T2R.1 Rating evidence register") =>
  section(heading, 30, [table(32, HEAD, rows)]);
const entered = (agency: string, label: string): Rating => ({
  label,
  agency,
  scope: "issuer",
  outlook: "Negative",
  date: "2025-01-01",
});
/** The header of a run whose ratings module (CP-2H) holds these sections, with these ratings entered. */
const bandWith = (
  sections: Section[] | undefined,
  rated: Rating[],
  state?: { established: boolean },
) => band(fixture({ ratings: rated, ratingsOutput: sections && { sections, state } }));
const moody = [entered("Moody's", "B1")];

it("notes a different rating for the agency, links to the module, keeps the entered rating", async () => {
  const el = await bandWith(
    [evidenceRegister([["Moody's", "Issuer", "B2", "Negative", "2025-01-10", "a source"]])],
    moody,
  );
  expect(within(el).getByText(`${NOTE} Moody's`)).toBeVisible();
  const link = within(el).getByRole("link", { name: `${NOTE} Moody's` });
  expect(link.getAttribute("href")).toMatch(/#modules\/CP-2H$/);
  expect(ratingChips(el).map((chip) => chip.textContent)).toEqual(["Moody's B1 · Negative"]);
  expect(el.textContent).not.toContain("B2");
  expect(el.textContent).not.toContain("CP-2H");
});

it("draws no note when the rating matches after case and spacing", async () => {
  const el = await bandWith(
    [evidenceRegister([["moody's", "Issuer", " b1 ", "Negative", ""]])],
    moody,
  );
  expect(within(el).queryByText(new RegExp(NOTE))).toBeNull();
});

it("draws no note when any row for the agency has the entered rating", async () => {
  const el = await bandWith(
    [
      evidenceRegister([
        ["Moody's", "Instrument", "B2", "", ""],
        ["Moody's", "Issuer", "B1", "", ""],
      ]),
    ],
    moody,
  );
  expect(within(el).queryByText(new RegExp(NOTE))).toBeNull();
});

it("names every differing agency, in entered order, once", async () => {
  const el = await bandWith(
    [
      evidenceRegister([
        ["Moody's", "Issuer", "B2", "", ""],
        ["S&P", "Issuer", "B", "", ""],
      ]),
    ],
    [entered("Moody's", "B1"), entered("S&P", "B+")],
  );
  expect(within(el).getAllByText(new RegExp(NOTE))).toHaveLength(1);
  expect(within(el).getByText(`${NOTE} Moody's, S&P`)).toBeVisible();
});

it("draws no note for an agency absent from the register, without CP-2H, or when it is blocked", async () => {
  const fitch = [evidenceRegister([["Fitch", "Issuer", "B", "", ""]])];
  expect(within(await bandWith(fitch, moody)).queryByText(new RegExp(NOTE))).toBeNull();
  cleanup();
  expect(within(await bandWith(undefined, moody)).queryByText(new RegExp(NOTE))).toBeNull();
  cleanup();
  const closed = [evidenceRegister([["Moody's", "Issuer", "B2", "", ""]])];
  const blocked = await bandWith(closed, moody, { established: false });
  expect(within(blocked).queryByText(new RegExp(NOTE))).toBeNull();
});

it("recognises the register heading the way the back end does", async () => {
  const rows = [["Moody's", "Issuer", "B2", "", ""]];
  const noted = async (heading: string) => {
    const el = await bandWith([evidenceRegister(rows, heading)], moody);
    const found = within(el).queryByText(new RegExp(NOTE)) !== null;
    cleanup();
    return found;
  };
  expect(await noted("1. **T2R.1** — Rating evidence register")).toBe(true);
  expect(await noted("`T2R.1` Rating evidence")).toBe(true);
  expect(await noted("T2R.10 Rating evidence register")).toBe(false);
  expect(await noted("T2R.1.2 Rating evidence register")).toBe(false);
  expect(await noted("Rating evidence register")).toBe(false);
});

it("draws no note when two sections match the register", async () => {
  const rows = [["Moody's", "Issuer", "B2", "", ""]];
  const el = await bandWith([evidenceRegister(rows), evidenceRegister(rows, "T2R.1 again")], moody);
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
const fullRegister = (rows: string[][], head = FULL_HEAD) => [
  section("T2R.1 Rating evidence register", 30, [table(32, head, rows)]),
];
const facility = (agency: string, label: string): Rating => ({
  ...entered(agency, label),
  scope: "facility",
});
const noteCount = (el: HTMLElement) => within(el).queryAllByText(new RegExp(NOTE)).length;

it("compares only the issuer rating, never a facility entry", async () => {
  const el = await bandWith(fullRegister([fullRow("Moody's", "Issuer (CFR)", "B1")]), [
    entered("Moody's", "B1"),
    facility("Moody's", "B2"),
  ]);
  expect(noteCount(el)).toBe(0);
  expect(ratingChips(el).map((chip) => chip.textContent)).toEqual([
    "Moody's B1 · Negative",
    "Moody's facility B2 · Negative",
  ]);
});

it("draws no note when the register lists only instrument rows for the agency", async () => {
  const el = await bandWith(
    fullRegister([fullRow("Moody's", "Senior secured notes", "B2")]),
    moody,
  );
  expect(noteCount(el)).toBe(0);
});

it("treats a qualified register rating as equal by its first word", async () => {
  const el = await bandWith(
    fullRegister([fullRow("Moody's", "Corporate family rating", "B1 (CFR)")]),
    moody,
  );
  expect(noteCount(el)).toBe(0);
});

it("notes a difference when the issuer row differs, even if an instrument row matches", async () => {
  const el = await bandWith(
    fullRegister([
      fullRow("Moody's", "Issuer", "B2"),
      fullRow("Moody's", "Senior secured notes", "B1"),
    ]),
    moody,
  );
  expect(within(el).getByText(`${NOTE} Moody's`)).toBeVisible();
});

it("names an agency once when two issuer entries both differ", async () => {
  const el = await bandWith(fullRegister([fullRow("Moody's", "Issuer", "B2")]), [
    entered("Moody's", "B1"),
    entered("Moody's", "Ba3"),
  ]);
  expect(within(el).getByText(`${NOTE} Moody's`)).toBeVisible();
});

it("draws no note for a facility-only entry against an issuer register row", async () => {
  const el = await bandWith(fullRegister([fullRow("S&P", "Issuer", "B")]), [facility("S&P", "B+")]);
  expect(noteCount(el)).toBe(0);
});

it("draws no note when the register has no issuer/instrument column", async () => {
  const el = await bandWith(fullRegister([["Moody's", "B2"]], ["agency", "rating"]), moody);
  expect(noteCount(el)).toBe(0);
});
