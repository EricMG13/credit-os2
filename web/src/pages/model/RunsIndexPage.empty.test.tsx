import { render, screen } from "@testing-library/react";
import { App } from "@/App";

it("S5-016 explains the empty Model index and offers the Library", () => {
  window.location.hash = "#/model/runs";
  const { container } = render(
    <App result={{ kind: "ok", data: { schema: "credit-os-data/1", issuers: [] } }} />,
  );
  expect(screen.getByText("No model has been delivered yet")).toBeVisible();
  expect(screen.getByText("This library holds no financial models to read.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Back to the Library" })).toHaveAttribute("href", "#/");
  expect(container.querySelector("main header svg")).toBeInTheDocument();
});
