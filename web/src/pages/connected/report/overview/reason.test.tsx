import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { METHODOLOGY_CODES, Reason, carriesUnreadId, readerReason } from "./reason";

afterEach(cleanup);

it("draws a reason in the module's words, codes named, without its Basis line", () => {
  expect(readerReason("CP-1C did not reconcile the peer set.")).toBe(
    "Peer benchmark did not reconcile the peer set.",
  );
  expect(readerReason("Not stated for FY2027.\nBasis: notes, page 88")).toBe(
    "Not stated for FY2027.",
  );
  expect(readerReason("")).toBeNull();
});

it("links to Evidence for a reason that cites a source, and prints none of it", () => {
  const cited = "FY2027: CP-1 gap G12 in notes_2024.pdf page 88 [E3].";
  expect(readerReason(cited)).toBeNull();
  render(<Reason text={cited} href="/report/run#evidence/CP-1" />);
  expect(screen.getByRole("link", { name: "Read the reason in Evidence" })).toHaveAttribute(
    "href",
    "/report/run#evidence/CP-1",
  );
  expect(document.body).not.toHaveTextContent(/notes_2024|G12|E3/);
});

it("removes inline source markers and sends text carrying an unnamed id to Evidence", () => {
  expect(readerReason("Cover is thin [E3].")).toBe("Cover is thin.");
  expect(readerReason("Cover is thin [E12, E14] and falling.")).toBe("Cover is thin and falling.");
  expect(readerReason("Leverage of 4.2x [E3] per T4.18 and CP-1 supports Watchlist.")).toBeNull();
  expect(readerReason("See CP-1-GAP-12.")).toBeNull();
  expect(readerReason("Leverage per CP-1 is 4.2x.")).toBe(
    "Leverage per Financial foundation is 4.2x.",
  );
});

it("keeps a money amount, a tranche name or an unknown code, and rejects a register id only where it is cited", () => {
  for (const kept of [
    "T1.5 billion of term loan B matures in 2028.",
    "Tranche T1.1 is secured on the operating assets.",
    "Leverage (T2.1 series) rose to 4.2x.",
    "CP-BACKSTOP covers the gap.",
    "US-CP-1 notes are listed.",
    "CP-99 is not a module.",
  ])
    expect(readerReason(kept)).toBe(kept);
  for (const cited of [
    "Leverage per T4.18 is 4.2x.",
    "Cover is thin [see T2DS.6].",
    "Cover is thin (T4.18).",
    "The figure is in rows of T2DS.1.",
    "From TL3.2 the margin is 350 bp.",
    "T4.18",
  ])
    expect(readerReason(cited)).toBeNull();
});

it("maps a phase name into reader text while still detecting the underlying code", () => {
  expect(carriesUnreadId("CP-1 supports Watchlist.")).toBe(true);
  expect(carriesUnreadId("CP-4A supports Watchlist.")).toBe(true);
  expect(carriesUnreadId("CP-99 supports Watchlist.")).toBe(false);
  expect(readerReason("CP-4A supports Watchlist.")).toBe("Covenant capacity supports Watchlist.");
  expect(readerReason("CP-1 supports Watchlist.")).toBe("Financial foundation supports Watchlist.");
});

it("knows the module codes the methodology defines, and no others", () => {
  const file = resolve(import.meta.dirname, "../../../../../../src/deploy_vii/methodology.json");
  const modules = JSON.parse(readFileSync(file, "utf8")) as {
    module_id: string;
    aliases?: string[];
  }[];
  const codes = modules.flatMap(({ module_id, aliases = [] }) => [module_id, ...aliases]);
  expect([...METHODOLOGY_CODES].sort()).toEqual([...new Set(codes)].sort());
});

it("sends a register id that is a clause's subject, and a calculation id, to Evidence (real CP-1 basis cells)", () => {
  // TransDigm lite runs, CP-1 "Chart data: leverage" and "Chart data: interest cover".
  for (const cited of [
    "June carrying debt and cash are established, but no complete eligible annual-plus-stubs denominator is available; T4.9 retains the missing ratios",
    "Calculated C05 from carrying debt 24880, cash-netted debt 18619 and reported unadjusted EBITDA 3813. Not covenant leverage; retrospective.",
    "C05 uses unadjusted reported EBITDA 3813 and cash interest paid net 1158, not accrued net interest expense 1286.",
  ])
    expect(readerReason(cited)).toBeNull();
  for (const kept of [
    "Class C2 notes rank behind the term loan.",
    "A 20% decline leaves C$120 million of headroom.",
    "Rated CCC1 by the agency.",
  ])
    expect(readerReason(kept)).toBe(kept);
});
