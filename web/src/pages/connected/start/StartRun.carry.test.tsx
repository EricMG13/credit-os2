import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { StartRun } from "../StartRun";

Element.prototype.scrollIntoView = vi.fn();

const caps = { credit_snapshot: "30", credit_screening: "10" };
const template = {
  run: { as_of: "", pathway: "credit_snapshot", case_kind: "public" },
  identity: { issuer_name: "", issuer_id: "" },
};
const earlier = (names: string[]) => ({
  run: "earlier",
  issuer_id: "northbridge",
  issuer_name: "Northbridge",
  context: {
    run: { as_of: "", pathway: "credit_snapshot", case_kind: "public" },
    identity: { issuer_name: "Northbridge", issuer_id: "northbridge" },
  },
  files: names.map((name) => ({ name, size: 5 })),
  level: "basic",
  modules: [],
  max_turns: 32,
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** A service that follows `submissions.carry`: it leaves out the names it is sent, copies the rest
 * unless `same` names an earlier file as the bytes of an upload, and records every request. */
function service(names: string[], same: Record<string, string> = {}) {
  const sent: string[] = [];
  const carries: unknown[] = [];
  const held = new Set<string>();
  const json = (value: unknown, status = 200) => Promise.resolve(Response.json(value, { status }));
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const url = new URL(path, "http://service.test");
      const name = url.searchParams.get("name") ?? "";
      const method = init?.method ?? "GET";
      sent.push(`${method} ${url.pathname}`);
      if (path === "/connected/context") return json({ ...template, submission_caps_usd: caps });
      if (path === "/api/runs/earlier/inputs") return json(earlier(names));
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
        const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}") as {
          leave_out?: string[];
        };
        carries.push(body);
        const copied = names.filter((n) => !(body.leave_out ?? []).includes(n) && !(n in same));
        for (const n of copied) held.add(n);
        return json({
          carried: copied,
          kept: [],
          ...(Object.keys(same).length > 0 ? { same_content: same } : {}),
        });
      }
      if (url.pathname === "/api/submissions/d1/reading")
        return json({
          documents: [...held].sort().map((source) => ({ source, kind: "annual_report" })),
          ignored: [],
          error: "",
        });
      throw new Error(`Unexpected request ${method} ${path}`);
    }),
  );
  return { sent, carries, held };
}

async function inspect(upload: string[]) {
  fireEvent.change(screen.getByLabelText("Documents"), {
    target: { files: upload.map((name) => new File(["new"], name)) },
  });
  fireEvent.click(await screen.findByRole("button", { name: "Inspect documents" }));
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Inspect documents" })).toHaveProperty(
      "disabled",
      false,
    );
  });
  await new Promise((settle) => setTimeout(settle, 50));
}

it("F5-a the carry names the files left out and nothing is deleted after it", async () => {
  const { sent, carries, held } = service(["a.txt", "b.txt"]);
  render(<StartRun mode="live" navigate={vi.fn()} from="earlier" />);
  expect(await screen.findByText("a.txt")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Remove a.txt" }));
  await waitFor(() => {
    expect(screen.queryByText("a.txt")).toBeNull();
  });
  await inspect(["c.txt"]);
  expect(carries).toEqual([{ run: "earlier", leave_out: ["a.txt"] }]);
  expect(sent.filter((line) => line.startsWith("DELETE"))).toEqual([]);
  expect([...held].sort()).toEqual(["b.txt", "c.txt"]);
});

it("F5-a a carry with nothing left out sends no leave_out", async () => {
  const { carries } = service(["a.txt"]);
  render(<StartRun mode="live" navigate={vi.fn()} from="earlier" />);
  expect(await screen.findByText("a.txt")).toBeTruthy();
  await inspect(["c.txt"]);
  expect(carries).toEqual([{ run: "earlier" }]);
});

it("F5-b an earlier file with an upload's bytes is shown as not carried and its removal deletes nothing", async () => {
  const { sent } = service(["a.txt"], { "a.txt": "new.txt" });
  render(<StartRun mode="live" navigate={vi.fn()} from="earlier" />);
  expect(await screen.findByText("a.txt")).toBeTruthy();
  await inspect(["new.txt"]);
  expect(screen.getByText("Not carried")).toBeTruthy();
  expect(screen.getByText(/Same content as new\.txt/)).toBeTruthy();
  expect(screen.queryByText("Copied")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Remove a.txt" }));
  await waitFor(() => {
    expect(screen.queryByText("Not carried")).toBeNull();
  });
  expect(sent.filter((line) => line.startsWith("DELETE"))).toEqual([]);
  expect(screen.queryAllByRole("alert").map((node) => node.textContent)).toEqual([]);
});
