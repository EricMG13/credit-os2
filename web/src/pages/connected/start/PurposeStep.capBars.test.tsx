import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { PurposeFields } from "./PurposeStep";
import type { IntakeView } from "./intake";

afterEach(cleanup);

it("draws a cap bar on the Custom card and none on a pathway with no cap", () => {
  const view = {
    caps: { lite_credit_assessment: "20", credit_snapshot: "30", custom: "50" },
    run: { pathway: "custom", run_type: "research", case_kind: "public" },
    synthetic: false,
    earnings: false,
    level: "advanced",
    busy: undefined,
    changePathway: () => undefined,
    changePurpose: () => undefined,
    changeRun: () => undefined,
    changeLevel: () => undefined,
  } as unknown as IntakeView;
  render(<PurposeFields view={view} />);
  const card = (name: string) => screen.getByRole("radio", { name }).closest("label");
  const fill = (name: string) => card(name)?.querySelector<HTMLElement>("[data-part=cap-fill]");
  expect(fill("Custom selection")?.style.width).toBe("100%");
  expect(fill("Full credit assessment")?.style.width).toBe("60%");
  expect(fill("Lite credit assessment")?.style.width).toBe("40%");
  expect(card("Credit screening")).toHaveTextContent("Cap unavailable");
  expect(fill("Credit screening")).toBeNull();
});
