import { fireEvent, screen, within } from "@testing-library/react";
import { currentWith, go, serve, showLive, type Snapshot } from "./test-helpers";

const ACCOUNTS = "GET /auth/accounts";
const ME = "GET /auth/me";
const DIRECTORY = {
  accounts: [
    {
      id: 1,
      display_name: "Ada Admin",
      profile_type: "admin",
      disabled: false,
      signed_in_at: "2026-11-26T10:00:00+00:00",
    },
    {
      id: 2,
      display_name: "Rae Reader",
      profile_type: "reader",
      disabled: false,
      signed_in_at: null,
    },
  ],
};

function signedIn(profileType: "reader" | "analyst" | "admin") {
  return currentWith((snapshot: Snapshot) => {
    snapshot.viewer.profileType = profileType;
    snapshot.viewer.role = profileType === "reader" ? "reader" : "writer";
    snapshot.viewer.roleLabel =
      profileType === "admin" ? "Admin" : profileType === "analyst" ? "Analyst" : "Reader";
  });
}

function accountRoutes(service: ReturnType<typeof serve>) {
  service.replies.set(ACCOUNTS, () => Response.json(DIRECTORY));
  service.replies.set(ME, () => Response.json({ account: { id: 1 } }));
}

describe("authenticated Settings sections", () => {
  it("lets a Reader inspect Sources and Accounts without write controls", async () => {
    const service = serve(signedIn("reader"));
    accountRoutes(service);
    showLive("#/signal/main/settings/sources");

    const sourceSection = within(await screen.findByRole("region", { name: "Sources" }));
    expect(sourceSection.getByText("Freight Monitor")).toBeInTheDocument();
    expect(sourceSection.queryByRole("button", { name: "Propose a source" })).toBeNull();
    expect(sourceSection.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(sourceSection.queryByRole("button", { name: "Pause" })).toBeNull();

    await go("#/signal/main/settings/accounts");
    expect(await screen.findByRole("heading", { level: 2, name: "Accounts" })).toBeInTheDocument();
    expect(await screen.findByText("Rae Reader")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Disable" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Admin" })).toBeNull();
    expect(service.calls).toContain(ACCOUNTS);
    expect(service.calls).toContain(ME);
  });

  it("lets an Analyst propose a source while approval stays Admin-only", async () => {
    serve(signedIn("analyst"));
    showLive("#/signal/main/settings/sources");
    const sources = within(await screen.findByRole("region", { name: "Sources" }));
    expect(sources.getByRole("button", { name: "Propose a source" })).toBeEnabled();
    expect(sources.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(sources.queryByRole("button", { name: "Pause" })).toBeNull();
  });

  it("lets an Admin approve a source through the exact route and refreshes state", async () => {
    const snapshot = signedIn("admin");
    const service = serve(snapshot);
    service.replies.set("POST /signal/api/admin/sources/6/approve", () => {
      const source = snapshot.scenes[0].snapshot.settings.sources.find((item) => item.id === "6");
      if (source === undefined) throw new Error("fixture must contain source 6");
      source.state = "Approved";
      return Response.json({ id: "6", state: "approved" });
    });
    showLive("#/signal/main/settings/sources");

    const row = await screen.findByRole("row", { name: /Freight Monitor/ });
    fireEvent.click(within(row).getByRole("button", { name: "Approve" }));
    expect(await screen.findByText("Source approved.")).toBeInTheDocument();
    expect(service.calls).toEqual([
      "GET /signal/api/snapshot?format=2",
      "POST /signal/api/admin/sources/6/approve",
      "GET /signal/api/snapshot?format=2",
    ]);
    expect(
      within(await screen.findByRole("row", { name: /Freight Monitor/ })).getByText("Approved"),
    ).toBeInTheDocument();
  });
});
