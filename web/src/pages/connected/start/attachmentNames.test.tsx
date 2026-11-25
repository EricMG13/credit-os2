/**
 * The review's "Everything Submit sends" names the file in each file box the analyst filled:
 * the management EBITDA bridge and the prior decision record as well as the portfolio workbook.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConnectedApp } from "../ConnectedApp";
import { recorded, setUpConnectedPage, toContext, toPurpose } from "./connectedTesting";
import { AGREEMENT, DOCUMENTS, FILING, summaryFor, TEMPLATE, WORKBOOK } from "./goldenFixtures";
import { chooseControl } from "./testControls";

setUpConnectedPage();

function service() {
  const stored = new Set<string>();
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string, init?: RequestInit) => {
      const entry = recorded(input, init, [FILING, WORKBOOK, AGREEMENT]);
      const reply = (value: unknown) => Promise.resolve(Response.json(value));
      const url = new URL(input, "http://service.test");
      if (input === "/connected/context") return reply(TEMPLATE);
      if (input === "/api/submissions" && entry.method === "POST") return reply({ id: "sub-1" });
      if (url.pathname === "/api/submissions/sub-1/files") {
        const name = url.searchParams.get("name") ?? "";
        stored.add(name);
        return reply({ name });
      }
      if (input === "/api/submissions/sub-1/reading")
        return reply({
          documents: DOCUMENTS.filter(({ source }) => stored.has(source)),
          ignored: [],
          error: "",
        });
      if (input === "/api/submissions/sub-1/summary")
        return reply(summaryFor("25", ["CP-0", "CP-1", "CP-4", "CP-6"]));
      if (url.pathname.startsWith("/api/issuers/"))
        return reply({ latest_run: "", runs: 0, latest_as_of: "" });
      return Promise.resolve(Response.json({ error: `unknown path ${input}` }, { status: 404 }));
    }),
  );
}

const choose = (label: string, value: string) => {
  fireEvent.change(screen.getByRole("combobox", { name: label }), { target: { value } });
};

describe("the file boxes in Everything Submit sends", { timeout: 30000 }, () => {
  it("names the file in every box the analyst filled, not only the portfolio workbook", async () => {
    service();
    render(<ConnectedApp path="/start" mode="synthetic" />);
    fireEvent.change(await screen.findByLabelText("Issuer name", {}, { timeout: 10000 }), {
      target: { value: "Northbridge Synthetic Group" },
    });
    fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "2025-03-31" } });
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Ana L" } });
    fireEvent.change(screen.getByLabelText("Documents"), {
      target: { files: [FILING, WORKBOOK, AGREEMENT] },
    });
    await toPurpose();
    chooseControl("Run form level", "advanced");
    await toContext();
    choose("Management EBITDA bridge", FILING.name);
    choose("Portfolio workbook", WORKBOOK.name);
    choose("Prior decision record", AGREEMENT.name);
    fireEvent.click(screen.getByRole("button", { name: "Review run" }));
    const inputs = await screen.findByRole("region", { name: "What will run" });
    const context = within(inputs).getByRole("group", { name: "Context" });
    expect(context).toHaveTextContent(`Management EBITDA bridge${FILING.name}`);
    expect(context).toHaveTextContent(`Portfolio workbook${WORKBOOK.name}`);
    expect(context).toHaveTextContent(`Prior decision record${AGREEMENT.name}`);
    expect(context).not.toHaveTextContent("Among the documents");
  });
});
