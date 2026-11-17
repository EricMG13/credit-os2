import { fireEvent, render, screen } from "@testing-library/react";
import { ModuleNav } from "./ModuleNav";

const sections = [
  { key: "bottom-line", label: "Bottom line", icon: "bottom-line" },
  { key: "limitations", label: "Limitations", icon: "limitations" },
] as const;
const modules = [
  { id: "business", name: "Business profile", state: "Delivered" },
  { id: "capital", name: "Capital structure", state: "Delivered with gaps" },
] as const;

it("offers compact module and section pickers for desktop windows below 1001px", () => {
  const onSection = vi.fn();
  render(
    <ModuleNav
      issuer="issuer"
      run="run"
      sections={sections}
      active="bottom-line"
      onSection={onSection}
      modules={modules}
      current="business"
    />,
  );
  const modulePicker = screen.getByRole("button", { name: /Module/ });
  expect(modulePicker.closest("[data-compact-navigation]")).toHaveClass(
    "min-[481px]:flex",
    "min-[1001px]:hidden",
  );
  fireEvent.click(modulePicker);
  fireEvent.click(screen.getByRole("option", { name: /Capital structure/ }));
  expect(window.location.hash).toBe("#/library/issuer/run/modules/capital");
  fireEvent.click(screen.getByRole("button", { name: /Page section/ }));
  fireEvent.click(screen.getByRole("option", { name: "Limitations" }));
  expect(onSection).toHaveBeenCalledWith("limitations");
});

it("S3-037 shows the state word beside a module that is not Delivered", () => {
  render(
    <ModuleNav
      issuer="issuer"
      run="run"
      sections={sections}
      active="bottom-line"
      onSection={() => undefined}
      modules={modules}
      current="business"
    />,
  );
  const link = screen.getByRole("link", { name: "Capital structure, Delivered with gaps" });
  expect(link).toHaveTextContent("Delivered with gaps");
});

it("S3-028 scrolls the current mouse-selected module into its own navigator", () => {
  const bounds = vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: HTMLElement) {
      return {
        top: this.tagName === "NAV" ? 0 : 710,
        bottom: this.tagName === "NAV" ? 700 : 750,
        left: 0,
        right: 200,
        width: 200,
        height: this.tagName === "NAV" ? 700 : 40,
        x: 0,
        y: 0,
        toJSON() {},
      };
    });
  try {
    render(
      <ModuleNav
        issuer="issuer"
        run="run"
        sections={sections}
        active="bottom-line"
        onSection={() => undefined}
        modules={modules}
        current="capital"
      />,
    );
    expect(screen.getByRole("navigation", { name: "Modules and sections" }).scrollTop).toBe(50);
  } finally {
    bounds.mockRestore();
  }
});

it("S3-028 keeps the current entry inside the visible window when the reader header precedes the navigator", () => {
  const height = Object.getOwnPropertyDescriptor(window, "innerHeight");
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
  const bounds = vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: HTMLElement) {
      return {
        top: this.tagName === "NAV" ? 364 : 1112,
        bottom: this.tagName === "NAV" ? 1216 : 1170,
        left: 0,
        right: 200,
        width: 200,
        height: this.tagName === "NAV" ? 852 : 58,
        x: 0,
        y: 0,
        toJSON() {},
      };
    });
  try {
    render(
      <ModuleNav
        issuer="issuer"
        run="run"
        sections={sections}
        active="bottom-line"
        onSection={() => undefined}
        modules={modules}
        current="capital"
      />,
    );
    expect(screen.getByRole("navigation", { name: "Modules and sections" }).scrollTop).toBe(270);
    screen.getByRole("navigation", { name: "Modules and sections" }).scrollTop = 0;
    fireEvent(window, new Event("resize"));
    expect(screen.getByRole("navigation", { name: "Modules and sections" }).scrollTop).toBe(270);
  } finally {
    bounds.mockRestore();
    if (height !== undefined) Object.defineProperty(window, "innerHeight", height);
  }
});
