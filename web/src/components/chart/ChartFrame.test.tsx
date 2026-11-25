import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartFrame } from "./ChartFrame";

const body = () => <p>body</p>;

describe("ChartFrame", () => {
  it("without subtitle and actions the header holds only the title and the toggle", () => {
    render(<ChartFrame title="Net debt path">{body}</ChartFrame>);
    expect(screen.getByRole("figure")).toHaveClass("group/trace");
    const toggle = screen.getByRole("group", { name: "Net debt path: figure or table" });
    expect(
      within(toggle)
        .getAllByRole("button")
        .map((button) => [button.textContent, button.getAttribute("aria-pressed")]),
    ).toEqual([
      ["Figure", "true"],
      ["Table", "false"],
    ]);
    const header = toggle.parentElement?.parentElement;
    expect(header?.children).toHaveLength(2);
    expect(header?.firstElementChild).toBe(screen.getByRole("heading", { name: "Net debt path" }));
    expect(screen.getByRole("figure")).not.toHaveAttribute("aria-describedby");
  });

  it("draws the head in the order title, subtitle, switch, then the trace control last", () => {
    render(
      <ChartFrame
        title="Net debt path"
        subtitle="Base case, per share"
        actions={<button type="button">Trace</button>}
      >
        {body}
      </ChartFrame>,
    );
    const title = screen.getByRole("heading", { name: "Net debt path" });
    const subtitle = screen.getByText("Base case, per share");
    const action = screen.getByRole("button", { name: "Trace" });
    const toggle = screen.getByRole("group", { name: "Net debt path: figure or table" });
    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(title, subtitle)).toBe(true);
    expect(follows(subtitle, toggle)).toBe(true);
    expect(follows(toggle, action)).toBe(true);
  });

  it("puts actions and the toggle in one right-hand group when there is no subtitle", () => {
    render(
      <ChartFrame title="Net debt path" actions={<button type="button">Trace</button>}>
        {body}
      </ChartFrame>,
    );
    const action = screen.getByRole("button", { name: "Trace" });
    const toggle = screen.getByRole("group", { name: "Net debt path: figure or table" });
    expect(action.parentElement).toBe(toggle.parentElement);
    expect(toggle.nextElementSibling).toBe(action);
    const header = toggle.parentElement?.parentElement;
    expect(header?.children).toHaveLength(2);
    expect(header?.firstElementChild).toBe(screen.getByRole("heading", { name: "Net debt path" }));
  });

  it("puts actions and the toggle in one right-hand group when there is a subtitle", () => {
    render(
      <ChartFrame
        title="Net debt path"
        subtitle="Base case"
        actions={<button type="button">Trace</button>}
      >
        {body}
      </ChartFrame>,
    );
    const action = screen.getByRole("button", { name: "Trace" });
    const toggle = screen.getByRole("group", { name: "Net debt path: figure or table" });
    expect(action.parentElement).toBe(toggle.parentElement);
    expect(toggle.nextElementSibling).toBe(action);
  });

  it("treats an empty subtitle as none: no element and no description", () => {
    render(
      <ChartFrame title="Net debt path" subtitle="">
        {body}
      </ChartFrame>,
    );
    const figure = screen.getByRole("figure");
    expect(figure).not.toHaveAttribute("aria-describedby");
    const toggle = screen.getByRole("group", { name: "Net debt path: figure or table" });
    expect(toggle.parentElement?.parentElement?.querySelector("p")).toBeNull();
    expect(toggle.parentElement?.parentElement?.children).toHaveLength(2);
  });

  it("gives the title block a minimum width so it wraps to its own row before it collapses", () => {
    render(
      <ChartFrame title="Net debt path" subtitle="Base case">
        {body}
      </ChartFrame>,
    );
    expect(screen.getByRole("heading", { name: "Net debt path" }).parentElement).toHaveClass(
      "min-w-48",
    );
  });

  it("describes the figure by the subtitle and names it by the title only", () => {
    render(
      <ChartFrame title="Net debt path" subtitle="Base case, per share">
        {body}
      </ChartFrame>,
    );
    const figure = screen.getByRole("figure", { name: "Net debt path" });
    expect(figure).toHaveAccessibleDescription("Base case, per share");
  });

  it("draws the subtitle in the tertiary text colour, as the mock does", () => {
    render(
      <ChartFrame title="Net debt path" subtitle="Base case, per share">
        {body}
      </ChartFrame>,
    );
    expect(screen.getByText("Base case, per share")).toHaveClass("text-text-tertiary");
  });

  it("keeps the heading level the caller passes", () => {
    render(
      <ChartFrame title="Net debt path" as="h3" subtitle="Base case">
        {body}
      </ChartFrame>,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Net debt path" })).toBeInTheDocument();
  });
});
