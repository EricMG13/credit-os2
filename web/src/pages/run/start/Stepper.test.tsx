import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Stepper, STEPS } from "./Stepper";

const FOUR = STEPS.filter((s) => s.key !== "context");

afterEach(cleanup);

describe("Stepper", () => {
  it("marks the current step with aria-current and an accent underline", () => {
    render(<Stepper step="purpose" steps={FOUR} />);
    const items = within(screen.getByRole("list", { name: "Steps in this run" })).getAllByRole(
      "listitem",
    );
    expect(items).toHaveLength(4);
    const current = items.filter((li) => li.getAttribute("aria-current") === "step");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Purpose");
    expect(current[0]).toHaveTextContent("Current step");
    expect(
      current[0]?.querySelector('[class*="border-b-2"][class*="border-action"]'),
    ).not.toBeNull();
    expect(items[0]).toHaveTextContent("Complete");
    expect(items[3]).toHaveTextContent("Not started");
    expect(items[3]?.querySelector('[class*="border-b-2"]')).toBeNull();
  });

  it("makes only completed steps buttons, and only with onSelect", () => {
    const onSelect = vi.fn();
    const { rerender } = render(<Stepper step="confirm" steps={FOUR} onSelect={onSelect} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Go back to Documents",
      "Go back to Purpose",
    ]);
    fireEvent.click(buttons[1] as HTMLElement);
    expect(onSelect).toHaveBeenCalledWith("purpose");
    rerender(<Stepper step="confirm" steps={FOUR} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("renders five steps with notes", () => {
    render(<Stepper step="documents" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("Paid step")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
