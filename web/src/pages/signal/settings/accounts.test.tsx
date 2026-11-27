import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountsSection } from "./AccountsSection";

const signedInAt = "2026-11-26T10:00:00+00:00";

function account(
  id: number,
  display_name: string,
  profile_type: "reader" | "analyst" | "admin",
  disabled = false,
  signed_in_at: string | null = null,
) {
  return { id, display_name, profile_type, disabled, signed_in_at };
}

function api(accounts: ReturnType<typeof account>[], self: number) {
  const calls: { path: string; method: string; body: string | null }[] = [];
  const fetchMock = vi.fn((path: string, init?: RequestInit) => {
    calls.push({
      path,
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? init.body : null,
    });
    if (path === "/auth/accounts") return Promise.resolve(Response.json({ accounts }));
    if (path === "/auth/me") return Promise.resolve(Response.json({ account: { id: self } }));
    const profile = /^\/auth\/accounts\/(\d+)\/profile-type$/.exec(path);
    if (profile !== null) {
      const found = accounts.find((item) => item.id === Number(profile[1]));
      const body = init?.body;
      if (found === undefined || typeof body !== "string")
        return Promise.resolve(Response.json({ error: "missing" }, { status: 404 }));
      Object.assign(found, JSON.parse(body) as object);
      return Promise.resolve(Response.json({ account: found }));
    }
    const disable = /^\/auth\/accounts\/(\d+)\/disable$/.exec(path);
    if (disable !== null) {
      const found = accounts.find((item) => item.id === Number(disable[1]));
      if (found === undefined)
        return Promise.resolve(Response.json({ error: "missing" }, { status: 404 }));
      found.disabled = true;
      return Promise.resolve(Response.json({ account: found }));
    }
    throw new Error(`Unexpected account request ${path}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Accounts settings", () => {
  it("shows a read-only directory with explicit sign-in time and null state", async () => {
    const { calls } = api(
      [
        account(1, "Alex Reader", "reader", false, signedInAt),
        account(2, "No Login Yet", "analyst"),
      ],
      1,
    );
    render(<AccountsSection profileType="reader" />);

    expect(await screen.findByText("Alex Reader")).toBeInTheDocument();
    expect(screen.getByText("2026-11-26T10:00:00+00:00")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Last recorded sign-in" })).toBeInTheDocument();
    expect(screen.getByText("No recorded sign-in")).toBeInTheDocument();
    expect(
      within(await screen.findByRole("row", { name: /Alex Reader/ })).getByText("Enabled"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Disable" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Profile:/ })).toBeNull();
    expect(calls).toEqual([
      { path: "/auth/accounts", method: "GET", body: null },
      { path: "/auth/me", method: "GET", body: null },
    ]);
  });

  it("changes another account's profile and disables it through exact routes", async () => {
    const accounts = [
      account(1, "The long administrator display name for fidelity", "admin", false, signedInAt),
      account(2, "Casey Analyst", "analyst", false, signedInAt),
    ];
    const { calls } = api(accounts, 1);
    render(<AccountsSection profileType="admin" />);

    const row = await screen.findByRole("row", { name: /Casey Analyst/ });
    fireEvent.click(within(row).getByRole("button", { name: /Profile: Casey Analyst/ }));
    fireEvent.click(await screen.findByRole("option", { name: "Reader" }));
    await waitFor(() => {
      expect(calls).toContainEqual({
        path: "/auth/accounts/2/profile-type",
        method: "POST",
        body: '{"profile_type":"reader"}',
      });
    });

    const refreshedRow = await screen.findByRole("row", { name: /Casey Analyst/ });
    fireEvent.click(within(refreshedRow).getByRole("button", { name: "Disable" }));
    await waitFor(() => {
      expect(calls).toContainEqual({
        path: "/auth/accounts/2/disable",
        method: "POST",
        body: null,
      });
    });
    const disabledRow = await screen.findByRole("row", { name: /Casey Analyst/ });
    expect(within(disabledRow).getByText("Disabled")).toBeInTheDocument();
  });

  it("keeps the last Admin and reports the fixed refusal without changing the row", async () => {
    const accounts = [account(1, "Only Admin", "admin", false, signedInAt)];
    const { calls, fetchMock } = api(accounts, 1);
    fetchMock.mockImplementation((path: string, init?: RequestInit) => {
      calls.push({ path, method: init?.method ?? "GET", body: null });
      if (path === "/auth/accounts") return Promise.resolve(Response.json({ accounts }));
      if (path === "/auth/me") return Promise.resolve(Response.json({ account: { id: 1 } }));
      return Promise.resolve(
        Response.json({ error: "keep at least one enabled Admin" }, { status: 409 }),
      );
    });
    render(<AccountsSection profileType="admin" />);

    const row = await screen.findByRole("row", { name: /Only Admin/ });
    fireEvent.click(within(row).getByRole("button", { name: /Profile: Only Admin/ }));
    fireEvent.click(await screen.findByRole("option", { name: "Analyst" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Keep at least one enabled Admin.");
    expect(within(row).getByText("admin")).toBeInTheDocument();
    expect(accounts[0]?.profile_type).toBe("admin");
  });

  it("sends a successful self-demotion through to the app refresh", async () => {
    const accounts = [
      account(1, "Admin One", "admin", false, signedInAt),
      account(2, "Admin Two", "admin", false, signedInAt),
    ];
    const { calls } = api(accounts, 1);
    const reload = vi.fn();
    const navigate = vi.fn();
    render(<AccountsSection profileType="admin" reload={reload} navigate={navigate} />);
    const row = await screen.findByRole("row", { name: /Admin One/ });
    fireEvent.click(within(row).getByRole("button", { name: /Profile: Admin One/ }));
    fireEvent.click(await screen.findByRole("option", { name: "Analyst" }));
    await waitFor(() => {
      expect(reload).toHaveBeenCalledTimes(1);
    });
    expect(navigate).not.toHaveBeenCalled();
    expect(calls).toContainEqual({
      path: "/auth/accounts/1/profile-type",
      method: "POST",
      body: '{"profile_type":"analyst"}',
    });
  });

  it("returns a successfully disabled self to local sign-in", async () => {
    const accounts = [
      account(1, "Admin One", "admin", false, signedInAt),
      account(2, "Admin Two", "admin", false, signedInAt),
    ];
    const { calls } = api(accounts, 1);
    const navigate = vi.fn();
    render(<AccountsSection profileType="admin" navigate={navigate} />);
    const row = await screen.findByRole("row", { name: /Admin One/ });
    fireEvent.click(within(row).getByRole("button", { name: "Disable" }));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/sign-in");
    });
    expect(calls).toContainEqual({
      path: "/auth/accounts/1/disable",
      method: "POST",
      body: null,
    });
  });
});
