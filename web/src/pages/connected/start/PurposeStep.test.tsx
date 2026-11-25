import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PurposeCards } from "../../run/start/Purpose";
import { PATHWAY_QUESTIONS } from "./pathways";

describe("Purpose cards", () => {
  it("states the question, modules and cap, and every question is a question", () => {
    for (const text of Object.values(PATHWAY_QUESTIONS)) expect(text.endsWith("?")).toBe(true);
    render(
      <PurposeCards
        label="Pathway"
        value="a"
        onChange={() => undefined}
        purposes={[
          {
            id: "a",
            title: "Alpha",
            description: "Q?",
            modules: "3 base modules",
            cap: "Cap USD 30.00",
          },
          { id: "b", title: "Beta", description: "R?", modules: "4 base modules" },
        ]}
      />,
    );
    const group = screen.getByRole("radiogroup", { name: "Pathway" });
    expect(within(group).getByRole("radio", { name: "Alpha" })).toBeChecked();
    expect(within(group).getByRole("radio", { name: "Beta" })).not.toBeChecked();
    expect(screen.getByText("Cap USD 30.00")).toBeInTheDocument();
    expect(screen.getByText("4 base modules")).toBeInTheDocument();
  });
});
