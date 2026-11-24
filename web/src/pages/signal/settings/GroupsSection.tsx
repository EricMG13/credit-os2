// Settings, Groups (mock settings frame 1): each group a row with its avatar and member line, its
// members' avatars (or "Add a member to start"), a Select for who can see it, and Edit members.
// In the sample the visibility is changed in memory only, and New group and Edit members, which
// would write, are disabled with the reason in view. On a service the visibility is written, each
// of the two opens a form, and a row also has Rename and Delete, and Topics where the service says
// which topics post their new stories into the group (the row then lists them).
import { useState, type ReactNode } from "react";
import { Plus, Users01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { AvatarLabelGroup } from "../parts/Avatar";
import { AvatarGroup } from "../parts/AvatarGroup";
import { Tags } from "../parts/Tags";
import type { SignalSettingsGroup, SignalSettingsTopic } from "../slice";
import { useSignalActions } from "../actions";
import { useOpener } from "../parts/focus";
import { FormDialog, type FormField, type FormValues } from "../parts/FormDialog";
import { VISIBILITY, writes } from "../writes";
import { Section } from "./Section";
import { SampleReason, useSampleOff } from "./SampleReason";

const REASON_ID = "signal-groups-write-reason";
const LINK =
  "inline-flex min-h-6 items-center font-semibold text-text-link outline-focus-ring focus-visible:outline-2";

const NEW_GROUP: readonly FormField[] = [
  { key: "name", kind: "text", label: "Name", missing: "Enter the group's name." },
  {
    key: "visibility",
    kind: "choice",
    label: "Who can see it",
    options: VISIBILITY.map((v) => v.label),
    value: VISIBILITY[0].label,
  },
];
const MEMBERS: readonly FormField[] = [
  { key: "add", kind: "text", label: "Add a member", hint: "The display name they use in Signal." },
  { key: "remove", kind: "text", label: "Remove a member", hint: "The member's display name." },
];

/** What a form is for: a new group (no group), or one of a group's own. */
type Purpose = "members" | "rename" | "delete" | "topics";
type Form = { open: boolean; group: SignalSettingsGroup | null; purpose: Purpose };
type Sent = Promise<string | null>;
/** The parts of the form dialog that differ by purpose. */
type FormParts = {
  title: string;
  intro?: ReactNode;
  fields: readonly FormField[];
  action?: string;
  destructive?: boolean;
  send: (values: FormValues) => Sent;
};

const typed = (values: FormValues, key: string) => (values.text[key] ?? "").trim();

/** Which topics post their new stories into the group: every topic by name, the group's own switched on. */
function topicsForm(
  group: SignalSettingsGroup,
  topics: SignalSettingsTopic[],
  topicsHref: string,
  send: (ids: string[]) => Sent,
): FormParts {
  const title = `Topics for ${group.name}`;
  if (topics.length === 0) {
    return {
      title,
      intro: (
        <>
          No topics yet. A topic is made in Settings, Topics.{" "}
          <a href={topicsHref} className={LINK}>
            Open Topics
          </a>
        </>
      ),
      fields: [],
      send: () => Promise.resolve(null),
    };
  }
  const held = new Set(group.topics ?? []);
  return {
    title,
    fields: [
      {
        key: "topics",
        kind: "switches",
        label: "Topics",
        options: topics.map((topic) => topic.name),
        value: topics.filter((topic) => held.has(topic.id)).map((topic) => topic.name),
        hint: "New stories of the topics switched on are posted into the group as threads from then on. Stories already stored are not posted.",
      },
    ],
    action: "Save",
    send: ({ chosen }) => {
      const names = chosen["topics"] ?? [];
      return send(topics.filter((topic) => names.includes(topic.name)).map((topic) => topic.id));
    },
  };
}

/** The form a service's New group (`group` null) and a row's Edit members, Topics, Rename and Delete open. */
function GroupForm({
  form,
  topics,
  topicsHref,
  onClose,
  onGone,
}: {
  form: Form;
  topics: SignalSettingsTopic[];
  topicsHref: string;
  onClose: () => void;
  onGone: () => void;
}) {
  const actions = useSignalActions();
  if (actions === null) return null;
  const { group, purpose } = form;
  const sent = (request: Parameters<typeof actions.write>[0]): Sent =>
    actions.write(request).then((answer) => answer.refusal);
  // A member added and a member removed are two writes; the second is not sent if the first is refused.
  const members = async (groupId: string, add: string, remove: string) => {
    if (add === "" && remove === "") return "Enter a name to add or to remove.";
    const added = add === "" ? null : await sent(writes.member(groupId, add, true));
    if (added !== null || remove === "") return added;
    return sent(writes.member(groupId, remove, false));
  };
  const parts = (): FormParts => {
    if (group === null) {
      return {
        title: "New group",
        fields: NEW_GROUP,
        action: "Add group",
        send: (values) => {
          const seen =
            VISIBILITY.find((v) => v.label === values.text["visibility"])?.key ?? "everyone";
          return sent(writes.group(typed(values, "name"), seen));
        },
      };
    }
    switch (purpose) {
      case "members":
        return {
          title: `Members of ${group.name}`,
          intro: group.memberSummary,
          fields: MEMBERS,
          action: "Save members",
          send: (values) => members(group.id, typed(values, "add"), typed(values, "remove")),
        };
      case "rename":
        return {
          title: `Rename ${group.name}`,
          fields: [
            {
              key: "name",
              kind: "text",
              label: "Name",
              value: group.name,
              missing: "Enter the group's name.",
            },
          ],
          action: "Rename group",
          send: (values) => sent(writes.renameGroup(group.id, typed(values, "name"))),
        };
      case "delete":
        return {
          title: `Delete ${group.name}?`,
          intro: "The group is deleted for everyone. This cannot be undone.",
          fields: [],
          action: "Delete group",
          destructive: true,
          send: () => sent(writes.dropGroup(group.id)),
        };
      case "topics":
        return topicsForm(group, topics, topicsHref, (ids) =>
          sent(writes.groupTopics(group.id, ids)),
        );
    }
  };
  const { send, ...drawn } = parts();
  return <FormDialog open={form.open} {...drawn} onSend={send} onClose={onClose} onGone={onGone} />;
}

/** The topics that post into the group, by name, in Settings' order; none where the group has none. */
function PostsFrom({
  group,
  topics,
}: {
  group: SignalSettingsGroup;
  topics: SignalSettingsTopic[];
}) {
  const held = new Set(group.topics ?? []);
  const names = topics.filter((topic) => held.has(topic.id)).map((topic) => topic.name);
  if (names.length === 0) return null;
  return (
    <div className="flex basis-full flex-wrap items-center gap-2 text-sm text-text-tertiary">
      <span>Posts from</span>
      <Tags tags={names} label={`Topics posted into ${group.name}`} />
    </div>
  );
}

function Row({
  group,
  topics,
  visibility,
  onVisibility,
  onOpen,
}: {
  group: SignalSettingsGroup;
  topics: SignalSettingsTopic[];
  visibility: string;
  onVisibility: (value: string) => void;
  onOpen: (purpose: Purpose) => void;
}) {
  const off = useSampleOff(REASON_ID);
  const live = useSignalActions() !== null;
  // On a service only: the sample has nothing to write to, and draws no control that would.
  const more: [Purpose, string][] = [
    ["topics", "Topics"],
    ["rename", "Rename"],
    ["delete", "Delete"],
  ];
  const offered = more.filter(
    ([purpose]) => live && (purpose !== "topics" || group.topics !== null),
  );
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border-hairline py-4">
      <div className="min-w-48 flex-1">
        <AvatarLabelGroup
          size="md"
          initials={null}
          icon={Users01}
          title={group.name}
          subtitle={group.memberSummary}
        />
      </div>
      {group.members.length === 0 ? (
        <span className="text-sm text-text-tertiary">Add a member to start</span>
      ) : (
        <>
          <AvatarGroup monograms={group.members.map((m) => m.initials)} more={group.moreMembers} />
          <ul aria-label={`Members of ${group.name}`} className="sr-only">
            {group.members.map((m) => (
              <li key={m.name}>{m.name}</li>
            ))}
          </ul>
        </>
      )}
      <Select
        aria-label={`Visibility: ${group.name}`}
        className="w-50"
        items={group.visibilityOptions.map((id) => ({ id, label: id }))}
        value={visibility}
        onChange={(key) => {
          onVisibility(String(key));
        }}
      >
        {(item) => <Select.Item id={item.id} label={item.label} />}
      </Select>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
        <Button
          color="tertiary"
          aria-label={`Edit members: ${group.name}`}
          {...off}
          onPress={() => {
            onOpen("members");
          }}
        >
          Edit members
        </Button>
        {offered.map(([purpose, word]) => (
          <Button
            key={purpose}
            color="tertiary"
            aria-label={`${word}: ${group.name}`}
            onPress={() => {
              onOpen(purpose);
            }}
          >
            {word}
          </Button>
        ))}
      </div>
      {live ? <PostsFrom group={group} topics={topics} /> : null}
    </li>
  );
}

export function GroupsSection({
  groups,
  topics,
  topicsHref,
  visibility,
  onVisibility,
}: {
  groups: SignalSettingsGroup[];
  /** Settings' topics, which a group's Topics form lists by name. */
  topics: SignalSettingsTopic[];
  /** Settings, Topics: where a topic is made. */
  topicsHref: string;
  visibility: (group: SignalSettingsGroup) => string;
  onVisibility: (group: SignalSettingsGroup, value: string) => void;
}) {
  const off = useSampleOff(REASON_ID);
  const opener = useOpener();
  const [form, setForm] = useState<Form>({ open: false, group: null, purpose: "members" });
  const open = (group: SignalSettingsGroup | null, purpose: Purpose = "members") => {
    opener.remember();
    setForm({ open: true, group, purpose });
  };
  return (
    <Section
      title="Groups"
      hint="A group has a thread for every story shared to it."
      action={
        <Button
          color="primary"
          iconLeading={Plus}
          {...off}
          onPress={() => {
            open(null);
          }}
        >
          New group
        </Button>
      }
    >
      <SampleReason id={REASON_ID}>
        Sample data: groups and their members cannot be changed here.
      </SampleReason>
      <GroupForm
        key={form.group === null ? "new" : `${form.purpose} ${form.group.id}`}
        form={form}
        topics={topics}
        topicsHref={topicsHref}
        onClose={() => {
          setForm({ ...form, open: false });
        }}
        onGone={opener.restore}
      />
      {groups.length === 0 ? (
        <p className="text-sm text-text-tertiary">No groups yet.</p>
      ) : (
        <ul>
          {groups.map((group) => (
            <Row
              key={group.id}
              group={group}
              topics={topics}
              visibility={visibility(group)}
              onVisibility={(value) => {
                onVisibility(group, value);
              }}
              onOpen={(purpose) => {
                open(group, purpose);
              }}
            />
          ))}
        </ul>
      )}
    </Section>
  );
}
