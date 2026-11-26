import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { StartRun } from "../StartRun";

Element.prototype.scrollIntoView = vi.fn();

const caps = { credit_snapshot: "30", credit_screening: "10" };
const template = {
  run: { as_of: "", pathway: "credit_snapshot", case_kind: "public" },
  identity: { issuer_name: "", issuer_id: "" },
};
const earlier = {
  run: "earlier",
  issuer_id: "northbridge",
  issuer_name: "Northbridge",
  context: {
    run: { as_of: "", pathway: "credit_snapshot", case_kind: "public" },
    identity: { issuer_name: "Northbridge", issuer_id: "northbridge" },
  },
  files: [{ name: "annual.txt", size: 6 }],
  level: "basic",
  modules: [],
  max_turns: 32,
};
const holdings = new File(["isin,qty\nX,1\n"], "holdings.csv");

const filing = new File(["filing"], "annual.txt");

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("S19-1-2 removing a carried file before the carry has run leaves it out without an error", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const stored = new Set<string>(); // what the draft folder holds on the service
  const json = (value: unknown, status = 200) => Promise.resolve(Response.json(value, { status }));
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const url = new URL(path, "http://service.test");
      const name = url.searchParams.get("name") ?? "";
      const method = init?.method ?? "GET";
      if (path === "/connected/context") return json({ ...template, submission_caps_usd: caps });
      if (path === "/api/runs/earlier/inputs") return json(earlier);
      if (path.startsWith("/api/issuers/"))
        return json({ latest_run: "", runs: 0, latest_as_of: "" });
      if (path.startsWith("/api/reference-portfolios")) return json({ portfolios: [] });
      if (path === "/api/submissions" && method === "POST") return json({ id: "draft" });
      if (url.pathname === "/api/submissions/draft/reference-portfolio/files")
        return json({ name });
      if (path === "/api/submissions/draft/reference-portfolio" && method === "POST")
        return json({
          name: "Peer fund",
          holds: "",
          files: ["holdings.csv"],
          error: "",
          portfolio: {
            name: "Peer fund",
            as_of: "2026-10-31",
            positions: 1,
            unpriced: 0,
            limits: 0,
            found: ["Market value"],
            not_found: [],
            findings: [],
          },
        });
      if (url.pathname === "/api/submissions/draft/files" && method === "DELETE") {
        // The service's own refusal for a name that is not stored.
        if (!stored.has(name)) return json({ error: `'${name}' is not stored` }, 400);
        stored.delete(name);
        return json({ name });
      }
      throw new Error(`Unexpected request ${method} ${path}`);
    }),
  );
  render(<StartRun mode="live" navigate={vi.fn()} from="earlier" />);
  expect(await screen.findByText("annual.txt")).toBeTruthy();
  expect(screen.getByText("Will be copied")).toBeTruthy();
  // The analyst reads a comparison portfolio first: that opens the draft, with nothing carried.
  fireEvent.change(screen.getByLabelText("Portfolio name"), { target: { value: "Peer fund" } });
  fireEvent.change(screen.getByLabelText("Comparison portfolio files"), {
    target: { files: [holdings] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Read portfolio" }));
  await screen.findByText(/1 position\./);
  // Then leaves the carried file out.
  fireEvent.click(screen.getByRole("button", { name: "Remove annual.txt" }));
  try {
    await waitFor(() => {
      expect(screen.queryByText("annual.txt")).toBeNull();
    });
  } catch (failure) {
    console.log(
      "ALERT TEXT:",
      JSON.stringify(screen.queryAllByRole("alert").map((node) => node.textContent)),
    );
    throw failure;
  }
  expect(screen.queryByText(/is not stored/)).toBeNull();
});

it("S19-1-3 removing the only document leaves an empty list and no error", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const stored = new Set<string>();
  const json = (value: unknown, status = 200) => Promise.resolve(Response.json(value, { status }));
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const url = new URL(path, "http://service.test");
      const name = url.searchParams.get("name") ?? "";
      const method = init?.method ?? "GET";
      if (path === "/connected/context") return json({ ...template, submission_caps_usd: caps });
      if (path.startsWith("/api/issuers/"))
        return json({ latest_run: "", runs: 0, latest_as_of: "" });
      if (path.startsWith("/api/reference-portfolios")) return json({ portfolios: [] });
      if (path === "/api/submissions" && method === "POST") return json({ id: "draft" });
      if (url.pathname === "/api/submissions/draft/files" && method === "POST") {
        stored.add(name);
        return json({ name });
      }
      if (url.pathname === "/api/submissions/draft/files" && method === "DELETE") {
        stored.delete(name);
        return json({ name });
      }
      if (path === "/api/submissions/draft/reading") {
        // The service's answer for a draft holding no readable file.
        if (stored.size === 0)
          return json({
            documents: [],
            ignored: [],
            error: "--sources the uploaded documents: no readable issuer file",
          });
        return json({
          documents: [...stored].map((source) => ({ source, kind: "annual_report" })),
          ignored: [],
          error: "",
        });
      }
      throw new Error(`Unexpected request ${method} ${path}`);
    }),
  );
  render(<StartRun mode="live" navigate={vi.fn()} />);
  fireEvent.change(await screen.findByLabelText("Documents"), { target: { files: [filing] } });
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  await screen.findByText("1 document inspected, 0 ignored.");
  fireEvent.click(screen.getByRole("button", { name: "Remove annual.txt" }));
  await screen.findByText("No documents yet.");
  try {
    await waitFor(
      () => {
        expect(screen.queryAllByRole("alert")).toHaveLength(0);
      },
      { timeout: 1500 },
    );
  } catch (failure) {
    console.log(
      "ALERT TEXT:",
      JSON.stringify(screen.queryAllByRole("alert").map((node) => node.textContent)),
    );
    throw failure;
  }
});

it("S19-2-1 a removed upload does not break the carry on a replacement draft", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const drafts = new Map<string, Set<string>>();
  let created = 0;
  let expired = new Set<string>();
  const calls: string[] = [];
  const json = (value: unknown, status = 200) => Promise.resolve(Response.json(value, { status }));
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const url = new URL(path, "http://service.test");
      const name = url.searchParams.get("name") ?? "";
      const method = init?.method ?? "GET";
      calls.push(`${method} ${path}`);
      if (path === "/connected/context") return json({ ...template, submission_caps_usd: caps });
      if (path === "/api/runs/earlier/inputs") return json(earlier);
      if (path.startsWith("/api/issuers/"))
        return json({ latest_run: "", runs: 0, latest_as_of: "" });
      if (path.startsWith("/api/reference-portfolios")) return json({ portfolios: [] });
      if (path === "/api/submissions" && method === "POST") {
        created += 1;
        const id = `d${String(created)}`;
        drafts.set(id, new Set());
        return json({ id });
      }
      const match = /^\/api\/submissions\/(d\d+)\/(files|carry|reading)/.exec(url.pathname);
      if (!match) throw new Error(`Unexpected request ${method} ${path}`);
      const id = match[1] ?? "";
      const what = match[2];
      const held = drafts.get(id);
      if (!held || expired.has(id)) return json({ error: "unknown submission" }, 404);
      if (what === "files" && method === "POST") {
        held.add(name);
        return json({ name });
      }
      if (what === "files" && method === "DELETE") {
        if (!held.has(name)) return json({ error: `'${name}' is not stored` }, 400);
        held.delete(name);
        return json({ name });
      }
      if (what === "carry") {
        held.add("annual.txt");
        return json({ carried: ["annual.txt"], kept: [] });
      }
      if (what === "reading")
        return json({
          documents: [...held].map((source) => ({ source, kind: "annual_report" })),
          ignored: [],
          error: "",
        });
      throw new Error(`Unexpected request ${method} ${path}`);
    }),
  );
  render(<StartRun mode="live" navigate={vi.fn()} from="earlier" />);
  expect(await screen.findByText("annual.txt")).toBeTruthy();
  fireEvent.change(await screen.findByLabelText("Documents"), {
    target: { files: [new File(["extra!"], "extra.txt")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  await screen.findByText("2 documents inspected, 0 ignored.");
  // The analyst drops the extra upload.
  fireEvent.click(screen.getByRole("button", { name: "Remove extra.txt" }));
  await waitFor(() => {
    expect(screen.queryByText("extra.txt")).toBeNull();
  });
  expect(screen.queryAllByRole("alert")).toHaveLength(0);
  // The first draft expires; the page says so and re-inspects on a new draft.
  expired = new Set(["d1"]);
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  await screen.findByText(/may have expired/);
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  try {
    await screen.findByText("1 document inspected, 0 ignored.", undefined, { timeout: 1500 });
  } catch (failure) {
    console.log(
      "ALERT TEXT:",
      JSON.stringify(screen.queryAllByRole("alert").map((node) => node.textContent)),
      calls.filter((call) => call.includes("submissions")).slice(-9),
    );
    throw failure;
  }
  expect(screen.queryAllByRole("alert")).toHaveLength(0);
});

it("S19-3-1 an uploaded Word file is one row, not two", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const json = (value: unknown, status = 200) => Promise.resolve(Response.json(value, { status }));
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const url = new URL(path, "http://service.test");
      const name = url.searchParams.get("name") ?? "";
      const method = init?.method ?? "GET";
      if (path === "/connected/context") return json({ ...template, submission_caps_usd: caps });
      if (path.startsWith("/api/issuers/"))
        return json({ latest_run: "", runs: 0, latest_as_of: "" });
      if (path.startsWith("/api/reference-portfolios")) return json({ portfolios: [] });
      if (path === "/api/submissions" && method === "POST") return json({ id: "d1" });
      if (url.pathname === "/api/submissions/d1/files" && method === "POST") return json({ name });
      if (url.pathname === "/api/submissions/d1/reading")
        // What the real reader returns for one stored memo.docx (S19-3-1-facts.py).
        return json({
          documents: [{ source: "memo.docx.jsonl", kind: "annual_report" }],
          ignored: [],
          error: "",
        });
      throw new Error(`Unexpected request ${method} ${path}`);
    }),
  );
  render(<StartRun mode="live" navigate={vi.fn()} />);
  fireEvent.change(await screen.findByLabelText("Documents"), {
    target: { files: [new File(["Net sales were 100."], "memo.docx")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  await screen.findByText("1 document inspected, 0 ignored.");
  const rows = within(screen.getByRole("list", { name: "Documents added" })).getAllByRole(
    "listitem",
  );
  expect(rows.map((row) => row.querySelector("p")?.textContent)).toEqual(["memo.docx"]);
});

const earlier31b = {
  run: "earlier",
  issuer_id: "northbridge",
  issuer_name: "Northbridge",
  context: {
    run: { as_of: "", pathway: "credit_snapshot", case_kind: "public" },
    identity: { issuer_name: "Northbridge", issuer_id: "northbridge" },
  },
  files: [
    { name: "annual.txt", size: 6 },
    { name: "memo.docx", size: 20 },
  ],
  level: "basic",
  modules: [],
  max_turns: 32,
};

it("S19-3-1b a carried Word file can be removed after the carry", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const held = new Set<string>();
  const json = (value: unknown, status = 200) => Promise.resolve(Response.json(value, { status }));
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const url = new URL(path, "http://service.test");
      const name = url.searchParams.get("name") ?? "";
      const method = init?.method ?? "GET";
      if (path === "/connected/context") return json({ ...template, submission_caps_usd: caps });
      if (path === "/api/runs/earlier/inputs") return json(earlier31b);
      if (path.startsWith("/api/issuers/"))
        return json({ latest_run: "", runs: 0, latest_as_of: "" });
      if (path.startsWith("/api/reference-portfolios")) return json({ portfolios: [] });
      if (path === "/api/submissions" && method === "POST") return json({ id: "d1" });
      if (url.pathname === "/api/submissions/d1/files" && method === "DELETE") {
        if (!held.has(name)) return json({ error: `'${name}' is not stored` }, 400);
        held.delete(name);
        return json({ name });
      }
      if (url.pathname === "/api/submissions/d1/carry") {
        for (const { name: prior } of earlier31b.files) held.add(prior);
        return json({ carried: earlier31b.files.map((item) => item.name), kept: [] });
      }
      if (url.pathname === "/api/submissions/d1/reading")
        // cpos_launch._issuer_files: a converted source (.htm, .html, .docx) is keyed `<name>.jsonl`.
        return json({
          documents: [...held].map((source) => ({
            source: /\.(htm|html|docx)$/i.test(source) ? `${source}.jsonl` : source,
            kind: "annual_report",
          })),
          ignored: [],
          error: "",
        });
      throw new Error(`Unexpected request ${method} ${path}`);
    }),
  );
  render(<StartRun mode="live" navigate={vi.fn()} from="earlier" />);
  expect(await screen.findByText("memo.docx")).toBeTruthy();
  // Inspect documents carries both files; nothing is uploaded.
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  await screen.findByText("2 documents inspected, 0 ignored.");
  expect([...held].sort()).toEqual(["annual.txt", "memo.docx"]);
  // Leave the Word file out.
  const remove = screen.queryByRole("button", { name: /^Remove memo\.docx/ });
  expect(remove).not.toBeNull();
  fireEvent.click(remove as HTMLElement);
  try {
    await waitFor(
      () => {
        expect(screen.queryByText(/^memo\.docx/)).toBeNull();
      },
      { timeout: 1500 },
    );
  } catch (failure) {
    throw new Error(
      `the carried Word file is still listed; alert: ${JSON.stringify(
        screen.queryAllByRole("alert").map((node) => node.textContent),
      )}; stored on the service: ${JSON.stringify([...held].sort())}`,
      { cause: failure },
    );
  }
  expect([...held]).toEqual(["annual.txt"]);
  expect(screen.queryAllByRole("alert")).toHaveLength(0);
});

const earlier32 = {
  run: "earlier",
  issuer_id: "northbridge",
  issuer_name: "Northbridge",
  context: {
    run: { as_of: "", pathway: "credit_snapshot", case_kind: "public" },
    identity: { issuer_name: "Northbridge", issuer_id: "northbridge" },
  },
  files: [{ name: "Annual.txt", size: 6 }],
  level: "basic",
  modules: [],
  max_turns: 32,
};

it("S19-3-2 removing the only stored document that shared a carried name apart from case", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const held = new Set<string>(); // the draft folder, exact names
  const json = (value: unknown, status = 200) => Promise.resolve(Response.json(value, { status }));
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const url = new URL(path, "http://service.test");
      const name = url.searchParams.get("name") ?? "";
      const method = init?.method ?? "GET";
      if (path === "/connected/context") return json({ ...template, submission_caps_usd: caps });
      if (path === "/api/runs/earlier/inputs") return json(earlier32);
      if (path.startsWith("/api/issuers/"))
        return json({ latest_run: "", runs: 0, latest_as_of: "" });
      if (path.startsWith("/api/reference-portfolios")) return json({ portfolios: [] });
      if (path === "/api/submissions" && method === "POST") return json({ id: "d1" });
      if (url.pathname === "/api/submissions/d1/files" && method === "POST") {
        held.add(name);
        return json({ name });
      }
      if (url.pathname === "/api/submissions/d1/files" && method === "DELETE") {
        if (!held.has(name)) return json({ error: `'${name}' is not stored` }, 400);
        held.delete(name);
        return json({ name });
      }
      if (url.pathname === "/api/submissions/d1/carry") {
        // submissions._check_carry: a name whose case-folded form is stored is kept, not copied.
        const folded = new Set([...held].map((item) => item.toLowerCase()));
        const carried: string[] = [];
        const kept: string[] = [];
        for (const { name: prior } of earlier32.files) {
          if (folded.has(prior.toLowerCase())) kept.push(prior);
          else {
            held.add(prior);
            carried.push(prior);
          }
        }
        return json({ carried, kept });
      }
      if (url.pathname === "/api/submissions/d1/reading") {
        if (held.size === 0)
          return json({
            documents: [],
            ignored: [],
            error: "--sources the uploaded documents: no readable issuer file",
          });
        return json({
          documents: [...held].map((source) => ({ source, kind: "annual_report" })),
          ignored: [],
          error: "",
        });
      }
      throw new Error(`Unexpected request ${method} ${path}`);
    }),
  );
  render(<StartRun mode="live" navigate={vi.fn()} from="earlier" />);
  expect(await screen.findByText("Annual.txt")).toBeTruthy();
  fireEvent.change(await screen.findByLabelText("Documents"), {
    target: { files: [new File(["filing"], "annual.txt")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  await screen.findByText("1 document inspected, 0 ignored.");
  expect([...held]).toEqual(["annual.txt"]); // the carry kept the upload; Annual.txt was not copied
  fireEvent.click(screen.getByRole("button", { name: "Remove annual.txt" }));
  await screen.findByText("No documents yet.");
  expect([...held]).toEqual([]);
  try {
    await waitFor(
      () => {
        expect(screen.queryAllByRole("alert")).toHaveLength(0);
      },
      { timeout: 1500 },
    );
  } catch (failure) {
    throw new Error(
      `alert after removing the last stored document: ${JSON.stringify(
        screen.queryAllByRole("alert").map((node) => node.textContent),
      )}`,
      { cause: failure },
    );
  }
});

const earlier32b = {
  run: "earlier",
  issuer_id: "northbridge",
  issuer_name: "Northbridge",
  context: {
    run: { as_of: "", pathway: "credit_snapshot", case_kind: "public" },
    identity: { issuer_name: "Northbridge", issuer_id: "northbridge" },
  },
  files: [{ name: "annual.txt", size: 6 }],
  level: "basic",
  modules: [],
  max_turns: 32,
};

it("S19-3-2b an upload differing only in case from an ignored carried name is inspected", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const held = new Set<string>(); // the draft folder, exact names (a case-sensitive disk)
  const json = (value: unknown, status = 200) => Promise.resolve(Response.json(value, { status }));
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const url = new URL(path, "http://service.test");
      const name = url.searchParams.get("name") ?? "";
      const method = init?.method ?? "GET";
      if (path === "/connected/context") return json({ ...template, submission_caps_usd: caps });
      if (path === "/api/runs/earlier/inputs") return json(earlier32b);
      if (path.startsWith("/api/issuers/"))
        return json({ latest_run: "", runs: 0, latest_as_of: "" });
      if (path.startsWith("/api/reference-portfolios")) return json({ portfolios: [] });
      if (path === "/api/submissions" && method === "POST") return json({ id: "d1" });
      if (url.pathname === "/api/submissions/d1/files" && method === "POST") {
        held.add(name);
        return json({ name });
      }
      if (url.pathname === "/api/submissions/d1/files" && method === "DELETE") {
        if (!held.has(name)) return json({ error: `'${name}' is not stored` }, 400);
        held.delete(name);
        return json({ name });
      }
      if (url.pathname === "/api/submissions/d1/carry") {
        const folded = new Set([...held].map((item) => item.toLowerCase()));
        const carried: string[] = [];
        const kept: string[] = [];
        for (const { name: prior } of earlier32b.files) {
          if (folded.has(prior.toLowerCase())) kept.push(prior);
          else {
            held.add(prior);
            carried.push(prior);
          }
        }
        return json({ carried, kept });
      }
      if (url.pathname === "/api/submissions/d1/reading")
        return json({
          documents: [...held].map((source) => ({ source, kind: "annual_report" })),
          ignored: [],
          error: "",
        });
      throw new Error(`Unexpected request ${method} ${path}`);
    }),
  );
  render(<StartRun mode="live" navigate={vi.fn()} from="earlier" />);
  expect(await screen.findByText("annual.txt")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Remove annual.txt" }));
  await waitFor(() => {
    expect(screen.queryByText("annual.txt")).toBeNull();
  });
  fireEvent.change(await screen.findByLabelText("Documents"), {
    target: { files: [new File(["filing"], "Annual.txt")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  try {
    await screen.findByText("1 document inspected, 0 ignored.", undefined, { timeout: 1500 });
  } catch (failure) {
    throw new Error(
      `Inspect documents failed: ${JSON.stringify(
        screen.queryAllByRole("alert").map((node) => node.textContent),
      )}`,
      { cause: failure },
    );
  }
  expect(screen.queryAllByRole("alert")).toHaveLength(0);
});

const earlier33 = {
  run: "earlier",
  issuer_id: "northbridge",
  issuer_name: "Northbridge",
  context: {
    run: { as_of: "", pathway: "credit_snapshot", case_kind: "public" },
    identity: { issuer_name: "Northbridge", issuer_id: "northbridge" },
  },
  files: [{ name: "annual.txt", size: 6 }],
  level: "basic",
  modules: [],
  max_turns: 32,
};

it("S19-3-3 removing the upload after a failed carry keeps the carried file listed", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const held = new Set<string>();
  const json = (value: unknown, status = 200) => Promise.resolve(Response.json(value, { status }));
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const url = new URL(path, "http://service.test");
      const name = url.searchParams.get("name") ?? "";
      const method = init?.method ?? "GET";
      if (path === "/connected/context") return json({ ...template, submission_caps_usd: caps });
      if (path === "/api/runs/earlier/inputs") return json(earlier33);
      if (path.startsWith("/api/issuers/"))
        return json({ latest_run: "", runs: 0, latest_as_of: "" });
      if (path.startsWith("/api/reference-portfolios")) return json({ portfolios: [] });
      if (path === "/api/submissions" && method === "POST") return json({ id: "d1" });
      if (url.pathname === "/api/submissions/d1/files" && method === "POST") {
        held.add(name);
        return json({ name });
      }
      if (url.pathname === "/api/submissions/d1/files" && method === "DELETE") {
        if (!held.has(name)) return json({ error: `'${name}' is not stored` }, 400);
        held.delete(name);
        return json({ name });
      }
      if (url.pathname === "/api/submissions/d1/carry")
        return json({ error: "the service could not copy the files" }, 500);
      throw new Error(`Unexpected request ${method} ${path}`);
    }),
  );
  render(<StartRun mode="live" navigate={vi.fn()} from="earlier" />);
  expect(await screen.findByText("annual.txt")).toBeTruthy();
  expect(screen.getByText("Will be copied")).toBeTruthy();
  fireEvent.change(await screen.findByLabelText("Documents"), {
    target: { files: [new File(["extra!"], "extra.txt")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  await screen.findByRole("alert"); // the carry failed; the upload is on the draft
  expect(held.has("extra.txt")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Remove extra.txt" }));
  await waitFor(() => {
    expect(screen.queryByText("extra.txt")).toBeNull();
  });
  expect(held.has("extra.txt")).toBe(false); // the removal reached the service
  // The carried file was not touched by the analyst.
  expect(screen.queryByText("annual.txt")).not.toBeNull();
  expect(screen.queryByText("No documents yet.")).toBeNull();
});

const earlierNamed = (name: string) => ({ ...earlier33, files: [{ name, size: 6 }] });
const listedRows = () =>
  within(screen.getByRole("list", { name: "Documents added" }))
    .getAllByRole("listitem")
    .map((row) => row.querySelector("p")?.textContent);

/** A draft on a disk that folds case and Unicode form; `carryFails` answers the carry with 500. */
function foldingService(prior: { files: { name: string; size: number }[] }, carryFails = false) {
  const fold = (name: string) => name.normalize("NFC").toLowerCase();
  const held = new Map<string, string>();
  const json = (value: unknown, status = 200) => Promise.resolve(Response.json(value, { status }));
  const fetchMock = vi.fn((path: string, init?: RequestInit) => {
    const url = new URL(path, "http://service.test");
    const name = url.searchParams.get("name") ?? "";
    const method = init?.method ?? "GET";
    if (path === "/connected/context") return json({ ...template, submission_caps_usd: caps });
    if (path === "/api/runs/earlier/inputs") return json(prior);
    if (path.startsWith("/api/issuers/"))
      return json({ latest_run: "", runs: 0, latest_as_of: "" });
    if (path.startsWith("/api/reference-portfolios")) return json({ portfolios: [] });
    if (path === "/api/submissions" && method === "POST") return json({ id: "d1" });
    if (url.pathname === "/api/submissions/d1/files" && method === "POST") {
      held.set(fold(name), name);
      return json({ name });
    }
    if (url.pathname === "/api/submissions/d1/files" && method === "DELETE") {
      if (!held.has(fold(name))) return json({ error: `'${name}' is not stored` }, 400);
      held.delete(fold(name));
      return json({ name });
    }
    if (url.pathname === "/api/submissions/d1/carry") {
      if (carryFails) return json({ error: "the service could not copy the files" }, 500);
      const carried: string[] = [];
      const kept: string[] = [];
      for (const { name: item } of prior.files) {
        if (held.has(fold(item))) kept.push(item);
        else {
          held.set(fold(item), item);
          carried.push(item);
        }
      }
      return json({ carried, kept });
    }
    if (url.pathname === "/api/submissions/d1/reading")
      return json({
        documents: [...held.values()].sort().map((source) => ({ source, kind: "annual_report" })),
        ignored: [],
        error: "",
      });
    throw new Error(`Unexpected request ${method} ${path}`);
  });
  return { held, fetchMock };
}

it("S19-4-1 an earlier file the carry kept under a case-variant upload gets no Copied row", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const { held, fetchMock } = foldingService(earlierNamed("Annual.txt"));
  vi.stubGlobal("fetch", fetchMock);
  render(<StartRun mode="live" navigate={vi.fn()} from="earlier" />);
  expect(await screen.findByText("Annual.txt")).toBeTruthy();
  fireEvent.change(await screen.findByLabelText("Documents"), {
    target: { files: [new File(["new filing"], "annual.txt"), new File(["notes"], "b.txt")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  await screen.findByText("2 documents inspected, 0 ignored.");
  expect([...held.values()].sort()).toEqual(["annual.txt", "b.txt"]);
  fireEvent.change(screen.getByLabelText("Documents"), {
    target: { files: [new File(["agreement text"], "c.txt")] },
  });
  await screen.findByText("c.txt");
  expect(listedRows()).toEqual(["annual.txt", "b.txt", "c.txt"]);
});

it("S19-4-2 removing one of two uploads after a failed carry keeps the carried file listed", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const { held, fetchMock } = foldingService(earlier33, true);
  vi.stubGlobal("fetch", fetchMock);
  render(<StartRun mode="live" navigate={vi.fn()} from="earlier" />);
  expect(await screen.findByText("annual.txt")).toBeTruthy();
  fireEvent.change(await screen.findByLabelText("Documents"), {
    target: { files: [new File(["first"], "x.txt"), new File(["second!"], "y.txt")] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Inspect documents" }));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Remove x.txt" }));
  await waitFor(() => {
    expect(screen.queryByText("x.txt")).toBeNull();
  });
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Inspect documents" })).toHaveProperty(
      "disabled",
      false,
    );
  });
  expect([...held.values()]).toEqual(["y.txt"]);
  expect(listedRows()).toEqual(["y.txt", "annual.txt"]);
  expect(screen.getByText("Will be copied")).toBeTruthy();
});

it("S19-4-4 a selected file sharing an earlier file's folded name is listed once", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const { fetchMock } = foldingService(earlierNamed("Annual.txt"));
  vi.stubGlobal("fetch", fetchMock);
  render(<StartRun mode="live" navigate={vi.fn()} from="earlier" />);
  expect(await screen.findByText("Annual.txt")).toBeTruthy();
  fireEvent.change(await screen.findByLabelText("Documents"), {
    target: { files: [new File(["this year's filing"], "annual.txt")] },
  });
  await screen.findByText("Selected");
  expect(listedRows()).toEqual(["annual.txt"]);
  expect(screen.queryByText("Will be copied")).toBeNull();
});
