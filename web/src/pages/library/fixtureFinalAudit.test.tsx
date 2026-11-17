import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import type { LibraryData } from "@/data";
import { SourceContext } from "../source";
import { readSlice } from "./read";
import { routes } from "./routes";
import type { LibrarySlice, Run, TreeNode } from "./slice";

const fixture = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../../fixtures/library.json"), "utf8"),
) as { slice: LibrarySlice; issuers: LibraryData["issuers"] };
const activity = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../../fixtures/run.json"), "utf8"),
) as {
  slice: {
    drafts: { id: string; note?: string; recap?: { label: string; value: string }[] }[];
    runs: {
      id: string;
      open?: { label: string; href: string };
      alert?: { action?: { label: string; href: string } };
    }[];
  };
};
const filled = (issuer: string, id: string): Extract<Run, { loading: false }> => {
  const run = fixture.slice.issuers.find((i) => i.id === issuer)?.runs.find((r) => r.id === id);
  if (run === undefined || run.loading) throw new Error(`no loaded ${issuer}/${id}`);
  return run;
};
const runs = fixture.slice.issuers.flatMap((i) => i.runs).filter((r) => !r.loading);
const full = () => filled("halden-aerostructures", "2026-09-30");
const hasSource = (node: TreeNode): boolean =>
  node.label === "Source" || node.children.some(hasSource);
const sourceGap = (text: string | null) => /source details.*not recorded/i.test(text ?? "");

afterEach(cleanup);

describe("final audit fixture consistency", () => {
  it("is still accepted by the library reader", () => {
    expect(readSlice(fixture.slice).kind).toBe("ok");
  });

  it("offers a reason rather than a download address when sample bytes are absent (S4-003)", () => {
    for (const run of runs) {
      const downloads = [
        run.evidence.summary.take.download,
        run.evidence.record.registers.downloadAll,
      ];
      for (const offer of [...downloads, ...run.evidence.record.registers.rows]) {
        expect(offer.href, run.id).toBeNull();
        expect(offer.reason, run.id).toMatch(/not included in this saved example/i);
      }
    }
    const route = routes.find((r) => r.path === "/library/:issuer/:run/evidence/summary");
    if (route === undefined) throw new Error("no Summary route");
    render(
      <SourceContext.Provider
        value={{ schema: "credit-os-data/1", issuers: fixture.issuers, library: fixture.slice }}
      >
        {route.render({ issuer: "halden-aerostructures", run: "2026-09-30" })}
      </SourceContext.Provider>,
    );
    expect(screen.getByRole("button", { name: "Download handoffs" })).toBeDisabled();
    expect(screen.queryByRole("link", { name: "Download handoffs" })).toBeNull();
  });

  it("distinguishes forward credit passages from the absent cash flow model (J6-007)", () => {
    for (const run of runs) {
      if (run.head.forecastHref !== null) continue;
      expect(
        run.modules.some((m) => m.name === "Forecast"),
        run.id,
      ).toBe(false);
      expect(
        run.overview.modules.items.some((m) => m.title === "Forecast"),
        run.id,
      ).toBe(false);
    }
  });

  it("uses the adjusted basis and the actual comparison quarter on Halden (S2-008)", () => {
    const run = full();
    expect(run.overview.sides?.columns[0]?.items[0]?.qualifier).toBe("Company-adjusted");
    expect(run.overview.sides?.columns[0]?.items[0]?.text).toContain("since 30 June 2026");
    expect(run.overview.findings[0]?.body).toContain("since 30 June 2026");
    const history = fixture.slice.issuers[0]?.history;
    expect(history?.entries.find((e) => e.asOf === "30 Jun 2026")?.pathway).toBe("Full review");
    for (const label of ["EBITDA margin", "Net leverage", "Interest cover", "Liquidity, USD m"]) {
      const note = run.overview.metrics.find((m) => m.label === label)?.note;
      expect(note, label).toMatch(/30 Sep 2026/);
      expect(note, label).toMatch(/company-adjusted|cash and undrawn/i);
    }
  });

  it("gives every facility fact the matching heading and Result (S3-036)", () => {
    const run = full();
    const module = run.modules.find((m) => m.id === "capital-structure");
    if (module?.body.kind !== "delivered") throw new Error("no capital structure");
    const facts = module.body.records.find((b) => b.kind === "facts");
    if (facts?.kind !== "facts") throw new Error("no facts");
    const keys: string[] = [];
    for (const group of facts.groups) {
      for (const row of group.rows) {
        if (row.trace === null) throw new Error("facility fact has no trace");
        keys.push(row.trace);
        const trace = run.traces[row.trace];
        expect(trace?.heading).toContain(`${String(group.name)} · ${row.label}`);
        if (row.value?.kind === "value") expect(trace?.derivation.value).toContain(row.value.text);
        else expect(trace?.derivation.value).toBe(row.value === null ? "n.a." : "Withheld");
      }
    }
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("counts actual calculation derivations and states their scope (S4-001)", () => {
    for (const run of runs) {
      const count = run.evidence.summary.counts.find((c) => c.label === "Calculations");
      expect(count?.value?.kind === "value" ? count.value.text : null).toBe(
        String(run.evidence.trace.rows.filter((r) => r.calc !== null).length),
      );
      expect(count?.note).not.toBe("Each one traceable to its inputs");
    }
  });

  it("states the missing source details whenever a drawer cannot supply its counted sources (S4-002)", () => {
    for (const run of runs) {
      for (const trace of Object.values(run.traces)) {
        const row = run.evidence.trace.rows.find((r) => r.id === trace.evidenceItem);
        if (Number(row?.sources) > 0 && trace.excerpt === null && !hasSource(trace.derivation)) {
          expect(sourceGap(trace.qualification), `${run.id}/${trace.evidenceItem}`).toBe(true);
        }
      }
    }
  });

  it("keeps the new saved reports internally consistent (F1 F2 F3 F11)", () => {
    const tessaly = filled("tessaly-foods", "2026-09-30");
    expect(JSON.stringify(tessaly)).not.toContain("since the last run");
    const lumora = filled("lumora-health", "2026-09-30");
    expect(lumora.modules.filter((m) => m.state === "Not run")).toHaveLength(6);
    expect(lumora.head.tabs.modulesCount).toBe("13");
    const calls = lumora.evidence.record.calls;
    expect(calls.rows[0]?.cells.at(-1)).toBe("24.60");
    expect(calls.total.cells.at(-1)).toBe("24.60");
    const capped = filled("halden-aerostructures", "2026-03-31");
    expect(capped.evidence.record.spend.note).not.toContain("finished inside its cap");
  });

  it("opens each completed activity's own issuer/run and keeps the Model report reachable (S6-008)", () => {
    for (const id of ["finished", "failed", "capped", "interrupted"]) {
      const run = activity.slice.runs.find((r) => r.id === id);
      const href = run?.open?.href ?? run?.alert?.action?.href;
      expect(href, id).toBe(`#/library/transdigm/activity-${id}/overview`);
      const target = filled("transdigm", `activity-${id}`);
      expect(target.head.issuerName).toBe("TransDigm Group");
      expect(target.head.state).toBe(
        id === "finished"
          ? "Finished"
          : id === "failed"
            ? "Failed"
            : id === "capped"
              ? "Capped"
              : "Interrupted",
      );
    }
    expect(filled("transdigm", "2025-06-30").head.forecastHref).toBe(
      "#/model/transdigm/2025-06-30/forecast",
    );
  });

  it("recaps the actual empty More context field (S6-031)", () => {
    expect(activity.slice.drafts.find((d) => d.id === "context")?.note).toBe("");
    expect(
      activity.slice.drafts
        .find((d) => d.id === "start")
        ?.recap?.find((r) => r.label === "More context")?.value,
    ).toBe("No note added");
  });
});
