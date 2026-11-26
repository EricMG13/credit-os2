import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { PurposeFields } from "./PurposeStep";
import type { IntakeView } from "./intake";

afterEach(cleanup);

it("offers the credit screening card with its question, a USD 10 cap and no module code", () => {
  const view = {
    caps: { credit_screening: "10" },
    run: { pathway: "credit_screening", run_type: "research", case_kind: "public" },
    synthetic: false,
    earnings: false,
    level: "basic",
    busy: undefined,
    changePathway: () => undefined,
    changePurpose: () => undefined,
    changeRun: () => undefined,
    changeLevel: () => undefined,
  } as unknown as IntakeView;
  render(<PurposeFields view={view} />);
  const card = screen
    .getByRole("radio", { name: "Credit screening" })
    .closest("label") as HTMLElement;
  expect(within(card).getByRole("radio")).toBeChecked();
  expect(card).toHaveTextContent(
    "Which financial, credit, liquidity, market and legal points matter most, and where is a full assessment needed?",
  );
  expect(within(card).getByText("Cap USD 10.00")).toBeInTheDocument();
  expect(within(card).getByText("4 base modules")).toBeInTheDocument();
  expect(card.textContent).not.toMatch(/CP-/);
});
