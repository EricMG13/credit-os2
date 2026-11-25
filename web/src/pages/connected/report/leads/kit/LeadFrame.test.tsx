// The tile parts every lead draws with, on the retained TransDigm CP-1 entry (outdated evidence;
// shape only). The ResizeObserver cases replace jsdom's missing one with a stub that reports the
// sizes written here.
import { act, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { cp1Entry, leadProps } from "../fixtures/load";
import { FigureTile, Link, TableView } from "./LeadFrame";
import { useFigureWidth, useOverflows } from "./useWidth";

const TABLE = {
  caption: "EBITDA bridge, USD m",
  headers: ["Step", "Amount, USD m"],
  rows: [
    ["Reported EBITDA", "3,813"],
    ["EBITDA As Defined", "4,173"],
  ],
};

const TARGET = ["min-h-8", "max-[480px]:min-h-11", "outline-focus-ring", "focus-visible:outline-2"];

function tile() {
  render(
    <FigureTile
      props={leadProps(cp1Entry())}
      span={6}
      label="EBITDA bridge"
      kicker="FY2024 · USD m"
      title="Reported EBITDA to EBITDA As Defined"
      source="the EBITDA bridge"
      table={TABLE}
    >
      <svg role="img" aria-label="Bridge" />
    </FigureTile>,
  );
  return screen.getByRole("region", { name: "EBITDA bridge" });
}

describe("FigureTile", () => {
  it("puts the Figure / Table switch in the tile head beside the one trace control", () => {
    const region = tile();
    const button = within(region).getByRole("button", { name: "Table view: EBITDA bridge, USD m" });
    const source = within(region).getByRole("link", { name: /Source for the EBITDA bridge/ });
    // One container holds the switch and the trace control, after the heading.
    expect(button.closest("[role=group]")?.parentElement).toBe(source.parentElement);
    expect(region.querySelector("h3")?.compareDocumentPosition(button)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    // The basis sits under the title, not over it.
    const basis = within(region).getByText("FY2024 · USD m");
    expect(region.querySelector("h3")?.compareDocumentPosition(basis)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(region.querySelectorAll("details")).toHaveLength(0);
    for (const name of TARGET) expect(button.className).toContain(name);
    expect(within(region).getByRole("button", { name: "Figure" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("swaps the figure for the real table; the figure by default", () => {
    const region = tile();
    const button = within(region).getByRole("button", { name: /Table view/ });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(within(region).queryByRole("table")).toBeNull();
    expect(within(region).getByRole("img", { name: "Bridge" })).toBeInTheDocument();

    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    const table = within(region).getByRole("table", { name: "EBITDA bridge, USD m" });
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    // The table takes the figure's place: the figure is hidden, not drawn above it.
    expect(within(region).queryByRole("img", { name: "Bridge" })).toBeNull();
    const scroll = within(region).getByRole("group", { name: "EBITDA bridge, USD m, table" });
    // jsdom cannot measure: a box that may not overflow is no tab stop.
    expect(scroll.hasAttribute("tabindex")).toBe(false);

    fireEvent.click(within(region).getByRole("button", { name: "Figure" }));
    expect(within(region).queryByRole("table")).toBeNull();
    expect(within(region).getByRole("img", { name: "Bridge" })).toBeInTheDocument();
  });

  it("draws no table button without a table", () => {
    render(
      <FigureTile
        props={leadProps(cp1Entry())}
        span={6}
        label="Figure"
        kicker="k"
        title="t"
        source="the figure"
      >
        <p>drawing</p>
      </FigureTile>,
    );
    expect(screen.queryByRole("button", { name: /Table view/ })).toBeNull();
  });
});

describe("TableView and Link", () => {
  it("TableView standalone has the same button and panel", () => {
    render(<TableView {...TABLE} />);
    const button = screen.getByRole("button", { name: "Table view: EBITDA bridge, USD m" });
    expect(screen.getByText("Table view")).toBeVisible();
    fireEvent.click(button);
    expect(screen.getByRole("table", { name: "EBITDA bridge, USD m" })).toBeInTheDocument();
  });

  it("Link is a link at a 32 px target, 44 px on a phone, with the token focus ring", () => {
    render(<Link href="#forecast">Open the forecast</Link>);
    const link = screen.getByRole("link", { name: /Open the forecast/ });
    expect(link.getAttribute("href")).toBe("#forecast");
    expect(link.className).toContain("min-h-8");
    expect(link.className).toContain("max-[480px]:min-h-11");
  });
});

// ---------------------------------------------------------------------------------------------
type Callback = (entries: { contentRect: { width: number } }[]) => void;

function stubObserver() {
  const callbacks: Callback[] = [];
  class Stub {
    constructor(callback: Callback) {
      callbacks.push(callback);
    }
    observe() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", Stub);
  return (width: number) => {
    act(() => {
      for (const callback of callbacks) callback([{ contentRect: { width } }]);
    });
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useFigureWidth and useOverflows", () => {
  it("gives the fallback where there is no ResizeObserver", () => {
    const { result } = renderHook(() => useFigureWidth(520));
    expect(result.current[1]).toBe(520);
  });

  it("gives the measured width, whole pixels, and follows a resize", () => {
    const resize = stubObserver();
    function Probe() {
      const [ref, width] = useFigureWidth(520);
      return (
        <div ref={ref} data-testid="box">
          {width}
        </div>
      );
    }
    render(<Probe />);
    expect(screen.getByTestId("box").textContent).toBe("520");
    resize(390.7);
    expect(screen.getByTestId("box").textContent).toBe("390");
    resize(0);
    expect(screen.getByTestId("box").textContent).toBe("390");
  });

  it("makes the table box a tab stop only while its content is wider than it", () => {
    stubObserver();
    const widths = { scroll: 900, client: 300 };
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(() => widths.scroll);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => widths.client);
    function Probe() {
      const [ref, overflows] = useOverflows();
      return (
        <div ref={ref} data-testid="box">
          {String(overflows)}
        </div>
      );
    }
    render(<Probe />);
    expect(screen.getByTestId("box").textContent).toBe("true");
    vi.restoreAllMocks();
  });
});
