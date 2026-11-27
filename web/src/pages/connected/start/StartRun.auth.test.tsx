import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ConnectedApp } from "../ConnectedApp";
import { StartRun } from "../StartRun";
import { setUpConnectedPage } from "./connectedTesting";

setUpConnectedPage();

const context = {
  run: { as_of: "", pathway: "credit_snapshot", case_kind: "public" },
  identity: { issuer_name: "", issuer_id: "" },
};
const caps = { credit_snapshot: "30", lite_credit_assessment: "20", deep_credit_assessment: "50" };

function page(runAccess: unknown, profile = "reader") {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => {
      calls.push(path);
      if (path === "/connected/context") {
        const answer = { ...context, submission_caps_usd: caps };
        return Promise.resolve(
          Response.json(runAccess === undefined ? answer : { ...answer, run_access: runAccess }),
        );
      }
      if (path === "/auth/me")
        return Promise.resolve(
          Response.json({ account: { id: 1, display_name: "Casey R", profile_type: profile } }),
        );
      if (path === "/api/reference-portfolios")
        return Promise.resolve(
          Response.json({
            portfolios: [
              {
                key: "clo",
                name: "CLO",
                as_of: null,
                stored_at: "2026-11-25",
                positions: 0,
                failure: null,
                error: null,
                fetchable: false,
              },
              {
                key: "lvln",
                name: "LVLN",
                as_of: "2026-11-25",
                stored_at: "2026-11-25",
                positions: 1,
                failure: null,
                error: null,
                fetchable: true,
              },
              {
                key: "jnk",
                name: "JNK",
                as_of: "2026-11-25",
                stored_at: "2026-11-25",
                positions: 1,
                failure: null,
                error: null,
                fetchable: true,
              },
            ],
          }),
        );
      if (path.startsWith("/api/issuers/"))
        return Promise.resolve(Response.json({ latest_run: "", runs: 0, latest_as_of: "" }));
      if (path === "/api/submissions" && calls.length)
        return Promise.resolve(Response.json({ id: "draft" }));
      if (path === "/api/submissions/draft/files?name=annual.txt")
        return Promise.resolve(Response.json({ name: "annual.txt" }));
      if (path === "/api/submissions/draft/reading")
        return Promise.resolve(
          Response.json({
            documents: [{ source: "annual.txt", kind: "annual_report" }],
            ignored: [],
            error: "",
          }),
        );
      throw new Error(`Unexpected request ${path}`);
    }),
  );
  render(<ConnectedApp path="/start" mode="live" signIn />);
  return calls;
}

afterEach(cleanup);

it("shows a Reader the Start a run page without mounting any preparation requests", async () => {
  const calls = page({ can_prepare: false, analyst_name: null });

  expect(await screen.findByRole("heading", { level: 1, name: "Start a run" })).toBeVisible();
  expect(await screen.findByText(/Reader profile can view run setup/)).toBeVisible();
  expect(screen.queryByLabelText("Documents")).toBeNull();
  expect(screen.queryByRole("button", { name: "Continue to purpose" })).toBeNull();
  expect(screen.queryByRole("button", { name: /Submit/ })).toBeNull();
  await waitFor(() => {
    expect(calls).toContain("/auth/me");
  });
  expect(calls).toEqual(expect.arrayContaining(["/connected/context", "/auth/me"]));
  expect(calls).not.toContain("/api/submissions");
  expect(calls).not.toContain("/api/reference-portfolios");
  expect(calls.some((path) => path.includes("/ensure"))).toBe(false);
});

it("refreshes run access after the same-page passcode upgrade before mounting intake", async () => {
  let accountReads = 0;
  let contextReads = 0;
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      calls.push(path);
      if (path === "/connected/context") {
        contextReads += 1;
        return Promise.resolve(
          Response.json({
            ...context,
            submission_caps_usd: caps,
            run_access:
              contextReads === 1
                ? { can_prepare: false, analyst_name: null }
                : { can_prepare: true, analyst_name: "Casey R" },
          }),
        );
      }
      if (path === "/auth/me") {
        accountReads += 1;
        return Promise.resolve(
          Response.json({
            account: {
              id: 1,
              display_name: "Casey R",
              profile_type: accountReads === 1 ? "reader" : "analyst",
            },
          }),
        );
      }
      if (path === "/auth/passcode" && init?.method === "POST")
        return Promise.resolve(Response.json({ profile_type: "analyst" }));
      if (path === "/api/reference-portfolios")
        return Promise.resolve(
          Response.json({
            portfolios: [
              {
                key: "clo",
                name: "CLO",
                as_of: null,
                stored_at: "2026-11-25",
                positions: 0,
                failure: null,
                error: null,
                fetchable: false,
              },
            ],
          }),
        );
      throw new Error(`Unexpected request ${path}`);
    }),
  );
  render(<ConnectedApp path="/start" mode="live" signIn />);

  expect(await screen.findByText(/Reader profile can view run setup/)).toBeVisible();
  expect(screen.queryByLabelText("Documents")).toBeNull();
  fireEvent.click(await screen.findByRole("button", { name: /Casey R · Reader/ }));
  fireEvent.change(screen.getByLabelText("Admin passcode"), { target: { value: "promotion" } });
  fireEvent.click(screen.getByRole("button", { name: "Use passcode" }));

  expect(await screen.findByLabelText("Documents")).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: /Casey R · Analyst/ })).toBeVisible();
  expect(contextReads).toBe(2);
  expect(calls).not.toContain("/api/submissions");
});

it("keeps an authorized writer's draft mounted but inaccessible during run-access refresh", async () => {
  let accountReads = 0;
  let contextReads = 0;
  let releaseContext: ((response: Response) => void) | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      if (path === "/connected/context") {
        contextReads += 1;
        if (contextReads === 2)
          return new Promise<Response>((resolve) => {
            releaseContext = resolve;
          });
        return Promise.resolve(
          Response.json({
            ...context,
            submission_caps_usd: caps,
            run_access: { can_prepare: true, analyst_name: "Casey R" },
          }),
        );
      }
      if (path === "/auth/me") {
        accountReads += 1;
        return Promise.resolve(
          Response.json({
            account: {
              id: 1,
              display_name: "Casey R",
              profile_type: accountReads === 1 ? "analyst" : "admin",
            },
          }),
        );
      }
      if (path === "/auth/passcode" && init?.method === "POST")
        return Promise.resolve(Response.json({ profile_type: "admin" }));
      if (path === "/api/reference-portfolios")
        return Promise.resolve(
          Response.json({
            portfolios: [
              {
                key: "clo",
                name: "CLO",
                as_of: null,
                stored_at: "2026-11-25",
                positions: 0,
                failure: null,
                error: null,
                fetchable: false,
              },
            ],
          }),
        );
      throw new Error(`Unexpected request ${path}`);
    }),
  );
  render(<ConnectedApp path="/start" mode="live" signIn />);

  const issuer = await screen.findByLabelText("Issuer name");
  fireEvent.change(issuer, { target: { value: "Northbridge" } });
  fireEvent.click(await screen.findByRole("button", { name: /Casey R · Analyst/ }));
  fireEvent.change(screen.getByLabelText("Admin passcode"), { target: { value: "promotion" } });
  fireEvent.click(screen.getByRole("button", { name: "Use passcode" }));

  expect(await screen.findByText("Refreshing run access…")).toBeVisible();
  expect(screen.getByLabelText("Issuer name")).not.toBeVisible();
  expect(releaseContext).toBeDefined();
  releaseContext?.(
    Response.json({
      ...context,
      submission_caps_usd: caps,
      run_access: { can_prepare: true, analyst_name: "Casey R" },
    }),
  );
  expect(await screen.findByLabelText("Issuer name")).toHaveValue("Northbridge");
  expect(await screen.findByRole("button", { name: /Casey R · Admin/ })).toBeVisible();
});

it("lets an Analyst without a canonical name prepare files but refuses review before summary", async () => {
  const calls = page({ can_prepare: true, analyst_name: null }, "analyst");

  expect(await screen.findByText("an Admin must set your analyst name")).toBeVisible();
  expect(screen.queryByLabelText("Your name")).toBeNull();
  fireEvent.change(screen.getByLabelText("Issuer name"), { target: { value: "Northbridge" } });
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
  fireEvent.change(screen.getByLabelText("Documents"), {
    target: { files: [new File(["annual"], "annual.txt", { type: "text/plain" })] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
  await screen.findByRole("heading", { name: "Purpose" });
  expect(calls).toContain("/api/submissions");
  fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
  await screen.findByRole("heading", { name: "More context" });
  fireEvent.click(screen.getByRole("button", { name: "Review run" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("an Admin must set your analyst name");
  expect(calls.some((path) => path.endsWith("/summary"))).toBe(false);
  expect(calls.some((path) => path.endsWith("/submit"))).toBe(false);
});

it("uses the summary's canonical analyst name after it differs from run access", async () => {
  const calls: { path: string; init?: RequestInit }[] = [];
  const standing = {
    portfolios: [
      {
        key: "clo",
        name: "CLO",
        as_of: null,
        stored_at: "2026-11-25",
        positions: 0,
        failure: null,
        error: null,
        fetchable: false,
      },
      {
        key: "lvln",
        name: "LVLN",
        as_of: "2026-11-25",
        stored_at: "2026-11-25",
        positions: 1,
        failure: null,
        error: null,
        fetchable: true,
      },
      {
        key: "jnk",
        name: "JNK",
        as_of: "2026-11-25",
        stored_at: "2026-11-25",
        positions: 1,
        failure: null,
        error: null,
        fetchable: true,
      },
    ],
  };
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      calls.push({ path, init });
      if (path === "/connected/context")
        return Promise.resolve(
          Response.json({
            ...context,
            submission_caps_usd: caps,
            run_access: { can_prepare: true, analyst_name: "Eric G" },
            role: "analyst",
            account: { id: 7, display_name: "Eric G" },
            account_id: 7,
            profile_type: "analyst",
          }),
        );
      if (path === "/api/reference-portfolios") return Promise.resolve(Response.json(standing));
      if (path.startsWith("/api/issuers/"))
        return Promise.resolve(Response.json({ latest_run: "", runs: 0, latest_as_of: "" }));
      if (path === "/api/submissions") return Promise.resolve(Response.json({ id: "draft" }));
      if (path === "/api/submissions/draft/files?name=annual.txt")
        return Promise.resolve(Response.json({ name: "annual.txt" }));
      if (path === "/api/submissions/draft/reading")
        return Promise.resolve(
          Response.json({
            documents: [{ source: "annual.txt", kind: "annual_report" }],
            ignored: [],
            error: "",
          }),
        );
      if (path === "/api/submissions/draft/summary")
        return Promise.resolve(
          Response.json({
            documents: [{ source: "annual.txt", kind: "annual_report" }],
            ignored: [],
            error: "",
            digest: "reviewed",
            cap: "30",
            modules: ["CP-0"],
            items: [],
            omitted: [],
            changes: "first run",
            model: "gpt",
            effort: "balanced",
            submitted_by: "Ana L",
          }),
        );
      throw new Error(`Unexpected request ${path}`);
    }),
  );
  render(<StartRun mode="live" signIn navigate={vi.fn()} />);

  expect(await screen.findByText("Your analyst name: Eric G")).toBeVisible();
  expect(screen.queryByLabelText("Your name")).toBeNull();
  fireEvent.change(screen.getByLabelText("Issuer name"), { target: { value: "Northbridge" } });
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2026-10-31" } });
  fireEvent.change(screen.getByLabelText("Documents"), {
    target: { files: [new File(["annual"], "annual.txt", { type: "text/plain" })] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
  await screen.findByRole("heading", { name: "Purpose" });
  fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
  await screen.findByRole("heading", { name: "More context" });
  fireEvent.click(screen.getByRole("button", { name: "Review run" }));

  const review = await screen.findByRole("heading", { name: "Review and start" });
  expect(review).toBeVisible();
  expect(screen.getAllByText("Ana L").length).toBeGreaterThan(0);
  expect(screen.queryByText("Eric G")).toBeNull();
  const summaryCall = calls.find((call) => call.path.endsWith("/summary"));
  expect(summaryCall).toBeDefined();
  const body = summaryCall?.init?.body;
  expect(typeof body).toBe("string");
  const sent = JSON.parse(body as string) as {
    context: Record<string, unknown>;
    submitted_by: string;
  };
  expect(sent.submitted_by).toBe("Eric G");
  expect(sent.context).not.toHaveProperty("run_access");
  expect(sent.context).not.toHaveProperty("role");
  expect(sent.context).not.toHaveProperty("account");
  expect(sent.context).not.toHaveProperty("account_id");
  expect(sent.context).not.toHaveProperty("profile_type");
});

it.each([
  ["missing", undefined],
  ["malformed", { can_prepare: true, analyst_name: 12 }],
])("fails closed for signed-in context with %s run access", async (_label, runAccess) => {
  const calls = page(runAccess);

  expect(await screen.findByRole("alert")).toHaveTextContent("run options could not be loaded");
  expect(screen.queryByLabelText("Documents")).toBeNull();
  expect(calls).not.toContain("/api/submissions");
  expect(calls).not.toContain("/api/reference-portfolios");
});
