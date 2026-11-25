import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import {
  basisOf,
  TraceBasis,
  TraceClaim,
  TraceSourcePassage,
  withoutBasis,
  type SourcedTrace,
} from "./TraceParts";

afterEach(cleanup);

const trace = (over: Partial<SourcedTrace> = {}): SourcedTrace => ({
  title: "Sources for Findings",
  heading: "Findings",
  subtitle: "Liquidity · Handoff line 5",
  statement: "Cover is thin.",
  derivation: {
    label: "Evidence retained with this item",
    value: "",
    note: null,
    children: [{ label: "Basis", value: "FY2024 reported, USD m", note: null, children: [] }],
  },
  excerpt: { quote: "“Cash was USD 162m.”", source: "annual-report.pdf · p. 84" },
  qualification: "Company-adjusted basis.",
  evidenceItem: "out-5",
  ...over,
});

it("draws the claim with its qualification as a captioned line", () => {
  render(<TraceClaim trace={trace()} />);
  expect(screen.getByText("The claim")).toBeVisible();
  expect(screen.getByText("Cover is thin.")).toBeVisible();
  expect(screen.getByText("Qualification")).toBeVisible();
  expect(screen.getByText("Company-adjusted basis.")).toBeVisible();
});

it("draws no qualification caption when the trace has none", () => {
  render(<TraceClaim trace={trace({ qualification: null })} />);
  expect(screen.queryByText("Qualification")).toBeNull();
});

it("draws the source passage with its location", () => {
  render(<TraceSourcePassage trace={trace()} />);
  expect(screen.getByText("Source excerpt")).toBeVisible();
  expect(screen.getByText("“Cash was USD 162m.”")).toBeVisible();
  expect(screen.getByText("annual-report.pdf · p. 84")).toBeVisible();
});

it("draws nothing for a trace that does not know its citations and carries no excerpt", () => {
  const { container } = render(<TraceSourcePassage trace={trace({ excerpt: null })} />);
  expect(container).toBeEmptyDOMElement();
});

it("caps the excerpt of a trace that does not know its citations and lets it scroll", () => {
  render(
    <TraceSourcePassage
      trace={trace({ excerpt: { quote: "x ".repeat(2000), source: "annual-report.pdf" } })}
    />,
  );
  const box = screen.getByRole("region", { name: "Source excerpt" });
  expect(box).toHaveAttribute("tabindex", "0");
  expect(box.className).toContain("max-h-60");
});

it("states that nothing was cited when the trace knows its citations and there are none", () => {
  render(<TraceSourcePassage trace={trace({ excerpt: null, citations: [] })} />);
  const gap = screen.getByText("No source passage was recorded for this item.");
  expect(gap).toBeVisible();
  expect(gap.closest(".gap-hatch")).not.toBeNull();
});

const cited = {
  label: "annual.pdf p. 84",
  file: "annual.pdf",
  pages: "Cited page 84",
  quote: "“Cash was USD 162m.”",
  reason: null,
  sha256: "c".repeat(64),
};

it("draws each citation with its file, pages, quote and hash", () => {
  render(<TraceSourcePassage trace={trace({ citations: [cited] })} />);
  expect(screen.getByText("“Cash was USD 162m.”")).toBeVisible();
  expect(screen.getByText("annual.pdf")).toBeVisible();
  expect(screen.getByText("Cited page 84")).toBeVisible();
  expect(screen.getByText("c".repeat(64))).toBeVisible();
});

it("shows a citation whose page text could not be read with the chip's own reason, not as no passage", () => {
  render(
    <TraceSourcePassage
      trace={trace({
        excerpt: null,
        citations: [{ ...cited, quote: null, reason: "page not in source text" }],
      })}
    />,
  );
  expect(screen.getByText("annual.pdf")).toBeVisible();
  expect(screen.getByText("page not in source text")).toBeVisible();
  expect(screen.getByText("No passage text was recorded for this citation.")).toBeVisible();
  expect(screen.queryByText("No source passage was recorded for this item.")).toBeNull();
});

it("scrolls a long quote inside its box and names the scroll region", () => {
  render(
    <TraceSourcePassage trace={trace({ citations: [{ ...cited, quote: "x ".repeat(900) }] })} />,
  );
  const box = screen.getByRole("region", { name: "Passage from annual.pdf p. 84" });
  expect(box).toHaveAttribute("tabindex", "0");
  expect(box.className).toContain("overflow-y-auto");
});

it("takes the Basis row out of the derivation so the basis is drawn once", () => {
  const withBasis = trace().derivation;
  expect(withBasis.children.map(({ label }) => label)).toEqual(["Basis"]);
  expect(withoutBasis(withBasis).children).toEqual([]);
});

it("reads the basis line from the derivation's Basis node", () => {
  expect(basisOf(trace())).toEqual({ kind: "recorded", text: "FY2024 reported, USD m" });
  render(<TraceBasis trace={trace()} />);
  expect(screen.getByText("Basis")).toBeVisible();
  expect(screen.getByText("FY2024 reported, USD m")).toBeVisible();
});

it("draws a missing basis in the gap treatment with the recorded words", () => {
  const missing = trace({
    derivation: {
      label: "Evidence retained with this item",
      value: "",
      note: null,
      children: [
        { label: "Basis was not recorded for this item", value: null, note: null, children: [] },
      ],
    },
  });
  expect(basisOf(missing)).toEqual({ kind: "missing" });
  render(<TraceBasis trace={missing} />);
  const words = screen.getByText("Basis was not recorded for this item");
  expect(words.closest(".gap-hatch")).not.toBeNull();
});

it("draws nothing for a trace whose derivation has no basis node", () => {
  const none = trace({
    derivation: { label: "Evidence", value: "", note: null, children: [] },
  });
  expect(basisOf(none)).toBeNull();
  const { container } = render(<TraceBasis trace={none} />);
  expect(container).toBeEmptyDOMElement();
});

it("keeps a long unbroken basis inside its box without altering it", () => {
  const long = "0.060079470198675496688741721854304635762";
  const view = render(
    <TraceBasis
      trace={trace({
        derivation: {
          label: "Evidence",
          value: "",
          note: null,
          children: [{ label: "Basis", value: long, note: null, children: [] }],
        },
      })}
    />,
  );
  const text = within(view.container).getByText(long);
  expect(text.className).toContain("wrap-anywhere");
});
