// Settings, Thread rules (mock settings frame 2): one switch per rule with its label and hint.
// The sample's rules are the mock's examples (mock question 11), one list for every group; a switch
// there changes in memory only. A service keeps the rules by group: each group that carries its own
// is a block under the group's name, and a switch is written to that group.
import { useId } from "react";
import type { SignalSettingsGroup, SignalSettingsRule } from "../slice";
import { Toggle } from "../parts/Toggle";
import { Section } from "./Section";

/** The group a rule belongs to; null for the sample's one list. */
type Owner = SignalSettingsGroup | null;
type Switches = {
  on: (rule: SignalSettingsRule, group: Owner) => boolean;
  onChange: (rule: SignalSettingsRule, group: Owner) => void;
};

function RuleList({
  rules,
  group,
  on,
  onChange,
}: { rules: SignalSettingsRule[]; group: Owner } & Switches) {
  return (
    <ul className="flex flex-col gap-3">
      {rules.map((rule) => (
        <li key={rule.id}>
          <Toggle
            label={rule.label}
            hint={rule.hint}
            isSelected={on(rule, group)}
            onChange={() => {
              onChange(rule, group);
            }}
          />
        </li>
      ))}
    </ul>
  );
}

/** One group's rules under its name; the name also names the group of switches. */
function GroupRules({
  group,
  rules,
  ...switches
}: { group: SignalSettingsGroup; rules: SignalSettingsRule[] } & Switches) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="border-t border-border-hairline py-5">
      <h3 id={id} className="mb-3 text-body font-semibold text-text-primary">
        {group.name}
      </h3>
      {rules.length === 0 ? (
        <p className="text-small text-text-tertiary">No thread rules yet.</p>
      ) : (
        <RuleList rules={rules} group={group} {...switches} />
      )}
    </div>
  );
}

export function RulesSection({
  rules,
  groups,
  groupsHref,
  ...switches
}: {
  /** The sample's one list, for every group. */
  rules: SignalSettingsRule[];
  /** The groups, where the rules are each group's own; null where they are the one list. */
  groups: SignalSettingsGroup[] | null;
  /** Settings, Groups: where a group is made. */
  groupsHref: string;
} & Switches) {
  if (groups === null) {
    return (
      <Section title="Thread rules" hint="These apply to every group.">
        {rules.length === 0 ? (
          <p className="text-small text-text-tertiary">No thread rules yet.</p>
        ) : (
          <RuleList rules={rules} group={null} {...switches} />
        )}
      </Section>
    );
  }
  const own = groups.flatMap((group) =>
    group.rules === null ? [] : [{ group, rules: group.rules }],
  );
  return (
    <Section title="Thread rules">
      {groups.length === 0 ? (
        <p className="text-small text-text-tertiary">
          No groups yet. Thread rules are set for each group.{" "}
          <a
            href={groupsHref}
            className="font-semibold text-text-link underline-offset-2 outline-focus-ring hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Open Groups
          </a>
        </p>
      ) : own.length === 0 ? (
        <p className="text-small text-text-tertiary">No thread rules yet.</p>
      ) : (
        <div>
          {own.map(({ group, rules: held }) => (
            <GroupRules key={group.id} group={group} rules={held} {...switches} />
          ))}
        </div>
      )}
    </Section>
  );
}
