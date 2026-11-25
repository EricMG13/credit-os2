/**
 * The Purpose step's options are segmented groups of buttons in place of selects. A select fires
 * no change when the option already chosen is chosen again; pressing the segment already pressed
 * must change nothing either: not what is sent, not the approval, not the modules.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConnectedApp } from "../ConnectedApp";
import {
  recorded,
  setUpConnectedPage,
  toContext,
  toPurpose,
  type Recorded,
} from "./connectedTesting";
import { DOCUMENTS, FILING, summaryFor, TEMPLATE } from "./goldenFixtures";

setUpConnectedPage();

const REFUSAL = [
  {
    id: "CP-4:declared-none",
    scope: "CP-4",
    outcome: "will_refuse",
    reason: "Legal documents declared none.",
    fix: "Add the executed agreement.",
    inherited_from: [],
  },
  {
    id: "CP-4C:from:CP-4",
    scope: "CP-4C",
    outcome: "will_refuse",
    reason: "Expected to refuse because it reads CP-4.",
    fix: "",
    inherited_from: ["CP-4"],
  },
];

/** The synthetic service, recording every call; `items` are the summary's limits. */
function service(items: readonly unknown[] = []) {
  const log: Recorded[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string, init?: RequestInit) => {
      const entry = recorded(input, init, [FILING]);
      log.push(entry);
      const reply = (value: unknown) => Promise.resolve(Response.json(value));
      const path = new URL(input, "http://service.test").pathname;
      if (input === "/connected/context") return reply(TEMPLATE);
      if (input === "/api/submissions" && entry.method === "POST") return reply({ id: "sub-1" });
      if (path === "/api/submissions/sub-1/files") return reply({ name: FILING.name });
      if (input === "/api/submissions/sub-1/reading")
        return reply({ documents: DOCUMENTS.slice(1, 2), ignored: [], error: "" });
      if (input === "/api/submissions/sub-1/summary") {
        const answers = JSON.parse(typeof entry.body === "string" ? entry.body : "{}") as {
          modules: string[];
          context: { run: { pathway: keyof typeof TEMPLATE.submission_caps_usd } };
        };
        const cap = TEMPLATE.submission_caps_usd[answers.context.run.pathway];
        const modules = answers.modules.length ? answers.modules : ["CP-0", "CP-4", "CP-4C"];
        return reply({ ...summaryFor(cap, modules), items });
      }
      if (path.startsWith("/api/issuers/"))
        return reply({ latest_run: "", runs: 0, latest_as_of: "" });
      return Promise.resolve(Response.json({ error: `unknown path ${input}` }, { status: 404 }));
    }),
  );
  return log;
}

/** What the last summary request sent. */
function lastSummary(log: readonly Recorded[]) {
  const sent = log.filter(({ path }) => path === "/api/submissions/sub-1/summary").at(-1);
  if (!sent) throw new Error("No summary was requested");
  return JSON.parse(typeof sent.body === "string" ? sent.body : "{}") as {
    context: { run: { run_type?: string } };
    modules: string[];
  };
}

async function toPurposeStep() {
  render(<ConnectedApp path="/start" mode="synthetic" />);
  fireEvent.change(await screen.findByLabelText("Issuer name", {}, { timeout: 10000 }), {
    target: { value: "Northbridge Synthetic Group" },
  });
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2025-03-31" } });
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana L" } });
  fireEvent.change(screen.getByLabelText("Documents"), { target: { files: [FILING] } });
  await toPurpose();
}

const press = (group: string, name: string) => {
  fireEvent.click(within(screen.getByRole("group", { name: group })).getByRole("button", { name }));
};

async function review() {
  fireEvent.click(screen.getByRole("button", { name: "Review run" }));

  await screen.findByRole("region", { name: "Limits to decide" });
}

describe("pressing the option already chosen", { timeout: 30000 }, () => {
  it("sends what an untouched form sends: Relative Value still trades as secondary", async () => {
    const untouched = service();
    await toPurposeStep();
    fireEvent.click(screen.getByRole("radio", { name: "Relative Value" }));
    await toContext();
    await review();
    expect(lastSummary(untouched).context.run.run_type).toBe("secondary");
    screen.getByRole("heading", { name: "Review and start" });
  });

  it("sends secondary for Relative Value after the pressed market view is pressed again", async () => {
    const log = service();
    await toPurposeStep();
    press("Market view", "No market view (research)");
    fireEvent.click(screen.getByRole("radio", { name: "Relative Value" }));
    await toContext();
    await review();
    expect(lastSummary(log).context.run.run_type).toBe("secondary");
  });

  it("keeps the approval and decisions when the market view already chosen is pressed again", async () => {
    service(REFUSAL);
    await toPurposeStep();
    await toContext();
    await review();
    fireEvent.click(screen.getByRole("checkbox", { name: /^I accept this limit/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /^Approve: I have read this summary/ }));
    fireEvent.click(screen.getByRole("button", { name: "Go back to Purpose" }));
    await screen.findByRole("heading", { name: "Purpose" });
    press("Market view", "No market view (research)");
    expect(screen.queryByText(/You changed the market view/)).toBeNull();
    await toContext();
    await review();
    expect(screen.getByRole("checkbox", { name: /^I accept this limit/ })).toBeChecked();
  });

  it("keeps the modules left out when the pressed form level is pressed again", async () => {
    const log = service(REFUSAL);
    await toPurposeStep();
    await toContext();
    await review();
    fireEvent.click(screen.getByRole("button", { name: /^Leave out Legal & covenants/ }));
    await screen.findByRole("heading", { name: "More context" });
    fireEvent.click(screen.getByRole("button", { name: "Go back to Purpose" }));
    await screen.findByRole("heading", { name: "Purpose" });
    press("Run form level", "Basic");
    await toContext();
    await review();
    await waitFor(() => {
      expect(lastSummary(log).modules).not.toContain("CP-4");
    });
    expect(lastSummary(log).modules.length).toBeGreaterThan(0);
  });
});
