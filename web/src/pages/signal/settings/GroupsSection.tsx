// Settings, Groups (mock settings frame 1): each group a row with its avatar and member line, its
// members' avatars (or "Add a member to start"), a Select for who can see it, and Edit members.
// In the sample the visibility is changed in memory only, and New group and Edit members, which
// would write, are disabled with the reason in view. On a service the visibility is written, and
// each of the two opens a form.
import { useState } from "react";
import { Plus, Users01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { AvatarLabelGroup } from "../parts/Avatar";
import { AvatarGroup } from "../parts/AvatarGroup";
import type { SignalSettingsGroup } from "../slice";
import { useSignalActions } from "../actions";
import { useOpener } from "../parts/focus";
import { FormDialog, type FormField } from "../parts/FormDialog";
import { VISIBILITY, writes } from "../writes";
import { Section } from "./Section";
import { SampleReason, useSampleOff } from "./SampleReason";

const REASON_ID = "signal-groups-write-reason";

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

type Form = { open: boolean; group: SignalSettingsGroup | null };

/** The form a service's New group (`group` null) and Edit members open. */
function GroupForm({
  form,
  onClose,
  onGone,
}: {
  form: Form;
  onClose: () => void;
  onGone: () => void;
}) {
  const actions = useSignalActions();
  if (actions === null) return null;
  const { group } = form;
  const refusal = (answer: { refusal: string | null }) => answer.refusal;
  // A member added and a member removed are two writes; the second is not sent if the first is refused.
  const members = async (groupId: string, add: string, remove: string) => {
    if (add === "" && remove === "") return "Enter a name to add or to remove.";
    const added =
      add === "" ? null : await actions.write(writes.member(groupId, add, true)).then(refusal);
    if (added !== null || remove === "") return added;
    return actions.write(writes.member(groupId, remove, false)).then(refusal);
  };
  return (
    <FormDialog
      open={form.open}
      title={group === null ? "New group" : `Members of ${group.name}`}
      intro={group === null ? undefined : group.memberSummary}
      fields={group === null ? NEW_GROUP : MEMBERS}
      action={group === null ? "Add group" : "Save members"}
      onSend={({ text }) => {
        if (group !== null) {
          return members(group.id, (text["add"] ?? "").trim(), (text["remove"] ?? "").trim());
        }
        const seen = VISIBILITY.find((v) => v.label === text["visibility"])?.key ?? "everyone";
        return actions.write(writes.group((text["name"] ?? "").trim(), seen)).then(refusal);
      }}
      onClose={onClose}
      onGone={onGone}
    />
  );
}

function Row({
  group,
  visibility,
  onVisibility,
  onMembers,
}: {
  group: SignalSettingsGroup;
  visibility: string;
  onVisibility: (value: string) => void;
  onMembers: () => void;
}) {
  const off = useSampleOff(REASON_ID);
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
      <Button
        color="tertiary"
        aria-label={`Edit members: ${group.name}`}
        {...off}
        onPress={onMembers}
      >
        Edit members
      </Button>
    </li>
  );
}

export function GroupsSection({
  groups,
  visibility,
  onVisibility,
}: {
  groups: SignalSettingsGroup[];
  visibility: (group: SignalSettingsGroup) => string;
  onVisibility: (group: SignalSettingsGroup, value: string) => void;
}) {
  const off = useSampleOff(REASON_ID);
  const opener = useOpener();
  const [form, setForm] = useState<Form>({ open: false, group: null });
  const open = (group: SignalSettingsGroup | null) => {
    opener.remember();
    setForm({ open: true, group });
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
        key={form.group?.id ?? "new"}
        form={form}
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
              visibility={visibility(group)}
              onVisibility={(value) => {
                onVisibility(group, value);
              }}
              onMembers={() => {
                open(group);
              }}
            />
          ))}
        </ul>
      )}
    </Section>
  );
}
