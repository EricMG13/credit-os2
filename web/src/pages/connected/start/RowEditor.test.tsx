import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { RowEditor } from "./RowEditor";
import { emptyRow, ROW_SPECS, sendableRows, type Row, type RowKind } from "./rows";

it("adds an empty facility with every field key", () => {
  const onChange = vi.fn();
  render(<RowEditor kind="deal_terms" rows={[]} onChange={onChange} primary />);
  fireEvent.click(screen.getByRole("button", { name: "Add facility" }));
  expect(onChange).toHaveBeenCalledWith([emptyRow("deal_terms")]);
  expect(Object.keys(emptyRow("deal_terms"))).toHaveLength(17);
  expect(emptyRow("quotes")).toMatchObject({ kind: "observed" });
  expect(emptyRow("ratings")).toMatchObject({ scope: "issuer" });
});

it("writes one field as a string and keeps unknown keys", () => {
  const onChange = vi.fn();
  render(
    <RowEditor
      kind="deal_terms"
      rows={[{ facility_id: "", size_m: 500, custom: 7 }]}
      onChange={onChange}
      primary
    />,
  );
  fireEvent.change(screen.getByLabelText("Facility ID"), { target: { value: "tlb-2031" } });
  expect(onChange).toHaveBeenCalledWith([{ facility_id: "tlb-2031", size_m: 500, custom: 7 }]);
});

it("shows new-issue fields only for a new issue", () => {
  const { rerender } = render(
    <RowEditor
      kind="deal_terms"
      rows={[emptyRow("deal_terms")]}
      onChange={vi.fn()}
      primary={false}
    />,
  );
  expect(screen.queryByLabelText("Tenor (years)")).toBeNull();
  expect(screen.queryByLabelText("Talk spread low (bps)")).toBeNull();
  rerender(
    <RowEditor kind="deal_terms" rows={[emptyRow("deal_terms")]} onChange={vi.fn()} primary />,
  );
  expect(screen.getByLabelText("Tenor (years)")).toBeInTheDocument();
});

it("summarises a row and removes it", () => {
  const onChange = vi.fn();
  const row = {
    ...emptyRow("deal_terms"),
    facility_id: "tlb-2031",
    instrument: "Term loan B",
    currency: "USD",
    size_m: "1250",
  };
  render(<RowEditor kind="deal_terms" rows={[row]} onChange={onChange} primary />);
  expect(screen.getByText("tlb-2031 · Term loan B · USD 1250m")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Remove Facility 1" }));
  expect(onChange).toHaveBeenCalledWith([]);
});

it("stops adding at the maximum and states a requirement", () => {
  const rows = Array.from({ length: ROW_SPECS.research_questions.max }, () =>
    emptyRow("research_questions"),
  );
  render(<RowEditor kind="research_questions" rows={rows} onChange={vi.fn()} primary={false} />);
  expect(screen.getByRole("button", { name: "Add research question" })).toBeDisabled();
  render(<RowEditor kind="deal_terms" rows={[]} onChange={vi.fn()} primary required />);
  expect(
    screen.getByText("At least one facility is required for a new issue."),
  ).toBeInTheDocument();
});

it("shows a held value that is not among the options", () => {
  const { rerender } = render(
    <RowEditor
      kind="deal_terms"
      rows={[{ ...emptyRow("deal_terms"), instrument: "Bridge loan" }]}
      onChange={vi.fn()}
      primary
    />,
  );
  const instrument = screen.getByLabelText<HTMLSelectElement>("Instrument");
  expect(instrument.selectedOptions[0]?.textContent).toBe("Bridge loan");
  rerender(
    <RowEditor
      kind="research_questions"
      rows={[{ text: "Q?", focus_module: "CP-2D" }]}
      onChange={vi.fn()}
      primary={false}
      focusChoices={[["", "Any"]]}
    />,
  );
  const focus = screen.getByLabelText<HTMLSelectElement>("Focus module");
  expect(focus.selectedOptions[0]?.textContent).toBe("Liquidity");
});

// Keys of the service models (src/deploy_vii/context.py DealTerm, Quote, Rating, ResearchQuestion).
const SERVICE_KEYS = {
  deal_terms:
    "facility_id instrument currency size_m tenor_years talk_spread_bps_low talk_spread_bps_high talk_oid_low talk_oid_high floor_pct coupon_pct margin_bps maturity call_protection use_of_proceeds as_of provider",
  quotes: "facility_id kind bid ask price yield_pct spread_bps as_of provider",
  ratings: "agency scope rating outlook as_of",
  research_questions: "text focus_module",
};
const blank = (kind: keyof typeof SERVICE_KEYS) =>
  Object.fromEntries(SERVICE_KEYS[kind].split(" ").map((key) => [key, ""]));

it("sends every key the service reads, trimmed, as strings", () => {
  const typed = [{ facility_id: " TL-B ", size_m: 500, tenor_years: "7" }, emptyRow("deal_terms")];
  const expected = { ...blank("deal_terms"), facility_id: "TL-B", size_m: "500" };
  expect(sendableRows("deal_terms", typed, false)).toEqual([expected]);
  expect(sendableRows("deal_terms", typed, true)).toEqual([{ ...expected, tenor_years: "7" }]);
  const quote = { ...blank("quotes"), kind: "observed", bid: " 98 " };
  expect(sendableRows("quotes", [quote, emptyRow("quotes")], true)).toEqual([
    { ...quote, bid: "98" },
  ]);
  const rating = { ...emptyRow("ratings"), rating: "B+", custom: 7 };
  expect(sendableRows("ratings", [rating, emptyRow("ratings")], true)).toEqual([
    { ...blank("ratings"), scope: "issuer", rating: "B+", custom: 7 },
  ]);
  const asked = [{ text: " Why? " }, { ...emptyRow("research_questions"), text: "  " }];
  expect(sendableRows("research_questions", asked, true)).toEqual([
    { ...blank("research_questions"), text: "Why?" },
  ]);
});

function Held({ kind, start }: { kind: RowKind; start: Row[] }) {
  const [rows, setRows] = useState(start);
  return <RowEditor kind={kind} rows={rows} onChange={setRows} primary />;
}
const named = (id: string) => ({ ...emptyRow("deal_terms"), facility_id: id });
const cards = () => [...document.querySelectorAll("details")];
const openIds = () =>
  cards()
    .filter((item) => item.open)
    .map((item) => item.querySelector<HTMLInputElement>("input")?.value);

it("keeps a row's open state with the row when a row above it is removed", () => {
  render(<Held kind="deal_terms" start={[named("A"), named("B"), named("C")]} />);
  (cards()[2] as HTMLDetailsElement).open = true;
  fireEvent.click(screen.getByRole("button", { name: "Remove Facility 1" }));
  expect(openIds()).toEqual(["C"]);
});

it("keeps a just-added row open when a row above it is removed", () => {
  render(<Held kind="deal_terms" start={[named("A"), named("B")]} />);
  fireEvent.click(screen.getByRole("button", { name: "Add facility" }));
  expect(cards().map((item) => item.open)).toEqual([false, false, true]);
  fireEvent.click(screen.getByRole("button", { name: "Remove Facility 1" }));
  expect(cards().map((item) => item.open)).toEqual([false, true]);
});

it("moves focus to Add after the last row is removed and keeps it on a Remove button otherwise", () => {
  render(<Held kind="deal_terms" start={[named("A"), named("B")]} />);
  fireEvent.click(screen.getByRole("button", { name: "Remove Facility 1" }));
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove Facility 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove Facility 1" }));
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add facility" }));
});

it("marks the fields the static form requires", () => {
  render(<Held kind="quotes" start={[emptyRow("quotes")]} />);
  for (const name of ["As-of", "Provider"]) {
    const control = screen.getByLabelText(name);
    expect(control).toHaveAttribute("aria-required", "true");
    expect(control.closest("div")).toHaveTextContent("Required");
    expect(control.closest("div")?.querySelector("label")).not.toHaveTextContent("Required");
    expect(control).not.toHaveAccessibleDescription(/Required/);
  }
  expect(screen.getByLabelText("Bid").closest("div")).not.toHaveTextContent("Required");
  expect(screen.getByLabelText("Bid")).not.toHaveAttribute("aria-required");
  expect(Object.keys(ROW_SPECS)).toHaveLength(8);
  const required = Object.fromEntries(
    Object.entries(ROW_SPECS).map(([kind, spec]) => [
      kind,
      spec.fields.filter((item) => item.required).map((item) => item.key),
    ]),
  );
  expect(required).toEqual({
    deal_terms: [],
    quotes: ["as_of", "provider"],
    ratings: ["agency", "rating"],
    research_questions: ["text"],
    peer_names: [],
    peers: [],
    precedents: [],
    scenarios: [],
  });
});

it("draws its error under the Add button and describes the button with it", () => {
  render(
    <RowEditor kind="deal_terms" rows={[]} onChange={vi.fn()} primary error="Add a facility." />,
  );
  const add = screen.getByRole("button", { name: "Add facility" });
  expect(screen.getByRole("alert")).toHaveTextContent("Add a facility.");
  expect(add).toHaveAccessibleDescription("Add a facility.");
});

it("states the facility requirement once, whether or not it has failed", () => {
  const requirement = "At least one facility is required for a new issue.";
  const { rerender } = render(
    <RowEditor kind="deal_terms" rows={[]} onChange={vi.fn()} primary required />,
  );
  expect(screen.getByText(requirement)).toBeInTheDocument();
  rerender(
    <RowEditor
      kind="deal_terms"
      rows={[]}
      onChange={vi.fn()}
      primary
      required
      error="Add at least one facility in Facilities and deal terms."
    />,
  );
  expect(screen.queryByText(requirement)).toBeNull();
  expect(screen.getByRole("alert")).toHaveTextContent("Add at least one facility");
});

it("announces a removed row", () => {
  render(<Held kind="deal_terms" start={[named("A"), named("B")]} />);
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  fireEvent.click(screen.getByRole("button", { name: "Remove Facility 2" }));
  expect(screen.getByRole("status")).toHaveTextContent("Facility 2 removed.");
});

it("marks the Add button as the control to focus for its kind", () => {
  render(<RowEditor kind="deal_terms" rows={[]} onChange={vi.fn()} primary />);
  expect(screen.getByRole("button", { name: "Add facility" })).toHaveAttribute(
    "data-field",
    "deal_terms",
  );
});

it("announces a second removal of the same position again", () => {
  render(<Held kind="deal_terms" start={[named("A"), named("B"), named("C")]} />);
  const status = screen.getByRole("status");
  fireEvent.click(screen.getByRole("button", { name: "Remove Facility 1" }));
  expect(status).toHaveTextContent("Facility 1 removed.");
  const records: MutationRecord[] = [];
  const observer = new MutationObserver((seen) => records.push(...seen));
  observer.observe(status, { childList: true, characterData: true, subtree: true });
  fireEvent.click(screen.getByRole("button", { name: "Remove Facility 1" }));
  records.push(...observer.takeRecords());
  observer.disconnect();
  expect(status).toHaveTextContent("Facility 1 removed.");
  expect(records.length).toBeGreaterThan(0);
});
