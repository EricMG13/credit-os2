// The redesign's rules as the Signal screens carry them (DESIGN.md): the type ramp, the shape, the
// control sizes and the selected treatment, by class. Behaviour is tested in the page's own files.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, screen, within } from "@testing-library/react";
import { page, show } from "./test-helpers";

const here = import.meta.dirname;
const classesOf = (element: Element | null | undefined) => (element?.className ?? "").split(" ");

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

describe("the Signal files against the design's scales", () => {
  const files = sources(here).map((file) => [
    path.relative(here, file),
    readFileSync(file, "utf8"),
  ]);

  it.each([
    ["a shadow on a card or pill", /(?<![\w-])shadow-(1|sm|md|lg)(?![\w-])/],
    ["a weight above 600", /(?<![\w-])font-(bold|extrabold|black)(?![\w-])/],
    ["a breakpoint written as the old shell's raw width", /min-\[(768|1024)px\]:/],
    ["a rule thicker or thinner than one pixel", /(border-[rltbxy]|ring)-\[(0\.5|1\.5)px\]/],
    [
      "a radius off the 6, 8, 12, 20 scale",
      /(?<![\w-])rounded(-(xs|sm|xl|2xl|3xl|full))?(?![\w-[])/,
    ],
  ])("holds no %s", (_, pattern) => {
    const found = files.filter(([, text]) => pattern.test(text as string)).map(([name]) => name);
    expect(found).toEqual([]);
  });

  it("writes text sizes from the ramp, except the text area copied from the kit's input", () => {
    const off = /(?<![\w-])text-(xs|sm|md|lg|xl)(?![\w-])/;
    const found = files.filter(([, text]) => off.test(text as string)).map(([name]) => name);
    expect(found).toEqual([path.join("parts", "TextArea.tsx")]);
  });
});

describe("the Signal screens in the redesign's shape", () => {
  it("lays the stories on one tile: 20px radius, a hairline edge, hairlines between, no shadow", () => {
    show("/signal/main/feed/for-you");
    const tile = page().getAllByRole("article")[0]?.parentElement;
    expect(classesOf(tile)).toEqual(
      expect.arrayContaining([
        "divide-y",
        "divide-border-hairline",
        "rounded-ds-lg",
        "border",
        "border-border-subtle",
        "bg-surface-card",
        "px-5",
        "sm:px-6",
      ]),
    );
    expect(tile?.className).not.toContain("shadow");
  });

  it("makes a headline that is a link a 32px target, 44px on a phone, in the h4 size", () => {
    show("/signal/main/feed/for-you");
    const link = page().getByRole("link", {
      name: "Corvane Packaging to close two plants as volumes fall",
    });
    expect(classesOf(link)).toEqual(
      expect.arrayContaining(["inline-flex", "min-h-8", "max-[480px]:min-h-11"]),
    );
    expect(classesOf(link.closest("h2"))).toEqual(
      expect.arrayContaining(["text-h4", "font-medium"]),
    );
  });

  it("makes each kind tab at least 32px each way", () => {
    show("/signal/main/feed/for-you");
    for (const tab of page().getAllByRole("tab")) {
      expect(classesOf(tab)).toEqual(expect.arrayContaining(["min-h-8", "min-w-8"]));
    }
  });

  it("makes the pill's Show a target and marks new stories with the accent, not the info colour", () => {
    show("/signal/main/feed/for-you");
    const showButton = page().getByRole("button", { name: /^Show \d+ new / });
    expect(classesOf(showButton)).toEqual(
      expect.arrayContaining(["min-h-8", "max-[480px]:min-h-11"]),
    );
    const dot = showButton.parentElement?.querySelector("[aria-hidden='true']");
    expect(classesOf(dot)).toContain("bg-action");
    expect(dot?.className).not.toContain("info");
  });

  it("makes Open thread and the thread's own controls targets", () => {
    show("/signal/main/group/leveraged-credit/thread/corvane-thread");
    const group = screen.getAllByRole("link", { name: /^Open thread: /, hidden: true })[0];
    expect(classesOf(group)).toEqual(
      expect.arrayContaining(["inline-flex", "min-h-8", "max-[480px]:min-h-11"]),
    );
    const panel = within(screen.getByRole("dialog", { name: "Thread" }));
    for (const control of [
      ...panel.getAllByRole("button", { name: /^Reply to / }),
      ...panel.getAllByRole("button", { name: /: comment by / }),
      panel.getByRole("button", { name: "Send" }),
    ]) {
      expect(classesOf(control)).toContain("min-h-8");
    }
  });

  it("draws a comment's time in the mono face with tabular numerals", () => {
    show("/signal/main/group/leveraged-credit/thread/corvane-thread");
    const time = within(screen.getByRole("dialog", { name: "Thread" })).getByText("10:02");
    expect(classesOf(time)).toEqual(
      expect.arrayContaining(["font-mono", "tabular-nums", "text-caption"]),
    );
  });

  it("marks the current settings section with the accent tint and gives every one a 32px row", () => {
    show("/signal/main/settings/sources");
    const tabs = page().getAllByRole("tab");
    for (const tab of tabs) {
      expect(classesOf(tab)).toEqual(
        expect.arrayContaining(["min-h-8", "rounded-ds-md!", "border"]),
      );
      expect(tab.className).not.toContain("border-l-2");
    }
    const current = page().getByRole("tab", { name: "Sources" });
    expect(classesOf(current)).toContain("bg-surface-selected");
    expect(tabs.filter((tab) => classesOf(tab).includes("bg-surface-selected"))).toEqual([current]);
  });

  it("draws a settings section as one tile under an h2 in the h3 size", () => {
    show("/signal/main/settings/topics");
    const heading = page().getByRole("heading", { level: 2, name: "Topics" });
    expect(classesOf(heading)).toEqual(expect.arrayContaining(["font-display", "text-h3"]));
    expect(classesOf(heading.closest("section"))).toEqual(
      expect.arrayContaining([
        "rounded-ds-lg",
        "border",
        "border-border-subtle",
        "bg-surface-card",
        "p-5",
        "sm:p-6",
      ]),
    );
  });

  it("draws the sources table as the tile, at the section's full width", () => {
    show("/signal/main/settings/sources");
    const heading = page().getByRole("heading", { level: 2, name: "Sources" });
    expect(heading.closest("section")?.className).toBe("min-w-0");
    const table = page().getByRole("region", { name: "Sources table" });
    expect(classesOf(table)).toEqual(
      expect.arrayContaining(["rounded-ds-lg", "bg-surface-card", "ring-1", "ring-border-subtle"]),
    );
  });

  it("makes a story's issuer links and a market series' name targets, with the focus ring", () => {
    show("/signal/issuers/feed/latest");
    const link = page().getAllByRole("link", { name: "Tessaly Telecom" })[0];
    const series = page().getByRole("button", { name: /^Sample HY: / });
    for (const control of [link, series]) {
      expect(classesOf(control)).toEqual(
        expect.arrayContaining([
          "inline-flex",
          "min-h-8",
          "max-[480px]:min-h-11",
          "focus-visible:outline-2",
          "focus-visible:outline-offset-2",
        ]),
      );
    }
  });

  it("draws the market table in a well: 8px radius, a hairline edge, no shadow, the caption size for its heads", () => {
    show("/signal/issuers/feed/latest");
    const region = page().getByRole("region", { name: /^Table: Market backdrop/ });
    expect(classesOf(region)).toEqual(
      expect.arrayContaining(["rounded-ds-sm", "border", "border-border-hairline"]),
    );
    expect(region.className).not.toContain("shadow");
    for (const head of within(region).getAllByRole("columnheader")) {
      expect(classesOf(head)).toEqual(
        expect.arrayContaining(["text-caption", "font-medium", "text-text-tertiary"]),
      );
    }
  });

  it("makes a switch a 32px target, 44px on a phone, by its label's padding", () => {
    show("/signal/main/settings/notifications");
    const label = page().getAllByRole("switch")[0]?.closest("label");
    expect(classesOf(label)).toEqual(expect.arrayContaining(["py-1", "max-[480px]:py-2.5"]));
  });

  it("makes every control in a dialog a 44px target on a phone", () => {
    show("/signal/main/feed/latest");
    fireEvent.click(page().getAllByRole("button", { name: /^Share to group: / })[0] as HTMLElement);
    const form = screen.getByRole("dialog").querySelector("form");
    expect(classesOf(form)).toEqual(
      expect.arrayContaining([
        "max-[480px]:[&_button]:min-h-11",
        "max-[480px]:[&_input:not([type=checkbox])]:min-h-11",
      ]),
    );
  });
});
