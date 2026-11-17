import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Table } from "@/components/application/table/table";
import { Alert } from "@/components/alert/Alert";
import { Timeline } from "@/components/timeline/Timeline";
import { StatusBadge } from "@/components/status/StatusBadge";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { Select } from "@/components/base/select/select";
import { FileListItemProgressBar } from "@/components/application/file-upload/file-upload-base";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { ChartTable } from "@/components/chart/ChartTable";
import { PairTile } from "@/components/chart/PairTile";
import { Card } from "@/components/card/Card";
import { Tabs, TabList, Tab, TabPanel } from "@/components/application/tabs/tabs";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { FileUploadDropZone } from "@/components/application/file-upload/file-upload-base";
import { ColumnsChart } from "@/components/chart/ColumnsChart";
import { LimitsChart } from "@/components/chart/LimitsChart";
import { PathChart } from "@/components/chart/PathChart";
import { StackChart } from "@/components/chart/StackChart";
import { ScatterPlot } from "@/components/chart/ScatterPlot";
import { WaterfallChart } from "@/components/chart/WaterfallChart";

const LONG =
  "Amended and Restated Senior Facilities Agreement dated 15 June 2024 between the Parent and the Original Lenders, Execution Version with Schedules 1 to 14";

function Case({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section data-case={id} style={{ width: 360, padding: 8 }}>
      {children}
    </section>
  );
}

const errors: string[] = [];
const origError = console.error;
console.error = (...a: unknown[]) => {
  errors.push(a.map((x) => String(x)).join(" ").slice(0, 400));
  origError(...a);
};
(window as unknown as { __errors: string[] }).__errors = errors;

const cases = (which: string): ReactNode => {
  switch (which) {
    case "table-cells":
      return (
        <Table aria-label="t">
          <Table.Header>
            <Table.Head id="a" isRowHeader label="Name" />
            <Table.Head id="b" numeric label="Figure" />
          </Table.Header>
          <Table.Body
            items={[
              { id: "null", v: null as string | null | undefined },
              { id: "undef", v: undefined as string | null | undefined },
              { id: "empty", v: "" as string | null | undefined },
              { id: "zero", v: "0" as string | null | undefined },
            ]}
          >
            {(item) => (
              <Table.Row id={item.id}>
                <Table.Cell>{item.id}</Table.Cell>
                <Table.Cell numeric>{item.v}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      );
    case "alert-nesting":
      return (
        <Alert tone="warning" title="Contrary evidence">
          <p>First paragraph of a passage.</p>
          <ul>
            <li>Item</li>
          </ul>
        </Alert>
      );
    case "timeline-dup":
      return (
        <Timeline
          items={[
            { date: "15 Mar 2026", title: "Covenant test", state: "Next" },
            { date: "15 Mar 2026", title: "Covenant test", state: "Later" },
          ]}
        />
      );
    case "status-unknown":
      return <StatusBadge set="Module state" state={"Partially delivered" as "Delivered"} />;
    case "progress-over":
      return <ProgressBar value={21} max={20} label="USD 20.31 of USD 20.00" />;
    case "select-long":
      return (
        <Select label="Executed agreement" defaultSelectedKey="a" aria-label="x">
          <Select.Item id="a" label={LONG} />
          <Select.Item id="b" label="Short" />
        </Select>
      );
    case "file-long":
      return <FileListItemProgressBar name={LONG + ".pdf"} size="4 MB" state="Read in full" />;
    case "loading":
      return <LoadingIndicator label="Waiting for the first module" />;
    case "charttable-empty":
      return <ChartTable caption="c" head={["Name", "FY25"]} rows={[]} />;
    case "charttable-blank":
      return <ChartTable caption="c" head={["Name", "FY25"]} rows={[{ label: "r", cells: [""] }]} />;
    case "pairtile":
      return (
        <Card title="Ratings">
          <PairTile
            tiles={[
              { label: "Moody's", value: "Ba3", caption: "Stable outlook" },
              { label: "S&P", value: null },
            ]}
          />
        </Card>
      );
    case "card-heading":
      return (
        <>
          <h1>Page title</h1>
          <Card title="Modules">
            <p>Body</p>
          </Card>
        </>
      );
    case "columns-3":
    case "columns-mismatch": {
      const mismatch = which === "columns-mismatch";
      return (
        <ColumnsChart
          title="Maturities by year"
          groups={["FY25", "FY26", "FY27"]}
          series={
            mismatch
              ? [{ name: "Base", values: [60, 70, 80], labels: ["100", "90", "80"] }]
              : [
                  { name: "Term loan", values: [60, 70, 80], labels: ["60", "70", "80"] },
                  { name: "Notes", values: [100, 50, 40], labels: ["100", "50", "40"] },
                  { name: "Revolver", values: [20, 30, 35], labels: ["20", "30", "35"] },
                ]
          }
          yTicks={[
            { value: 0, label: "0" },
            { value: 50, label: "50" },
            { value: 100, label: "100" },
          ]}
          table={
            mismatch
              ? {
                  head: ["Group", "Base"],
                  rows: [
                    { label: "FY25", cells: ["999"] },
                    { label: "FY26", cells: ["999"] },
                    { label: "FY27", cells: ["999"] },
                  ],
                }
              : {
                  head: ["Group", "Term loan", "Notes", "Revolver"],
                  rows: [
                    { label: "FY25", cells: ["60", "100", "20"] },
                    { label: "FY26", cells: ["70", "50", "30"] },
                    { label: "FY27", cells: ["80", "40", "35"] },
                  ],
                }
          }
        />
      );
    }
    case "limits-5":
      return (
        <LimitsChart
          title="Exposure against limits"
          columns={[
            { label: "Largest single issuer", exposure: 2.1, limit: 3, scaleMax: 4, exposureText: "2.1%", limitText: "limit 3.0%" },
            { label: "Top five issuers", exposure: 8.4, limit: 9, scaleMax: 12, exposureText: "8.4%", limitText: "limit 9.0%" },
            { label: "Single sector", exposure: 14.2, limit: 15, scaleMax: 20, exposureText: "14.2%", limitText: "limit 15.0%" },
            { label: "Sub-investment grade", exposure: 6.9, limit: null, scaleMax: 10, exposureText: "6.9%", limitText: null },
            { label: "Unrated", exposure: null, limit: 2, scaleMax: 4, exposureText: null, limitText: "limit 2.0%" },
          ]}
          table={{
            head: ["Limit", "Exposure", "Limit"],
            rows: [
              { label: "Largest single issuer", cells: ["2.1%", "3.0%"] },
              { label: "Top five issuers", cells: ["8.4%", "9.0%"] },
              { label: "Single sector", cells: ["14.2%", "15.0%"] },
              { label: "Sub-investment grade", cells: ["6.9%", null] },
              { label: "Unrated", cells: [null, "2.0%"] },
            ],
          }}
        />
      );
    case "path":
      return (
        <PathChart
          title="Net leverage by case"
          periods={["FY24", "FY25", "FY26"]}
          series={[
            { name: "Base", values: [4.8, 4.5, 4.1], labels: ["4.8x", "4.5x", "4.1x"] },
            { name: "Downside", values: [4.8, 5.1, 5.6], labels: ["4.8x", "5.1x", "5.6x"] },
          ]}
          yTicks={[
            { value: 0, label: "0x" },
            { value: 3, label: "3x" },
            { value: 6, label: "6x" },
          ]}
          table={{
            head: ["Case", "FY24", "FY25", "FY26"],
            rows: [
              { label: "Base", cells: ["4.8x", "4.5x", "4.1x"] },
              { label: "Downside", cells: ["4.8x", "5.1x", "5.6x"] },
            ],
          }}
        />
      );
    case "stack-zero":
      return (
        <StackChart
          title="Debt by instrument"
          parts={[
            { name: "Term loan", value: 80, text: "80", share: "100%" },
            { name: "Revolver drawn", value: 0, text: "0", share: "0%" },
          ]}
          table={{
            head: ["Instrument", "Amount", "Share"],
            rows: [
              { label: "Term loan", cells: ["80", "100%"] },
              { label: "Revolver drawn", cells: ["0", "0%"] },
            ],
          }}
        />
      );
    case "waterfall-colours":
      return (
        <WaterfallChart
          title="Net debt bridge"
          steps={[
            { label: "Opening", kind: "total", from: 0, to: 60, text: "60" },
            { label: "Cash flow", kind: "down", from: 60, to: 45, text: "-15" },
            { label: "Purchases", kind: "up", from: 45, to: 70, text: "+25" },
            { label: "Closing", kind: "total", from: 0, to: 70, text: "70" },
          ]}
          yTicks={[
            { value: 0, label: "0" },
            { value: 50, label: "50" },
            { value: 100, label: "100" },
          ]}
          legend={{ total: "Total", down: "Down", up: "Up" }}
          table={{
            head: ["Step", "Amount"],
            rows: [
              { label: "Opening", cells: ["60"] },
              { label: "Cash flow", cells: ["-15"] },
              { label: "Purchases", cells: ["+25"] },
              { label: "Closing", cells: ["70"] },
            ],
          }}
        />
      );
    case "scatter":
      return (
        <ScatterPlot
          title="Leverage against margin"
          x={{ title: "Net leverage", short: "net leverage", ticks: [{ value: 0, label: "0x" }, { value: 4, label: "4x" }, { value: 8, label: "8x" }] }}
          y={{ title: "EBITDA margin", short: "margin", ticks: [{ value: 0, label: "0%" }, { value: 20, label: "20%" }, { value: 40, label: "40%" }] }}
          othersName="Peers"
          points={[
            { name: "Issuer", x: 5.5, y: 30, xText: "5.5x", yText: "30%", emphasis: true },
            { name: "Peer A", x: 3.1, y: 22, xText: "3.1x", yText: "22%" },
            { name: "Peer B", x: 4.2, y: 18, xText: "4.2x", yText: "18%" },
            { name: "Peer C", x: null, y: 25, xText: null, yText: "25%" },
          ]}
          table={{
            head: ["Company", "Net leverage", "EBITDA margin"],
            rows: [
              { label: "Issuer", cells: ["5.5x", "30%"] },
              { label: "Peer A", cells: ["3.1x", "22%"] },
              { label: "Peer B", cells: ["4.2x", "18%"] },
              { label: "Peer C", cells: [null, "25%"] },
            ],
          }}
        />
      );
    case "stack-ok":
      return (
        <StackChart
          title="Debt by instrument"
          parts={[
            { name: "Term loan", value: 80, text: "80", share: "80%" },
            { name: "Notes", value: 20, text: "20", share: "20%" },
          ]}
          table={{
            head: ["Instrument", "Amount", "Share"],
            rows: [
              { label: "Term loan", cells: ["80", "80%"] },
              { label: "Notes", cells: ["20", "20%"] },
            ],
          }}
        />
      );
    case "tabs-hover":
      return (
        <Tabs>
          <TabList type="underline" aria-label="T">
            <Tab id="a">Overview</Tab>
            <Tab id="b">Changes</Tab>
            <Tab id="c">Evidence</Tab>
          </TabList>
          <TabPanel id="a">A</TabPanel>
          <TabPanel id="b">B</TabPanel>
          <TabPanel id="c">C</TabPanel>
        </Tabs>
      );
    case "buttongroup":
      return (
        <ButtonGroup aria-label="g" defaultSelectedKeys={["chart"]}>
          <ButtonGroupItem id="chart">Chart</ButtonGroupItem>
          <ButtonGroupItem id="table">Table</ButtonGroupItem>
        </ButtonGroup>
      );
    case "dropzone-invalid":
      return <FileUploadDropZone hint="PDF files only" accept=".pdf" />;
    default:
      return <p>unknown</p>;
  }
};

const which = new URLSearchParams(location.search).get("case") ?? "";
const root = createRoot(document.getElementById("root") as HTMLElement, {
  onUncaughtError: (e) => {
    (window as unknown as { __uncaught?: string }).__uncaught = String(e).slice(0, 300);
  },
});
root.render(
  <StrictMode>
    <Case id={which}>{cases(which)}</Case>
  </StrictMode>,
);
