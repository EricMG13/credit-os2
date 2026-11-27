import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectedApp } from "./ConnectedApp";
import sample from "../signal/live/snapshot.sample.json";
import type { SignalSlice } from "../signal/slice";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("passcode profile changes on a mounted Signal page", () => {
  it("refreshes the same Settings view after the header confirms a new profile", async () => {
    const account = (profileType: "reader" | "admin") => ({
      id: 7,
      display_name: "Ada Reader",
      profile_type: profileType,
      disabled: false,
      signed_in_at: "2026-11-26T10:00:00+00:00",
    });
    const readerSnapshot = structuredClone(sample) as unknown as SignalSlice;
    readerSnapshot.scenes[0].snapshot.viewer = {
      ...readerSnapshot.scenes[0].snapshot.viewer,
      name: "Ada Reader",
      initials: "AR",
      role: "reader",
      profileType: "reader",
      roleLabel: "Reader",
    };
    const adminSnapshot = structuredClone(readerSnapshot);
    adminSnapshot.scenes[0].snapshot.viewer = {
      ...adminSnapshot.scenes[0].snapshot.viewer,
      role: "writer",
      profileType: "admin",
      roleLabel: "Owner",
    };

    let accountReads = 0;
    let snapshotReads = 0;
    const requests: string[] = [];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const path =
        typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
      requests.push(path);
      if (path === "/auth/me") {
        accountReads += 1;
        return Promise.resolve(
          Response.json({ account: account(accountReads === 1 ? "reader" : "admin") }),
        );
      }
      if (path === "/auth/passcode" && init?.method === "POST") {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (path === "/auth/accounts")
        return Promise.resolve(Response.json({ accounts: [account("admin")] }));
      if (path === "/signal/api/snapshot?format=2") {
        snapshotReads += 1;
        const body = snapshotReads === 1 ? readerSnapshot : adminSnapshot;
        return Promise.resolve(Response.json({ ...body, asOf: "2026-11-26T10:00:00+00:00" }));
      }
      return Promise.resolve(Response.json({ error: "not found" }, { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    window.location.hash = "#/signal/main/settings/accounts";

    render(<ConnectedApp path="/signal" mode="live" signal signIn />);

    await screen.findByRole("columnheader", { name: "Last recorded sign-in" });
    expect(screen.queryByRole("columnheader", { name: "Admin actions" })).toBeNull();
    expect(snapshotReads).toBe(1);
    fireEvent.click(await screen.findByRole("button", { name: /Ada Reader.*Reader/ }));
    fireEvent.change(screen.getByLabelText("Admin passcode"), {
      target: { value: "the-actual-submitted-passcode" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use passcode" }));

    expect(await screen.findByText("Profile updated.")).toBeInTheDocument();
    await waitFor(() => {
      expect(snapshotReads).toBe(2);
    });
    expect(await screen.findByRole("columnheader", { name: "Admin actions" })).toBeInTheDocument();
    expect(snapshotReads).toBe(2);
    expect(window.location.hash).toBe("#/signal/main/settings/accounts");
    expect(window.location.pathname).toBe("/");
    expect(requests).toContain("/signal/api/snapshot?format=2");
    expect(screen.getByRole("heading", { name: "Accounts" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Last recorded sign-in" })).toBeInTheDocument();
  });
});
