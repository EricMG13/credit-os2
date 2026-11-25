import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Pipeline, type PipelineNode, type PipelineStage } from "./Pipeline";

afterEach(cleanup);

const stages: PipelineStage[] = [
  { name: "Sources", nodes: [{ id: "CP-0", name: "Source readiness", state: "delivered" }] },
  {
    name: "Financials",
    nodes: [
      { id: "CP-1", name: "Financial foundation", state: "delivered" },
      { id: "CP-MODEL", name: "Model", state: "running" },
    ],
  },
  { name: "Credit", nodes: [{ id: "CP-2", name: "Fundamental credit", state: "queued" }] },
  {
    name: "Structure and market",
    nodes: [
      { id: "CP-4", name: "Legal & covenants", state: "blocked", detail: "No executed documents." },
    ],
  },
  {
    name: "Validation and decision",
    nodes: [{ id: "CP-5", name: "Evidence validation", state: "failed", word: "Interrupted" }],
  },
];

const nodeOf = (name: string) => {
  const item = screen.getByText(name, { selector: "span" }).closest("li");
  if (!item) throw new Error(`no node ${name}`);
  return item;
};
const nodes = (count: number, state: PipelineNode["state"] = "delivered"): PipelineNode[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `CP-${String(i)}`,
    name: `Module ${String(i)}`,
    state,
  }));

it("draws the stages as a named list of lists with the count beside, not apart from, the name", () => {
  render(<Pipeline label="Modules in this run" stages={stages} />);
  const list = screen.getByRole("list", { name: "Modules in this run" });
  const headings = within(list).getAllByRole("heading", { level: 3 });
  expect(headings.map((heading) => heading.textContent)).toEqual([
    "Sources1",
    "Financials2",
    "Credit1",
    "Structure and market1",
    "Validation and decision1",
  ]);
  // The count is its own element in the same block as the name, so a wrapped name keeps it close.
  expect(headings[0]?.querySelectorAll("span")).toHaveLength(2);
  expect(headings[0]).toHaveClass("block");
});

it("takes the stage heading level from its caller", () => {
  render(<Pipeline label="Stages" stages={stages} stageLevel={4} />);
  expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(5);
  expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
});

it("omits a stage with no nodes", () => {
  render(<Pipeline label="Stages" stages={[{ name: "Financials", nodes: [] }, ...stages]} />);
  expect(screen.queryByText("Financials0")).toBeNull();
  expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(5);
});

it("states each node's state in words, never by colour alone", () => {
  render(<Pipeline label="Stages" stages={stages} />);
  expect(nodeOf("Source readiness")).toHaveTextContent("Delivered");
  expect(nodeOf("Model")).toHaveTextContent("Running");
  expect(nodeOf("Fundamental credit")).toHaveTextContent("Queued");
  expect(nodeOf("Legal & covenants")).toHaveTextContent("Not assessable");
  expect(nodeOf("Legal & covenants")).toHaveTextContent("No executed documents.");
  expect(nodeOf("Evidence validation")).toHaveTextContent("Interrupted");
});

it("marks the running node as the current step", () => {
  render(<Pipeline label="Stages" stages={stages} />);
  expect(nodeOf("Model")).toHaveAttribute("aria-current", "step");
  expect(nodeOf("Source readiness")).not.toHaveAttribute("aria-current");
});

it("keys nodes by position, so a module listed twice still draws twice", () => {
  const twice: PipelineStage[] = [
    {
      name: "Credit",
      nodes: [
        { id: "CP-2", name: "Fundamental credit", state: "delivered" },
        { id: "CP-2", name: "Fundamental credit", state: "queued" },
      ],
    },
  ];
  const { rerender } = render(<Pipeline label="Stages" stages={twice} />);
  expect(screen.getAllByText("Fundamental credit")).toHaveLength(2);
  rerender(
    <Pipeline
      label="Stages"
      stages={[
        {
          name: "Credit",
          nodes: [
            { id: "CP-2", name: "Fundamental credit", state: "delivered" },
            { id: "CP-2", name: "Fundamental credit", state: "running" },
          ],
        },
      ]}
    />,
  );
  expect(
    screen.getAllByRole("listitem").filter((li) => li.getAttribute("aria-current")),
  ).toHaveLength(1);
});

it("draws a node as a link only when it is given an address", () => {
  render(
    <Pipeline
      label="Stages"
      stages={[
        {
          name: "Sources",
          nodes: [
            { id: "CP-0", name: "Source readiness", state: "delivered", href: "#modules/CP-0" },
            { id: "CP-1", name: "Financial foundation", state: "queued" },
          ],
        },
      ]}
    />,
  );
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(screen.getByRole("link", { name: /Source readiness/ })).toHaveAttribute(
    "href",
    "#modules/CP-0",
  );
});

it("says a word that is not the state's own in a visible tag, and the state's own word to screen readers only", () => {
  render(
    <Pipeline
      label="Stages"
      stages={[
        {
          name: "Credit",
          nodes: [
            { id: "A", name: "Gapped module", state: "queued", word: "Delivered with gaps" },
            { id: "B", name: "Not run module", state: "queued", word: "Not run" },
            { id: "C", name: "Queued module", state: "queued", word: "Queued" },
          ],
        },
      ]}
    />,
  );
  expect(nodeOf("Gapped module").querySelector(".sr-only")).toBeNull();
  expect(nodeOf("Gapped module")).toHaveTextContent("Delivered with gaps");
  expect(nodeOf("Not run module").querySelector(".sr-only")).toHaveTextContent("Not run");
  expect(nodeOf("Queued module").querySelector(".sr-only")).toHaveTextContent("Queued");
});

it("flows nothing on a run that has stopped", () => {
  render(<Pipeline label="Stages" stages={stages} flow="none" />);
  expect(document.querySelector(".pipeline-flow, .pipeline-flow-y")).toBeNull();
});

const CODES = [
  ["Sources", ["CP-0"]],
  ["Financials", ["CP-1", "CP-1B", "CP-1C", "CP-1D", "CP-MODEL"]],
  ["Credit", ["CP-1A", "CP-DR", "CP-2", "CP-2A", "CP-2D", "CP-2E", "CP-2G", "CP-2H"]],
  ["Structure and market", ["CP-3", "CP-3C", "CP-3D", "CP-4", "CP-4C"]],
  ["Validation and decision", ["CP-5", "CP-6", "CP-8"]],
  ["Report delivery", ["Report"]],
] as const;
/** A 22-module run with two modules running, in adjacent stages. */
const inFlight = (running: readonly string[], done: readonly string[]): PipelineStage[] =>
  CODES.map(([name, ids]) => ({
    name,
    nodes: ids.map((id) => ({
      id,
      name: id,
      state: running.includes(id) ? "running" : done.includes(id) ? "delivered" : "queued",
    })),
  }));

it("moves exactly the path into each running module on a run in flight, and nothing else", () => {
  const done = ["CP-0", "CP-1", "CP-1B", "CP-1C", "CP-1D", "CP-1A", "CP-DR"];
  render(<Pipeline label="Stages" stages={inFlight(["CP-MODEL", "CP-2"], done)} flow="running" />);
  const moving = [...document.querySelectorAll(".pipeline-flow, .pipeline-flow-y")];
  const describe = (el: Element) =>
    el.classList.contains("pipeline-flow")
      ? `branch:${el.closest("li")?.querySelector("span.min-w-0 span.min-w-0, span.wrap-break-word")?.textContent ?? ""}`
      : `trunk:${el.getAttribute("data-for") ?? ""}`;
  // For each running module: its own branch in, and the bus segment from the trunk to it. The
  // finished modules' edges out, and the rest of the bus, are still.
  expect(moving.map(describe).sort()).toEqual(
    ["branch:CP-MODEL", "branch:CP-2", "trunk:CP-MODEL", "trunk:CP-2"].sort(),
  );
  expect(moving.every((el) => el.classList.contains("pipeline-edge"))).toBe(true);
});

it("draws no moving segment for a running node that sits on the trunk itself", () => {
  render(
    <Pipeline
      label="Stages"
      stages={[
        { name: "A", nodes: [{ id: "A", name: "A", state: "delivered" }] },
        { name: "B", nodes: [{ id: "B", name: "B", state: "running" }] },
      ]}
      flow="running"
    />,
  );
  expect(document.querySelectorAll(".pipeline-flow-y")).toHaveLength(0);
  expect(document.querySelectorAll(".pipeline-flow")).toHaveLength(1);
});

it("keeps a stage of five nodes in one column, and splits one of six", () => {
  const sub = (count: number) => {
    cleanup();
    render(<Pipeline label="Stages" stages={[{ name: "Credit", nodes: nodes(count) }]} />);
    return new Set(
      screen
        .getAllByRole("listitem")
        .filter((li) => li.hasAttribute("data-sub"))
        .map((li) => li.getAttribute("data-sub")),
    );
  };
  expect(sub(5)).toEqual(new Set(["S"]));
  expect(sub(6)).toEqual(new Set(["A", "B"]));
});

it("draws every edge as a solid line, with the flow laid over it rather than replacing it", () => {
  render(<Pipeline label="Stages" stages={stages} flow="delivered" />);
  for (const edge of document.querySelectorAll(".pipeline-flow, .pipeline-flow-y"))
    expect(edge).toHaveClass("pipeline-edge");
});

it("flows out of delivered nodes on a finished report, and marks only their edges delivered", () => {
  render(<Pipeline label="Stages" stages={stages} flow="delivered" />);
  const marked = [...document.querySelectorAll("[data-edge='delivered']")];
  expect(marked.length).toBeGreaterThan(0);
  for (const edge of marked) expect(edge).toHaveClass("pipeline-flow");
  expect(marked.map((edge) => edge.closest("li"))).toEqual([
    nodeOf("Source readiness"),
    nodeOf("Financial foundation"),
  ]);
  expect(nodeOf("Fundamental credit").querySelector("[data-edge]")).toBeNull();
});

it("passes nothing on from a blocked or stopped node and draws no edge into an unfed stage", () => {
  render(<Pipeline label="Stages" stages={stages} flow="delivered" />);
  expect(nodeOf("Legal & covenants").querySelector("[data-edge]")).toBeNull();
  expect(nodeOf("Legal & covenants").querySelector(".border-dashed")).not.toBeNull();
  // The blocked stage passes nothing, so the stage after it has nothing to receive.
  expect(
    nodeOf("Evidence validation").querySelector("[aria-hidden='true'][class*='absolute']"),
  ).toBeNull();
});

it("draws one bus in the gap between two stages, not two a pixel apart", () => {
  render(
    <Pipeline
      label="Stages"
      stages={[
        { name: "A", nodes: nodes(2) },
        { name: "B", nodes: nodes(2) },
      ]}
    />,
  );
  const buses = [...document.querySelectorAll("[data-bus]")];
  expect(buses.map((bus) => bus.getAttribute("data-bus"))).toEqual(["out", "in"]);
  // Right bus of the first stage and left bus of the next sit on the same pixel of the gap.
  expect(buses[0]).toHaveClass("-right-[13px]");
  expect(buses[1]).toHaveClass("-left-3");
});

it("gives a legend of the states in use, each as a shape and a word", () => {
  render(<Pipeline label="Stages" stages={stages} />);
  const legend = screen.getByRole("list", { name: "Pipeline key" });
  for (const word of ["Delivered", "Running", "Queued", "Not assessable", "Interrupted"])
    expect(within(legend).getByText(word)).toBeVisible();
  expect(within(legend).queryByText("Failed")).toBeNull();
});

it("leaves the key out when its caller draws its own", () => {
  render(<Pipeline label="Stages" stages={stages} legend={false} />);
  expect(screen.queryByRole("list", { name: "Pipeline key" })).toBeNull();
});

it("gives a blocked node its full name, the slash icon and the word, drawn, not only read", () => {
  render(<Pipeline label="Stages" stages={stages} />);
  const blocked = nodeOf("Legal & covenants");
  const box = blocked.querySelector("[data-node]");
  expect(box).toHaveClass("border-dashed", "border-warning-mark", "bg-warning-fill");
  const word = within(blocked).getByText("Not assessable");
  expect(word.className).not.toMatch(/sr-only/);
  expect(word.parentElement?.querySelector("svg[data-shape='slashed circle']")).not.toBeNull();
});

it("makes only the blocked node taller in a one-column stage, so its word fits", () => {
  render(
    <Pipeline
      label="Stages"
      stages={[
        {
          name: "Structure",
          nodes: [
            { id: "A", name: "Security selection", state: "delivered" },
            { id: "B", name: "Legal & covenants", state: "blocked" },
            { id: "C", name: "Recovery", state: "queued" },
          ],
        },
      ]}
    />,
  );
  const size = (name: string) => nodeOf(name).style.getPropertyValue("--nh");
  expect([size("Security selection"), size("Legal & covenants"), size("Recovery")]).toEqual([
    "40px",
    "60px",
    "40px",
  ]);
});

it("keeps every node of a two-column stage 40px, marking a blocked one instead of drawing its word", () => {
  render(
    <Pipeline
      label="Stages"
      stages={[
        {
          name: "Credit",
          nodes: [...nodes(5), { id: "B", name: "Legal & covenants", state: "blocked" }],
        },
      ]}
    />,
  );
  const blocked = nodeOf("Legal & covenants");
  expect(blocked.style.getPropertyValue("--nh")).toBe("40px");
  expect(blocked.querySelector("[data-node]")).toHaveClass("border-dashed", "border-warning-mark");
  // The word is still read aloud and keyed, not drawn inside the small node.
  expect(
    within(blocked).getByText("Not assessable").closest('[class*="lg:sr-only"]'),
  ).not.toBeNull();
  expect(
    within(screen.getByRole("list", { name: "Pipeline key" })).getByText("Not assessable"),
  ).toBeVisible();
});

it("keeps the corner mark clear of the node's name", () => {
  render(<Pipeline label="Stages" stages={stages} />);
  const corner = nodeOf("Source readiness").querySelector('[class*="lg:-right-2"]');
  expect(corner).not.toBeNull();
});
