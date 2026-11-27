import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { CaseFigure } from "./ForecastHeader";

const option = (extra: Record<string, unknown>) => ({
  name: "Downside",
  rawGroup: "Downside shock",
  period: "FY2027E",
  value: 1,
  units: "USD millions",
  description: undefined,
  ...extra,
});

function draw(extra: Record<string, unknown>, shown: string[] = []) {
  const { container } = render(
    <CaseFigure
      option={option(extra)}
      display="8,630.8"
      notice={undefined}
      shownQualifications={shown}
    />,
  );
  return container.querySelector("#forecast-cases")?.textContent ?? "";
}

it("C1b-R2 does not draw a case description that cites a marker or note", () => {
  const drawn = draw({
    description: "Downside case is a shock on base drivers [E3], see TL3.2.",
  });
  expect(drawn).not.toContain("[E3]");
  expect(drawn).not.toContain("TL3.2");
  expect(drawn).toContain("The model's note on this case is in Evidence.");
});

it("C1b-R2 draws a case description that cites nothing as written", () => {
  const text = "Downside case is a shock on base drivers.";
  expect(draw({ description: text })).toContain(text);
});

it("C1b-R2 still dedupes a description another qualification already shows", () => {
  const text = "Downside case is a shock on base drivers.";
  expect(draw({ description: text }, [text])).not.toContain(text);
});

it("C1b-R2 does not draw a reason that cites a marker or note", () => {
  const drawn = draw({ reason: "Not modelled; see Note 4 [E3]" });
  expect(drawn).not.toContain("Note 4");
  expect(drawn).not.toContain("[E3]");
});

it("C1b-S1 dedupes a citing description that a shown qualification already carries", () => {
  const text = "Base case is the central case [E3].";
  const drawn = draw({ name: "Base", rawGroup: "Base", description: text }, [text]);
  expect(drawn).not.toContain("The model's note on this case is in Evidence.");
  expect(drawn).not.toContain("[E3]");
});
