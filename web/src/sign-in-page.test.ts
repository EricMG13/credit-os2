import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(process.cwd(), "public/sign-in.html"), "utf8");

describe("standalone sign-in page", () => {
  it("has the hand-written public copy, exact action, and one safe server error marker", () => {
    expect(page).toContain("<title>Sign in — Credit OS</title>");
    expect(page).toMatch(/<h1\b[^>]*>Sign in with your work account<\/h1>/);
    expect(page).not.toContain("Use your organisation account");
    expect(page).toContain('href="/auth/start"');
    expect(page.match(/<!-- sign-in-error -->/g)).toHaveLength(1);
    expect(page).toMatch(/#1d4ed8/i);
    expect(page).toContain(":focus-visible");
    expect(page).toContain("/symbol.svg");
    expect(page).toContain("/fonts/Geist-Regular.woff2");
    expect(page).toContain("/fonts/Geist-SemiBold.woff2");
  });

  it("loads no remote assets and exposes no account or issuer data before sign-in", () => {
    expect(page).not.toMatch(/(?:src|href)=["']https?:/i);
    expect(page).not.toMatch(/<script\b/i);
    expect(page).not.toMatch(/(?:account|issuer|report|module|library)\s*[:=]/i);
  });

  it("keeps the ordinary reason empty and callback refusal text in the alert region", () => {
    const document = new DOMParser().parseFromString(page, "text/html");
    const reason = document.querySelector<HTMLElement>(".reason[role=alert]");
    expect(reason?.textContent).toBe("");
    if (!reason) throw new Error("The fixed callback reason region is missing");
    reason.textContent = "this account cannot sign in here";
    expect(reason.textContent).toBe("this account cannot sign in here");
    expect(reason.getAttribute("aria-live")).toBe("assertive");
  });
});
