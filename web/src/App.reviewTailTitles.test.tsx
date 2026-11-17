import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render } from "@testing-library/react";
import type { LoadResult } from "./data";
import { App } from "./App";

const fixture = (name: string) =>
  JSON.parse(
    readFileSync(path.resolve(import.meta.dirname, `../fixtures/${name}.json`), "utf8"),
  ) as { issuers: []; slice: unknown };
const library = fixture("library");
const result: LoadResult = {
  kind: "ok",
  data: {
    schema: "credit-os-data/1",
    issuers: library.issuers,
    library: library.slice,
    run: fixture("run").slice,
  },
};

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  window.location.hash = "";
  document.title = "";
});

it.each([
  ["/run/start", "Start a run — Documents — TransDigm Group — Credit OS"],
  ["/run/start/documents", "Start a run — Documents — TransDigm Group — Credit OS"],
  ["/run/start/purpose", "Start a run — Purpose — TransDigm Group — Credit OS"],
  ["/run/start/confirm", "Start a run — Confirm — TransDigm Group — Credit OS"],
  ["/run/start/context", "Start a run — More context — TransDigm Group — Credit OS"],
  ["/run/start/start", "Start a run — Start — TransDigm Group — Credit OS"],
  ["/run/start/started", "Start a run — Run started — TransDigm Group — Credit OS"],
  [
    "/library/halden-aerostructures/2026-09-30/evidence/trace/T-0014",
    "Evidence — Trace — Net leverage 4.6x — Halden Aerostructures — As of 30 Sep 2026 — Credit OS",
  ],
  [
    "/library/halden-aerostructures/2026-09-30/evidence/trace/T-0015",
    "Evidence — Trace — Interest cover 2.4x — Halden Aerostructures — As of 30 Sep 2026 — Credit OS",
  ],
])("names the visible saved step or selected trace at %s", (route, title) => {
  window.location.hash = `#${route}`;
  render(<App result={result} />);
  expect(document.title).toBe(title);
});

it.each([
  ["/run/start/unknown", "Start a run — Credit OS"],
  [
    "/library/halden-aerostructures/2026-09-30/evidence/trace/unknown",
    "Evidence — Trace — Halden Aerostructures — As of 30 Sep 2026 — Credit OS",
  ],
])("keeps the area fallback for an absent subject at %s", (route, title) => {
  window.location.hash = `#${route}`;
  render(<App result={result} />);
  expect(document.title).toBe(title);
});
