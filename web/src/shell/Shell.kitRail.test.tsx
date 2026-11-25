import { render, screen, within } from "@testing-library/react";
import { Shell } from "./Shell";

// OQ-05 (README R10): the component kit is a design page, not a reader's page. It stays reachable
// by its address (#/kit) and leaves the rail.
describe("Shell rail without the kit", () => {
  it("names Library, Model, Run and Signal, in that order, and no Kit", () => {
    render(<Shell current="library">content</Shell>);
    const rail = screen.getByRole("navigation", { name: "Areas" });
    const links = within(rail).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual(["Library", "Model", "Run", "Signal"]);
    expect(links.map((a) => a.getAttribute("href"))).not.toContain("#/kit");
  });

  it("still draws a page given the kit area, with no rail item marked current", () => {
    render(<Shell current="kit">kit page</Shell>);
    expect(screen.getByRole("main")).toHaveTextContent("kit page");
    expect(screen.queryByRole("link", { name: "Kit" })).toBeNull();
    expect(screen.queryAllByRole("link", { current: "page" })).toHaveLength(0);
  });
});
