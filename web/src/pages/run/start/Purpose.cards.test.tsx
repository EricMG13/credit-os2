import { cleanup, render, screen, within } from "@testing-library/react";
import { PATHWAYS } from "../../connected/api";
import { PATHWAY_QUESTIONS } from "../../connected/start/pathways";
import { PurposeCards } from "./Purpose";

afterEach(() => {
  cleanup();
});

const cards = (cap: (id: string) => string | undefined) =>
  Object.entries(PATHWAYS).map(([id, p]) => ({
    id,
    title: p.label,
    description: PATHWAY_QUESTIONS[id] ?? "",
    modules: "3 base modules",
    cap: cap(id),
  }));

function draw(items: ReturnType<typeof cards>, value: string | null = null) {
  render(
    <PurposeCards label="Pathway" value={value} onChange={() => undefined} purposes={items} />,
  );
}

describe("pathway cards", () => {
  it("asks the pathway's question on every card, in the PATHWAYS order", () => {
    draw(cards(() => "Cap USD 25.00"));
    const radios = within(screen.getByRole("radiogroup", { name: "Pathway" })).getAllByRole(
      "radio",
    );
    expect(radios.map((r) => r.getAttribute("value"))).toEqual(Object.keys(PATHWAYS));
    expect(Object.keys(PATHWAY_QUESTIONS)).toEqual(Object.keys(PATHWAYS));
    for (const [id, p] of Object.entries(PATHWAYS)) {
      const radio = screen.getByRole("radio", { name: p.label });
      expect(radio.closest("label")).toHaveTextContent(PATHWAY_QUESTIONS[id] ?? "?");
    }
    expect(PATHWAY_QUESTIONS.lite_credit_assessment).toBe(
      "Is the credit sound, and how far is its first break?",
    );
  });

  it("shows the module count chip and the cap in mono, or Cap unavailable", () => {
    draw(cards((id) => (id === "credit_snapshot" ? "Cap unavailable" : "Cap USD 25.00")));
    const full = screen.getByRole("radio", { name: "Full credit assessment" }).closest("label");
    expect(within(full as HTMLElement).getByText("Cap unavailable")).toHaveClass(
      "font-mono",
      "tabular-nums",
    );
    const lite = screen.getByRole("radio", { name: "Lite credit assessment" }).closest("label");
    expect(within(lite as HTMLElement).getByText("3 base modules")).toBeVisible();
    expect(within(lite as HTMLElement).getByText("Cap USD 25.00")).toHaveClass("font-mono");
  });

  it("marks the selected card with the filled mark as well as colour", () => {
    draw(
      cards(() => "Cap USD 25.00"),
      "relative_value",
    );
    const mark = (name: string) =>
      screen.getByRole("radio", { name }).closest("label")?.querySelectorAll("svg").length;
    const selected = screen.getByRole("radio", { name: PATHWAYS.relative_value?.label });
    expect(selected).toBeChecked();
    expect(mark(PATHWAYS.relative_value?.label ?? "")).toBe(1);
    expect(mark(PATHWAYS.earnings_update?.label ?? "")).toBe(0);
    expect(selected.closest("label")).toHaveClass("border-action", "bg-surface-selected");
  });

  it("draws no cap when none is passed", () => {
    draw(cards(() => undefined));
    expect(screen.queryByText(/^Cap /)).toBeNull();
  });
});
