import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { StageNav, type NavModule } from "./ModuleNav";

const modules: NavModule[] = [
  { id: "CP-0", name: "Sources", state: "Delivered" },
  { id: "CP-1", name: "Financial statements", state: "Delivered" },
  { id: "CP-2", name: "Credit profile", state: "Delivered with gaps" },
  { id: "CP-4", name: "Market view", state: "Not assessable" },
  { id: "CP-6", name: "Decision", state: "Delivered" },
  { id: "X-9", name: "Odd module", state: "Not run" },
];
const hrefFor = (id: string) => `#/run/modules/${id}`;

afterEach(cleanup);

function renderNav(list: readonly NavModule[] = modules) {
  return render(<StageNav modules={list} current="CP-1" hrefFor={hrefFor} />);
}

it("groups modules under their stage headings in stage order", () => {
  renderNav();
  const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
  expect(headings).toEqual([
    "Sources",
    "Financials",
    "Credit",
    "Structure and market",
    "Validation and decision",
    "Other",
  ]);
  const financials = screen.getByRole("heading", { level: 3, name: "Financials" });
  const group = financials.parentElement?.parentElement as HTMLElement;
  expect(within(group).getByRole("link", { name: /Financial statements/ })).toBeVisible();
  expect(within(group).getAllByRole("link")).toHaveLength(1);
  const other = screen.getByRole("heading", { level: 3, name: "Other" }).parentElement
    ?.parentElement as HTMLElement;
  expect(within(other).getByRole("link", { name: "Odd module, Not run" })).toBeVisible();
});

it("numbers each stage by its fixed place and leaves Other unnumbered", () => {
  render(
    <StageNav
      modules={[
        { id: "CP-1", name: "Financial statements", state: "Delivered" },
        { id: "CP-4", name: "Legal", state: "Not assessable" },
        { id: "CP-ZZ", name: "Odd module", state: "Not run" },
      ]}
      current="CP-1"
      hrefFor={(id) => `#modules/${id}`}
    />,
  );
  const label = (name: string) =>
    screen.getByRole("heading", { level: 3, name }).previousElementSibling?.textContent;
  expect(label("Financials")).toBe("02");
  expect(label("Structure and market")).toBe("04");
  expect(label("Other")).toBe("");
});

it("stays open on a wide screen and closed by default on a narrow one", () => {
  const listeners: (() => void)[] = [];
  let wide = false;
  window.matchMedia = ((query: string) => ({
    get matches() {
      return wide;
    },
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  try {
    const { container } = renderNav();
    const details = container.querySelector("details");
    expect(details).not.toHaveAttribute("open");
    wide = true;
    act(() => {
      for (const fn of listeners) fn();
    });
    expect(details).toHaveAttribute("open");
  } finally {
    // @ts-expect-error jsdom has no matchMedia; remove the stub
    delete window.matchMedia;
  }
});

it("marks only the current link and names each link by name and state", () => {
  renderNav();
  const current = screen.getByRole("link", { name: "Financial statements, Delivered" });
  expect(current).toHaveAttribute("aria-current", "page");
  for (const link of screen.getAllByRole("link")) {
    if (link !== current) expect(link).not.toHaveAttribute("aria-current");
  }
  expect(screen.getByRole("link", { name: "Credit profile, Delivered with gaps" })).toBeVisible();
});

it("takes each address from hrefFor and shows the module name, never its code", () => {
  renderNav();
  const link = screen.getByRole("link", { name: "Decision, Delivered" });
  expect(link).toHaveAttribute("href", "#/run/modules/CP-6");
  expect(link).toHaveTextContent("Decision");
  expect(link.textContent).not.toMatch(/CP-/);
});

it("draws the state word for a module that is not Delivered", () => {
  renderNav();
  expect(screen.getByRole("link", { name: "Market view, Not assessable" })).toHaveTextContent(
    "Not assessable",
  );
  expect(screen.getByRole("link", { name: "Sources, Delivered" })).not.toHaveTextContent(
    "Delivered",
  );
});

it("counts delivered and not assessable modules", () => {
  renderNav();
  expect(screen.getByRole("heading", { level: 2, name: "Modules" })).toBeVisible();
  expect(screen.getByText("4 of 6 delivered")).toBeVisible();
  expect(screen.getByText("1 not assessable")).toBeVisible();
});

it("omits the not-assessable count when there is none", () => {
  renderNav(modules.filter((m) => m.state !== "Not assessable"));
  expect(screen.queryByText(/not assessable$/)).toBeNull();
});

it("draws nothing for an empty list", () => {
  const { container } = renderNav([]);
  expect(container).toBeEmptyDOMElement();
});

const sections = [
  { id: "sec-a", label: "Bottom line" },
  { id: "sec-b", label: "Limitations" },
];

function renderWithSections() {
  return render(
    <>
      <StageNav modules={modules} current="CP-1" hrefFor={hrefFor} sections={sections} />
      <div id="sec-a" tabIndex={-1} />
      <div id="sec-b" tabIndex={-1} />
    </>,
  );
}

it("draws a legend of the states present, each with the mark the links carry", () => {
  renderNav();
  const legend = screen.getByRole("list", { name: "Legend" });
  expect(
    within(legend)
      .getAllByRole("listitem")
      .map((li) => li.textContent),
  ).toEqual(["Delivered", "Delivered with gaps", "Not assessable", "Not run"]);
});

it("draws the not-assessable count as a warning chip", () => {
  renderNav();
  const chip = screen.getByText("1 not assessable");
  expect(chip.className).toContain("bg-warning-fill");
  expect(chip.className).toContain("text-warning-text");
});

it("lists the page sections only under the current module", () => {
  renderWithSections();
  const list = screen.getByRole("list", { name: "On this page" });
  const item = list.closest("li") as HTMLElement;
  expect(within(item).getByRole("link", { name: /Financial statements/ })).toBeVisible();
  expect(
    within(list)
      .getAllByRole("button")
      .map((b) => b.textContent),
  ).toEqual(["Bottom line", "Limitations"]);
  expect(screen.getAllByRole("list", { name: "On this page" })).toHaveLength(1);
});

it("draws no section list when sections is empty or absent", () => {
  const { unmount } = render(
    <StageNav modules={modules} current="CP-1" hrefFor={hrefFor} sections={[]} />,
  );
  expect(screen.queryByRole("list", { name: "On this page" })).toBeNull();
  unmount();
  renderNav();
  expect(screen.queryByRole("list", { name: "On this page" })).toBeNull();
});

it("focuses and scrolls to a section and marks it as the current location", () => {
  const scroll = vi.fn();
  Element.prototype.scrollIntoView = scroll;
  try {
    renderWithSections();
    const button = screen.getByRole("button", { name: "Limitations" });
    fireEvent.click(button);
    const target = document.getElementById("sec-b");
    expect(document.activeElement).toBe(target);
    expect(scroll).toHaveBeenCalledWith({ block: "start" });
    expect(scroll.mock.contexts[0]).toBe(target);
    expect(button).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("button", { name: "Bottom line" })).not.toHaveAttribute("aria-current");
    fireEvent.click(screen.getByRole("button", { name: "Bottom line" }));
    expect(button).not.toHaveAttribute("aria-current");
  } finally {
    // @ts-expect-error remove the stub
    delete Element.prototype.scrollIntoView;
  }
});

it("closes the disclosure when a section is pressed on a narrow screen", () => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  try {
    const { container } = renderWithSections();
    const details = container.querySelector("details") as HTMLDetailsElement;
    act(() => {
      details.open = true;
      details.dispatchEvent(new Event("toggle"));
    });
    expect(details).toHaveAttribute("open");
    fireEvent.click(screen.getByRole("button", { name: "Bottom line", hidden: true }));
    expect(details).not.toHaveAttribute("open");
  } finally {
    // @ts-expect-error jsdom has no matchMedia; remove the stub
    delete window.matchMedia;
  }
});

it("marks the current link with the accent edge and keeps it out of the legend", () => {
  renderNav();
  expect(within(screen.getByRole("list", { name: "Legend" })).queryByText("This page")).toBeNull();
  expect(screen.getByRole("link", { name: /Financial statements/ })).toHaveClass(
    "border-action",
    "bg-surface-selected",
  );
});

it("hides the panel's repeated title and count below lg but keeps one Modules heading", () => {
  renderNav();
  const headings = screen.getAllByRole("heading", { level: 2, name: "Modules" });
  expect(headings).toHaveLength(1);
  expect(headings[0]).toHaveClass("max-lg:hidden");
  expect(screen.getByText("4 of 6 delivered", { selector: "p" })).toHaveClass("max-lg:hidden");
});

it("keeps the not-assessable chip visible below lg", () => {
  renderNav();
  const chip = screen.getByText("1 not assessable");
  expect(chip.closest("header")).not.toHaveClass("max-lg:hidden");
  expect(chip.closest("p")).not.toHaveClass("max-lg:hidden");
});

it("uses ramp type sizes, not arbitrary ones, in stage links and sections", () => {
  render(
    <StageNav
      modules={modules}
      current="CP-1"
      hrefFor={hrefFor}
      sections={[{ id: "s1", label: "Overview" }]}
    />,
  );
  const link = screen.getByRole("link", { name: /Financial statements/ });
  expect(link.className).not.toMatch(/text-\[/);
  expect(link).toHaveClass("text-caption");
  expect(screen.getByRole("button", { name: "Overview" })).toHaveClass("text-caption");
});
