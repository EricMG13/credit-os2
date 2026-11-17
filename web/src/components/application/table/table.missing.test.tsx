import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { Table } from "./table";
it("keeps missing null,undefined,empty string distinct from present zero", async () => {
  render(
    <Table aria-label="Figures">
      <Table.Header>
        <Table.Head isRowHeader>A</Table.Head>
        <Table.Head>B</Table.Head>
        <Table.Head>C</Table.Head>
        <Table.Head>D</Table.Head>
      </Table.Header>
      <Table.Body>
        <Table.Row id="r">
          <Table.Cell>{null}</Table.Cell>
          <Table.Cell>{undefined}</Table.Cell>
          <Table.Cell>{""}</Table.Cell>
          <Table.Cell>{"0"}</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>,
  );
  const first = await screen.findByRole("rowheader");
  const cells = [first, ...screen.getAllByRole("gridcell")];
  expect(cells).toHaveLength(4);
  for (const cell of cells.slice(0, 3)) expect(within(cell).getByText("n.a.")).toBeVisible();
  expect(cells[3]).toHaveTextContent(/^0$/);
});
