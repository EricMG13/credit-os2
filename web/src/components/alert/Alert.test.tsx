import { render, screen } from "@testing-library/react";
import { Alert, Callout } from "./Alert";

// A block child (a paragraph, a list) is valid in an Alert or a Callout: its text sits in a div.
function blockChildren() {
  return (
    <>
      <p>First paragraph.</p>
      <ul>
        <li>One item</li>
      </ul>
    </>
  );
}

describe("Alert surface", () => {
  it("carries no shadow: only floating menus and tooltips are raised (DESIGN.md, Shape)", () => {
    render(<Alert tone="error" title="Run failed" />);
    expect(screen.getByRole("alert").className).not.toMatch(/\bshadow/);
  });
});

describe("Alert and Callout children", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("holds a block child in a div, so React reports no invalid nesting", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <Alert tone="info" title="Run started">
        {blockChildren()}
      </Alert>,
    );
    expect(errors).not.toHaveBeenCalled();
    expect(screen.getByText("First paragraph.").parentElement?.tagName).toBe("DIV");
    expect(screen.getByRole("listitem")).toHaveTextContent("One item");
  });

  it("keeps a string child in the small tone-coloured text", () => {
    render(
      <Alert tone="warning" title="Careful">
        The run is queued.
      </Alert>,
    );
    expect(screen.getByText("The run is queued.")).toHaveClass(
      "mt-0.5",
      "text-sm",
      "text-warning-text",
    );
  });

  it("draws no text block for an Alert with no child", () => {
    const { container } = render(<Alert tone="success" title="Done" />);
    expect(screen.getByRole("status")).toHaveTextContent("Success: Done");
    expect(container.querySelector(".mt-0\\.5")).toBeNull();
  });

  it("holds a block child of a Callout in a div too", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<Callout title="What would change the view">{blockChildren()}</Callout>);
    expect(errors).not.toHaveBeenCalled();
    expect(screen.getByText("First paragraph.").parentElement?.tagName).toBe("DIV");
  });
});
