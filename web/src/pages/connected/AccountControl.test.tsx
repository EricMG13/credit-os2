import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountControl } from "./AccountControl";

const reader = { id: 1, display_name: "Ada Analyst", profile_type: "reader" };

function response(account: typeof reader | null, status = 200) {
  return Response.json({ account }, { status });
}

function requestPath(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.pathname;
  return input.url;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function containsText(value: unknown, expected: string, seen = new WeakSet()): boolean {
  if (typeof value === "string") return value.includes(expected);
  if (typeof value !== "object" || value === null || seen.has(value)) return false;
  seen.add(value);
  return Object.values(value).some((child) => containsText(child, expected, seen));
}

describe("AccountControl", () => {
  it("reads the actual Reader, promotes through the passcode endpoint, re-reads, and signs out", async () => {
    let meCalls = 0;
    let passcodeBodyMatches = false;
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const path = requestPath(input);
      if (path === "/auth/me") {
        meCalls += 1;
        return Promise.resolve(
          response(meCalls === 1 ? reader : { ...reader, profile_type: "admin" }),
        );
      }
      if (path === "/auth/passcode" && init?.method === "POST") {
        try {
          passcodeBodyMatches =
            typeof init.body === "string" &&
            (JSON.parse(init.body) as { passcode?: string }).passcode === "actual-passcode";
        } catch {
          passcodeBodyMatches = false;
        }
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (path === "/auth/sign-out" && init?.method === "POST")
        return Promise.resolve(new Response(null, { status: 204 }));
      throw new Error(`Unexpected request ${path}`);
    });
    const navigate = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<AccountControl navigate={navigate} />);
    fireEvent.click(await screen.findByRole("button", { name: /Ada Analyst.*Reader/ }));
    expect(screen.getByText("Reader profile")).toBeInTheDocument();
    const passcode = screen.getByLabelText("Admin passcode");
    fireEvent.change(passcode, { target: { value: "actual-passcode" } });
    fireEvent.click(screen.getByRole("button", { name: "Use passcode" }));

    expect(await screen.findByRole("button", { name: /Ada Analyst.*Admin/ })).toBeInTheDocument();
    expect(passcode).toHaveValue("");
    expect(passcodeBodyMatches).toBe(true);
    expect(fetchMock.mock.calls.filter(([path]) => requestPath(path) === "/auth/me")).toHaveLength(
      2,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/sign-in");
    });
    expect(
      fetchMock.mock.calls.map(([path, init]) => [requestPath(path), init?.method ?? "GET"]),
    ).toEqual([
      ["/auth/me", "GET"],
      ["/auth/passcode", "POST"],
      ["/auth/me", "GET"],
      ["/auth/sign-out", "POST"],
    ]);
  });

  it("shows only a fixed passcode refusal and does not echo or log the submitted value", async () => {
    const submitted = "secret-that-must-not-leak";
    const fetchMock = vi.fn((input: RequestInfo | URL): Promise<Response> => {
      if (requestPath(input) === "/auth/me") return Promise.resolve(response(reader));
      return Promise.resolve(Response.json({ error: submitted }, { status: 403 }));
    });
    const logSpies = [
      vi.spyOn(console, "debug"),
      vi.spyOn(console, "info"),
      vi.spyOn(console, "log"),
      vi.spyOn(console, "warn"),
      vi.spyOn(console, "error"),
    ];
    logSpies.forEach((spy) => spy.mockImplementation(() => undefined));
    vi.stubGlobal("fetch", fetchMock);
    render(<AccountControl navigate={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: /Ada Analyst.*Reader/ }));
    fireEvent.change(screen.getByLabelText("Admin passcode"), { target: { value: submitted } });
    fireEvent.click(screen.getByRole("button", { name: "Use passcode" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That passcode was not accepted.");
    expect(!document.body.textContent.includes(submitted)).toBe(true);
    const logsContainPasscode = logSpies.some((spy) =>
      spy.mock.calls.some((call) => call.some((entry: unknown) => containsText(entry, submitted))),
    );
    expect(!logsContainPasscode).toBe(true);
  });

  it("shows a fixed sign-out failure without rendering the server response or redirecting", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL): Promise<Response> => {
      if (requestPath(input) === "/auth/me") return Promise.resolve(response(reader));
      return Promise.resolve(Response.json({ error: "private route detail" }, { status: 503 }));
    });
    const navigate = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<AccountControl navigate={navigate} />);
    fireEvent.click(await screen.findByRole("button", { name: /Ada Analyst.*Reader/ }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You could not be signed out. Try again.",
    );
    expect(document.body.textContent).not.toContain("private route detail");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("renders no account control and makes no auth request when sign-in is disabled", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<AccountControl enabled={false} navigate={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
