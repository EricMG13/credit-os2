import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { NextModule } from "./ModuleFrame";

afterEach(cleanup);

it("draws no next-module link after the last module", () => {
  const { container } = render(
    <NextModule next={undefined} href={(id) => `#modules/${id}`} wide={false} />,
  );
  expect(container).toBeEmptyDOMElement();
});

it("states the next module's stage, place and state", () => {
  render(
    <NextModule
      next={{ id: "CP-4", name: "Legal & covenants", state: "Not assessable" }}
      href={(id) => `#modules/${id}`}
      wide={false}
    />,
  );
  const link = screen.getByRole("link", { name: "Next module: Legal & covenants" });
  expect(link).toHaveAttribute("href", "#modules/CP-4");
  expect(link).toHaveTextContent("Structure and market · stage 4 of 5 · Not assessable");
});
