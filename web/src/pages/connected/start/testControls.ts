/**
 * Test helpers for the Purpose step's three choices, by their label and stored key, so a test
 * says what it chooses, not how the control is drawn (a select, or a segmented group of buttons).
 */
import { fireEvent, screen, within } from "@testing-library/react";
import { CASE_KIND_LABEL, CASE_KINDS, LEVELS, PURPOSES, RUN_PURPOSE_LABEL } from "./plain";

const CHOICES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "Run form level": LEVELS,
  [CASE_KIND_LABEL]: CASE_KINDS,
  [RUN_PURPOSE_LABEL]: PURPOSES,
};

type Control = "Run form level" | "Case kind" | "Market view";

function labelOf(control: Control, key: string) {
  const label = CHOICES[control]?.[key];
  if (!label) throw new Error(`No choice "${key}" for ${control}`);
  return label;
}

function select(control: Control) {
  return screen.queryByRole("combobox", { name: control });
}

function group(control: Control) {
  return screen.getByRole("group", { name: control });
}

/** Chooses the option whose stored key is `key`. */
export function chooseControl(control: Control, key: string) {
  const box = select(control);
  if (box) {
    fireEvent.change(box, { target: { value: key } });
    return;
  }
  fireEvent.click(within(group(control)).getByRole("button", { name: labelOf(control, key) }));
}

/** The stored key of the option now chosen. */
export function controlValue(control: Control): string {
  const box = select(control);
  if (box instanceof HTMLSelectElement) return box.value;
  const pressed = within(group(control))
    .getAllByRole("button")
    .find((button) => button.getAttribute("aria-pressed") === "true");
  const text = pressed?.textContent.trim() ?? "";
  const found = Object.entries(CHOICES[control] ?? {}).find(([, label]) => label === text);
  return found?.[0] ?? "";
}

/** The options offered, by their labels, in order. */
export function controlChoices(control: Control): string[] {
  const box = select(control);
  if (box)
    return within(box)
      .getAllByRole("option")
      .map((option) => option.textContent);
  return within(group(control))
    .getAllByRole("button")
    .map((button) => button.textContent.trim());
}
