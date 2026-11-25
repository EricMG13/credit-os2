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
