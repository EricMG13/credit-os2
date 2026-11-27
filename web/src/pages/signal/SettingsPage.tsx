// Settings: the page's h1, the section list as tabs (beside the section from 1280px, a wrapping
// row above it below that; the current one has the accent tint and edge), and the section's tile. In the sample every change is in memory (state here, so it
// survives moving between sections; a reload shows the slice again) and nothing is written. On a
// service a switch and a group's visibility show at once and are written; a refusal puts them back.
// A reader's list holds Topics and Notifications; on a service it also holds Digests, which any
// named user builds (spec section 2); the design-reference app's reader list stays as it was.
// Issuers is a writer's section, listed where the snapshot delivers the watchlist.
import { useState, type ReactNode } from "react";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { cx } from "@/utils/cx";
import { usePageWrite, useSignalActions } from "./actions";
import { useChoices } from "./choices";
import { sceneHref } from "./SignalFrame";
import { PageTitle } from "./parts/PageTitle";
import type { SignalScene } from "./slice";
import { useSignalViewer } from "./viewer";
import { GroupsSection } from "./settings/GroupsSection";
import { IssuersSection } from "./settings/IssuersSection";
import { NotificationsSection } from "./settings/NotificationsSection";
import { AiSection } from "./settings/AiSection";
import { DigestsSection } from "./settings/DigestsSection";
import { RulesSection } from "./settings/RulesSection";
import { SourcesSection } from "./settings/SourcesSection";
import { AccountsSection } from "./settings/AccountsSection";
import { TopicsSection } from "./settings/TopicsSection";
import { VISIBILITY, writes } from "./writes";

/** A switch's key: which rule of which group (the sample's one list has no group), or which event on which channel. */
type Flag = ["rule", string | null, string] | ["event", string, string];
const flagKey = (flag: Flag) => JSON.stringify(flag);
const flagWrite = (key: string, on: boolean) => {
  const flag = JSON.parse(key) as Flag;
  if (flag[0] === "event") return writes.notification(flag[1], flag[2], on);
  // On a service every rule drawn is a group's own; one of no group is a wiring fault, so it is loud.
  if (flag[1] === null) throw new Error(`the rule "${flag[2]}" of no group cannot be written`);
  return writes.rule(flag[1], flag[2], on);
};

type SectionId =
  | "groups"
  | "thread-rules"
  | "sources"
  | "topics"
  | "issuers"
  | "digests"
  | "notifications"
  | "ai"
  | "accounts";

/**
 * A section's tab: a 32px row with the 12px radius and an edge all round in place of the kit's
 * side line; the kit colours the selected one's edge and text, and the tint is added here.
 */
const SECTION_TAB = "min-h-8 rounded-ds-md! border px-2.5 py-1 text-small font-medium";

const SECTIONS: { id: SectionId; name: string; reader: boolean }[] = [
  { id: "groups", name: "Groups", reader: false },
  { id: "thread-rules", name: "Thread rules", reader: false },
  { id: "sources", name: "Sources", reader: false },
  { id: "topics", name: "Topics", reader: true },
  { id: "issuers", name: "Issuers", reader: false },
  { id: "digests", name: "Digests", reader: false },
  { id: "notifications", name: "Notifications", reader: true },
  { id: "ai", name: "AI and cost", reader: false },
  { id: "accounts", name: "Accounts", reader: false },
];

export function SettingsPage({
  scene,
  section,
  writer,
  state,
}: {
  scene: SignalScene;
  /** The address's section segment: any word; an unknown one gets a stated state. */
  section: string;
  writer: boolean;
  /** An empty state with this title (the page's own, so every Signal page states itself alike). */
  state: (title: string) => ReactNode;
}) {
  const { settings } = scene.snapshot;
  const page = usePageWrite();
  const signalActions = useSignalActions();
  const { profileType } = useSignalViewer();
  // The page says a refusal itself, so the switch only needs to go back.
  const flags = useChoices(
    page === null ? null : (key, on) => page.send(flagWrite(key, on)),
    () => undefined,
  );
  // A service keeps the thread rules by group; so does a sample whose groups carry their own.
  const rulesByGroup = page !== null || settings.groups.some((group) => group.rules !== null);
  const [typed, setTyped] = useState<ReadonlyMap<string, string>>(new Map());
  const [visible, setVisible] = useState<ReadonlyMap<string, string>>(new Map());
  const see = (groupId: string, value: string) => {
    setVisible(new Map(visible).set(groupId, value));
    if (page === null) return;
    const back = () => {
      setVisible((held) => new Map([...held].filter(([id]) => id !== groupId)));
    };
    const word = VISIBILITY.find((v) => v.label === value)?.key;
    if (word === undefined) {
      // A choice the service has no word for is not kept on the page as if it were saved.
      back();
      page.note("This choice cannot be saved from this page.");
      return;
    }
    // Answered, the slice says who can see the group: as written, or as before a refusal.
    void page.send(writes.visibility(groupId, word)).then(back);
  };
  const live = page !== null;
  const authenticatedProfile = live && profileType !== undefined;
  const allowed = (s: (typeof SECTIONS)[number]) =>
    s.id === "accounts"
      ? authenticatedProfile
      : writer ||
        s.reader ||
        (live && s.id === "digests") ||
        (authenticatedProfile && s.id === "sources");
  // A snapshot that says nothing of issuers has no Issuers section, for anyone.
  const held = SECTIONS.filter((s) => s.id !== "issuers" || settings.issuers !== null);
  const listed = held.filter(allowed);
  const current = held.find((s) => s.id === section);

  function content(): ReactNode {
    if (current === undefined) return state("No such settings section");
    if (!allowed(current)) return state("This section is for writers");
    switch (current.id) {
      case "groups":
        return (
          <GroupsSection
            groups={settings.groups}
            topics={settings.topics}
            topicsHref={sceneHref(scene, "settings/topics")}
            visibility={(g) => visible.get(g.id) ?? g.visibility}
            onVisibility={(g, value) => {
              see(g.id, value);
            }}
          />
        );
      case "thread-rules":
        return (
          <RulesSection
            rules={settings.rules}
            groups={rulesByGroup ? settings.groups : null}
            groupsHref={sceneHref(scene, "settings/groups")}
            on={(r, g) => flags.on(flagKey(["rule", g?.id ?? null, r.id]), r.on)}
            onChange={(r, g) => {
              flags.toggle(flagKey(["rule", g?.id ?? null, r.id]), r.on);
            }}
          />
        );
      case "notifications":
        return (
          <NotificationsSection
            desktop={!live}
            events={settings.notifications.events}
            on={(e, channel) => flags.on(flagKey(["event", e.id, channel]), e[channel])}
            onChange={(e, channel) => {
              flags.toggle(flagKey(["event", e.id, channel]), e[channel]);
            }}
          />
        );
      case "sources":
        return (
          <SourcesSection
            sources={settings.sources}
            weeksHeading={settings.sourceWeeksHeading}
            more={settings.sourcesMore}
            writer={writer}
          />
        );
      case "accounts":
        if (!live || profileType === undefined)
          return state("Accounts require a signed-in profile");
        return (
          <AccountsSection
            profileType={profileType}
            onPermissionsChanged={() => signalActions?.refresh()}
          />
        );
      case "topics":
        return <TopicsSection topics={settings.topics} writer={writer} />;
      case "issuers":
        return (
          <IssuersSection
            issuers={settings.issuers ?? []}
            filings={settings.filings?.note ?? null}
          />
        );
      case "digests": {
        const form = settings.digestForm;
        const field = (key: string, delivered: string) => typed.get(key) ?? delivered;
        return (
          <DigestsSection
            form={form}
            value={{
              name: field("name", form.name),
              covers: field("covers", form.covers),
              schedule: field("schedule", form.schedule),
              length: field("length", form.length),
              brief: field("brief", form.brief),
            }}
            onChange={(key, text) => {
              setTyped(new Map(typed).set(key, text));
            }}
            digests={scene.snapshot.digests}
            editing={typed.get("editing") ?? null}
            onEdit={(edit) => {
              setTyped(
                edit === null
                  ? new Map()
                  : new Map([...Object.entries(edit.value), ["editing", edit.id]]),
              );
            }}
          />
        );
      }
      case "ai":
        return <AiSection ai={settings.ai} />;
    }
  }

  // A section the viewer can open has a tab panel the selected tab names; any other address selects no
  // tab, so its sentence stands outside a panel.
  const open = current !== undefined && listed.includes(current) ? current : undefined;
  return (
    <>
      <PageTitle>Settings</PageTitle>
      <Tabs
        orientation="vertical"
        selectedKey={open === undefined ? "" : open.id}
        className="mt-5 grid grid-cols-1 gap-y-4 xl:grid-cols-[200px_minmax(0,1fr)] xl:gap-x-4"
      >
        <TabList
          aria-label="Settings sections"
          orientation="vertical"
          type="line"
          size="sm"
          className="w-full flex-row flex-wrap gap-1 xl:flex-col xl:flex-nowrap"
        >
          {listed.map((s) => (
            <Tab
              key={s.id}
              id={s.id}
              href={sceneHref(scene, `settings/${s.id}`)}
              className={({ isSelected }) => cx(SECTION_TAB, isSelected && "bg-surface-selected")}
            >
              {s.name}
            </Tab>
          ))}
        </TabList>
        {open === undefined ? (
          <div className="min-w-0">{content()}</div>
        ) : (
          <TabPanel key={open.id} id={open.id} className="min-w-0">
            {content()}
          </TabPanel>
        )}
      </Tabs>
    </>
  );
}
