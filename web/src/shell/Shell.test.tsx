import { fireEvent, render, screen, within } from "@testing-library/react";
import { PageHeader } from "./PageHeader";
import { Shell, type Area } from "./Shell";

// The four bar areas and their hashes; the kit is a page of the shell, not a bar item (Shell.kitRail.test.tsx).
const AREAS: [Area, string, string][] = [
  ["library", "Library", "#/"],
  ["model", "Model", "#/model"],
  ["run", "Run", "#/run"],
  ["signal", "Signal", "#/signal"],
];

describe("Shell", () => {
  it("offers a skip link before any other link, targeting the main region", () => {
    render(<Shell current="library">content</Shell>);
    const [first] = screen.getAllByRole("link");
    expect(first).toHaveAccessibleName("Skip to content");
    expect(first).toHaveAttribute("href", "#main");
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main");
    expect(main).toHaveAttribute("tabindex", "-1");
  });

  it("names every area in the bar, in order, each linking to its hash", () => {
    render(<Shell current="library">content</Shell>);
    const rail = screen.getByRole("navigation", { name: "Areas" });
    const links = within(rail).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual(AREAS.map(([, name]) => name));
    expect(links.map((a) => a.getAttribute("href"))).toEqual(AREAS.map(([, , href]) => href));
  });

  it("moves focus to main on activation and leaves the URL hash alone", () => {
    window.history.replaceState(null, "", "/#/library");
    render(<Shell current="library">content</Shell>);
    // jsdom does not navigate to a fragment, so a hash assertion cannot fail here; a cancelled
    // click is what keeps a browser from changing the hash.
    expect(fireEvent.click(screen.getByRole("link", { name: "Skip to content" }))).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole("main"));
    window.history.replaceState(null, "", "/");
  });

  it("keeps each bar link at least 44px tall on a phone", () => {
    render(<Shell current="library">content</Shell>);
    const rail = screen.getByRole("navigation", { name: "Areas" });
    for (const link of within(rail).getAllByRole("link"))
      expect(link).toHaveClass("max-[480px]:min-h-11");
  });

  it("draws the current item in the selected surface and no other item", () => {
    render(<Shell current="run">content</Shell>);
    const selected = screen
      .getAllByRole("link")
      .filter((a) => a.className.includes("bg-surface-selected"));
    expect(selected.map((a) => a.textContent)).toEqual(["Run"]);
  });

  it.each(AREAS)("marks only %s as the current page", (area, name) => {
    render(<Shell current={area}>content</Shell>);
    const marked = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("aria-current") === "page");
    expect(marked.map((a) => a.textContent)).toEqual([name]);
  });

  it("draws a decorative symbol with no text", () => {
    const { container } = render(<Shell current="library">content</Shell>);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("alt")).toBe("");
    expect(img?.getAttribute("src")).toBe("./symbol.svg");
  });

  it("carries one primary action at the end of the bar, outside the areas, only when given", () => {
    const first = render(<Shell current="library">content</Shell>);
    expect(screen.queryByRole("link", { name: "Start run" })).toBeNull();
    first.unmount();
    render(
      <Shell current="library" action={{ href: "/start", label: "Start run" }}>
        content
      </Shell>,
    );
    const action = screen.getByRole("link", { name: "Start run" });
    expect(action).toHaveAttribute("href", "/start");
    expect(screen.getByRole("banner")).toContainElement(action);
    expect(screen.getByRole("navigation", { name: "Areas" })).not.toContainElement(action);
    expect(action).not.toHaveAttribute("aria-current");
    // The current area keeps its own tint and underline; the action is never the current area.
    expect(document.querySelectorAll("[data-current-area]")).toHaveLength(1);
  });

  it("puts the page in one main region", () => {
    render(<Shell current="kit">page body</Shell>);
    expect(screen.getByRole("main")).toHaveTextContent("page body");
  });
});

describe("Shell bleed", () => {
  it("keeps one main region and drops its padding", () => {
    render(
      <Shell current="signal" bleed>
        edge to edge
      </Shell>,
    );
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveTextContent("edge to edge");
    expect(screen.getByRole("main").className).not.toMatch(/(^|\s)p-\d/);
  });

  it("pads main by default", () => {
    render(<Shell current="signal">x</Shell>);
    expect(screen.getByRole("main").className).toContain("p-4");
    expect(screen.getByRole("main").className).toContain("sm:p-8");
  });

  it("stacks one top bar over the page and names the product beside the symbol", () => {
    const { container } = render(<Shell current="library">x</Shell>);
    expect(container.firstElementChild?.className).toContain("flex-col");
    const bar = screen.getByRole("banner");
    expect(within(bar).getByRole("navigation", { name: "Areas" })).toBeInTheDocument();
    expect(within(bar).getByText("Credit OS")).toBeInTheDocument();
  });
});

describe("PageHeader", () => {
  it("renders one h1 with the title, the badges and the actions", () => {
    render(
      <PageHeader title="Library" badges={<span>A badge</span>} actions={<button>Act</button>} />,
    );
    expect(screen.getAllByRole("heading")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Library" })).toBeInTheDocument();
    expect(screen.getByText("A badge")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Act" })).toBeInTheDocument();
  });
});

describe("Shell scroll container", () => {
  it("makes the scrolling main a positioning context", () => {
    render(<Shell current="library">content</Shell>);
    expect(screen.getByRole("main")).toHaveClass("relative");
  });

  it("lets the area list shrink and wrap inside the bar instead of scrolling or widening the page", () => {
    render(<Shell current="library">content</Shell>);
    const rail = screen.getByRole("navigation", { name: "Areas" });
    const list = within(rail).getByRole("list");
    expect(rail).toHaveClass("flex", "min-w-0");
    expect(list).toHaveClass("flex-1", "min-w-0", "flex-wrap");
    expect(list).not.toHaveClass("overflow-x-auto");
  });
});
