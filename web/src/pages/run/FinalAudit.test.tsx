import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { show, showFixture } from "./test-helpers";

afterEach(cleanup);

it("S6-024 shows purpose choices without repeating a decorative featured icon", () => {
  showFixture("/run/start/purpose");
  const choices = screen.getByRole("radiogroup", { name: "Purpose" });
  expect(choices.querySelectorAll("[data-featured-icon]")).toHaveLength(0);
  expect(within(choices).getAllByRole("radio")).toHaveLength(4);
});

it.each(["running", "queued"])("S6-033 draws no unsupported Stop control on %s", (id) => {
  showFixture(`/run/activity/${id}`);
  expect(screen.queryByRole("button", { name: "Stop run" })).toBeNull();
});

it("S6-031 does not describe a future Submit step after Run started", () => {
  showFixture("/run/start/started");
  expect(screen.queryByText(/Nothing is spent before the last step/)).toBeNull();
  expect(screen.getByText("Run started")).toBeVisible();
});

it.each(["/run/start/purpose", "/run/activity/running"])(
  "S6-026 explains absent run data at %s and links back",
  (route) => {
    show(route, undefined);
    expect(screen.getByText("This library holds no run records.")).toBeVisible();
    expect(
      within(screen.getByRole("main")).getByRole("link", { name: "Back to the library" }),
    ).toHaveAttribute("href", "#/");
  },
);

it("S6-022 uses the spacing ladder for the document pictogram and context field", () => {
  const { container, unmount } = showFixture("/run/start/documents");
  expect(container.innerHTML).not.toMatch(
    /left-\[7px\]|h-\[38px\]|w-\[27px\]|top-\[18px\]|rounded-\[2px\]|text-\[9px\]/,
  );
  unmount();
  showFixture("/run/start/context");
  expect(screen.getByRole("textbox").parentElement).toHaveClass("gap-2");
});

it("S6-022 uses a full spacing step between the Submit dialog's heading and text", () => {
  showFixture("/run/start/start");
  fireEvent.click(screen.getByRole("button", { name: "Submit, spend up to USD 25.00" }));
  expect(screen.getByRole("heading", { name: "Start a paid run?" }).parentElement).toHaveClass(
    "gap-1",
  );
});
