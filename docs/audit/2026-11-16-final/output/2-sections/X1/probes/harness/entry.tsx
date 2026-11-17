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
