import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ChipGroup, RemovableChip } from "./Chip";

afterEach(cleanup);

it("draws All and each choice as pressed-state buttons in one labelled group", () => {
  const onChange = vi.fn();
  render(
    <ChipGroup label="Sector" choices={["Food", "Mining"]} value="Food" onChange={onChange} />,
  );
  const group = screen.getByRole("group", { name: "Sector" });
  expect(within(group).getByRole("button", { name: "Food" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(within(group).getByRole("button", { name: "All" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  fireEvent.click(within(group).getByRole("button", { name: "Mining" }));
  expect(onChange).toHaveBeenCalledWith("Mining");
  fireEvent.click(within(group).getByRole("button", { name: "All" }));
  expect(onChange).toHaveBeenLastCalledWith("all");
});

it("keeps a chosen value that no longer exists, marked unavailable and pressed", () => {
  render(<ChipGroup label="Sector" choices={["Food"]} value="Mining" onChange={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Mining (unavailable)" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

it("pressing the chosen chip again returns to All", () => {
  const onChange = vi.fn();
  render(<ChipGroup label="Sector" choices={["Food"]} value="Food" onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Food" }));
  expect(onChange).toHaveBeenCalledWith("all");
});

it("draws a removable chip named for the filter it removes", () => {
  const onRemove = vi.fn();
  render(<RemovableChip onRemove={onRemove}>Module: Legal</RemovableChip>);
  fireEvent.click(screen.getByRole("button", { name: "Remove filter Module: Legal" }));
  expect(onRemove).toHaveBeenCalledTimes(1);
});

it("wraps a long filter chip inside its column and keeps the remove mark in view", () => {
  const long = "Module: Business & governance, No output; run plan not recorded";
  render(<RemovableChip onRemove={vi.fn()}>{long}</RemovableChip>);
  const chip = screen.getByRole("button", { name: `Remove filter ${long}` });
  expect(chip).not.toHaveClass("whitespace-nowrap");
  expect(chip).toHaveClass("max-w-full", "break-words");
  expect(chip).toHaveAttribute("title", long);
  expect(chip.querySelector("svg")).toHaveClass("flex-none");
});
