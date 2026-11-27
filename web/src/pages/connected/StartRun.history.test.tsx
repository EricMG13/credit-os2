import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { ConnectedApp } from "./ConnectedApp";
import { standingApart } from "./start/connectedTesting";

Element.prototype.scrollIntoView = vi.fn();
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const file = new File(["sample input"], "Credit & facts.html", { type: "text/html" });
const documents = [{ source: file.name, kind: "annual_report" }];
const entries: Record<string, unknown> = {
  "/connected/context": {
    run: {
      as_of: "",
      pathway: "credit_snapshot",
      case_kind: "synthetic",
      reporting_currency: "USD",
    },
    identity: { issuer_name: "", issuer_id: "" },
    submission_caps_usd: { credit_snapshot: "30" },
  },
  "/api/submissions": { id: "sub-1" },
  "/api/submissions/sub-1/files?name=Credit%20%26%20facts.html": { name: file.name },
  "/api/submissions/sub-1/reading": { documents, ignored: [], error: "" },
  "/api/submissions/sub-1/summary": {
    digest: "server-approved",
    cap: "30",
    error: "",
    documents,
    modules: ["CP-0"],
    items: [],
    ignored: [],
    omitted: [],
    changes: "first run",
    model: "gpt",
    effort: "balanced",
  },
};

async function reviewAndSubmit(submit: Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    standingApart(
      vi.fn((path: string) => {
        if (path.endsWith("/submit")) return submit;
        if (!Object.hasOwn(entries, path)) throw new Error(`Unexpected request ${path}`);
        return Promise.resolve(Response.json(entries[path]));
      }),
    ),
  );
  render(<ConnectedApp path="/start" mode="live" navigate={vi.fn()} />);
  fireEvent.change(await screen.findByLabelText("Issuer name"), {
    target: { value: "Synthetic Générale" },
  });
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
  fireEvent.change(screen.getByLabelText("Documents"), { target: { files: [file] } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana L" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
  await screen.findByRole("heading", { name: "Purpose" });
  fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
  fireEvent.click(await screen.findByRole("button", { name: "Review run" }));
  await screen.findByRole("button", { name: "Submit, spend up to USD 30.00" });
  fireEvent.click(screen.getByRole("checkbox", { name: /Approve: I have read this summary/ }));
  fireEvent.click(screen.getByRole("button", { name: "Submit, spend up to USD 30.00" }));
  fireEvent.click(await screen.findByRole("button", { name: "Start run, up to USD 30.00" }));
}

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
  });

it("keeps the review when Back is pressed while the paid submit is in flight", async () => {
  await reviewAndSubmit(new Promise<Response>(() => undefined));
  await screen.findByRole("button", { name: "Submitting…" });
  window.history.back();
  await settle();
  expect(screen.queryByRole("heading", { name: "More context" })).toBeNull();
  expect(screen.getByRole("button", { name: "Submitting…" })).toBeInTheDocument();
});

it("keeps the review with Submit reachable when Back is pressed after an uncertain submit", async () => {
  await reviewAndSubmit(Promise.resolve(new Response("failed", { status: 500 })));
  expect(await screen.findByRole("alert")).toHaveTextContent("Submitting again is safe.");
  window.history.back();
  await settle();
  expect(screen.queryByRole("heading", { name: "More context" })).toBeNull();
  expect(screen.getByRole("button", { name: "Submit, spend up to USD 30.00" })).toBeInTheDocument();
});

const popTo = (place: string) => {
  window.dispatchEvent(new PopStateEvent("popstate", { state: { startRun: place } }));
};

it("keeps the review when Back arrives after the lost reply but before the page has redrawn", async () => {
  let reply!: (response: Response) => void;
  await reviewAndSubmit(
    new Promise<Response>((resolve) => {
      reply = resolve;
    }),
  );
  await screen.findByRole("button", { name: "Submitting…" });
  // Settle the reply outside act, so React has not committed when the popstate arrives.
  reply(new Response("failed", { status: 500 }));
  for (let turn = 0; turn < 20; turn += 1) await Promise.resolve();
  popTo("context");
  await settle();
  expect(screen.queryByRole("heading", { name: "More context" })).toBeNull();
  expect(screen.getByRole("alert")).toHaveTextContent("Submitting again is safe.");
  expect(screen.getByRole("button", { name: "Submit, spend up to USD 30.00" })).toBeInTheDocument();
});

it("keeps the review when Back arrives after the run was started", async () => {
  await reviewAndSubmit(Promise.resolve(Response.json({ run: "test-run", status: "queued" })));
  await settle();
  popTo("context");
  await settle();
  expect(screen.queryByRole("heading", { name: "More context" })).toBeNull();
});
