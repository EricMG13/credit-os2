/**
 * Test helpers shared by the Start run page's jsdom drives: the browser the connected page needs,
 * the record of each request a drive sends, and the steps every drive takes.
 */
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { webcrypto } from "node:crypto";

/** Registers what the connected page needs in jsdom: crypto, scrollIntoView, a clean page. */
export function setUpConnectedPage() {
  Element.prototype.scrollIntoView = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("crypto", webcrypto);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
}

export type Recorded = {
  method: string;
  path: string;
  headers?: Record<string, string>;
  /** A JSON body exactly as sent; a file body as the name of the File object handed to fetch. */
  body?: string | { file: string };
};

/** One call to fetch as the goldens record it; a File body by the name of the known File. */
export function recorded(
  input: string,
  init: RequestInit | undefined,
  files: readonly File[],
): Recorded {
  const method = init?.method ?? "GET";
  const headers = init?.headers as Record<string, string> | undefined;
  const body = init?.body;
  const entry: Recorded = { method, path: input };
  if (headers) entry.headers = headers;
  if (typeof body === "string") entry.body = body;
  else if (body instanceof File) {
    const at = files.indexOf(body);
    entry.body = { file: at < 0 ? "an unknown File object" : (files[at]?.name ?? "") };
  }
  return entry;
}

/** The standing portfolios a drive is shown: every set stored, so no first fetch is asked for. */
const STANDING_LISTING = {
  portfolios: [
    ["clo", "CLO portfolio", "2026-10-31", 7, false],
    ["lvln", "Loan index fund (LVLN)", "2026-11-24", 5, true],
    ["jnk", "High-yield bond fund (JNK)", "2026-11-23", 2, true],
  ].map(([key, name, asOf, positions, fetchable]) => ({
    key,
    name,
    as_of: asOf,
    stored_at: "2026-11-25T09:30:00+00:00",
    positions,
    failure: null,
    error: null,
    fetchable,
  })),
};

/**
 * A page's fetch with the standing portfolios' own routes (`/api/reference-portfolios…`) answered
 * apart: with `STANDING_LISTING`, recorded in `apart` when one is given, and never passed to
 * `inner`. A drive's own record, and so its golden file, holds the run-start requests alone, as it
 * did before the Documents step showed the standing portfolios; `StandingPortfolios.test.tsx`
 * holds what is sent on their routes.
 */
export function standingApart(
  inner: (input: string, init?: RequestInit) => unknown,
  apart?: Recorded[],
) {
  return (input: string, init?: RequestInit) => {
    if (!input.startsWith("/api/reference-portfolios")) return inner(input, init);
    apart?.push(recorded(input, init, []));
    return Promise.resolve(Response.json(STANDING_LISTING));
  };
}

export const issuerReads = (log: readonly Recorded[]) =>
  log.filter(({ path }) => path.startsWith("/api/issuers/")).length;

export async function toPurpose() {
  fireEvent.click(screen.getByRole("button", { name: "Continue to purpose" }));
  await screen.findByRole("heading", { name: "Purpose" });
}

export async function toContext() {
  fireEvent.click(screen.getByRole("button", { name: "Continue to context" }));
  await screen.findByRole("heading", { name: "More context" });
}

/** A drive's requests as its golden file holds them. */
export function golden(log: readonly Recorded[]) {
  return `${JSON.stringify(log, null, 1)}\n`;
}
