import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectedApp } from "./ConnectedApp";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("connected account controls", () => {
  it("makes no auth request and adds no control without the sign-in meta", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ConnectedApp path="/missing" search="" mode="synthetic" />);
    expect(screen.queryByRole("button", { name: "Account" })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["synthetic mode", { signIn: true, mode: "synthetic" as const }],
    ["read-only mode", { signIn: true, mode: "live" as const, readOnly: true }],
  ])("keeps account controls off in %s", (_name, props) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ConnectedApp path="/missing" search="" {...props} />);
    expect(screen.queryByRole("button", { name: "Account" })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the actual account from /auth/me only when sign-in is enabled", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL): Promise<Response> => {
      expect(
        typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url,
      ).toBe("/auth/me");
      return Promise.resolve(
        Response.json({
          account: { id: 743811, display_name: "Ada L", profile_type: "reader" },
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ConnectedApp path="/missing" search="" mode="live" signIn />);
    const accountButton = await screen.findByRole("button", { name: "Ada L · Reader" });
    expect(accountButton).toHaveAttribute("aria-controls", "account-controls");
    expect(document.getElementById("account-controls")).toHaveAttribute("hidden");
    fireEvent.click(accountButton);
    expect(screen.getByText("Ada L")).toBeInTheDocument();
    expect(screen.getByText("Reader profile")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("743811");
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
