import { useId, type ReactNode } from "react";
import { StatusBadge } from "@/components/status/StatusBadge";
import type { RecordBlock } from "../slice";
import { InlineCell } from "./InlineCell";
import { Section } from "./Section";
import { SUBSECTION_HEADING } from "./heading";
import { TRACE_HOST, TraceControl } from "./TraceControl";

type Group = Extract<RecordBlock, { kind: "status" }>["groups"][number];
type StatusGroup = {
  label: string;
  badge: ReactNode;
  count?: string;
  items: Group["items"];
  hideEmptyValue?: boolean;
};

/** One group, in its state's word and shape, with the delivered count: a band, then a card for each test. */
function TestGroup({ group }: { group: StatusGroup }) {
  const headId = useId();
  return (
    <div
      role="group"
      aria-labelledby={headId}
      className="overflow-hidden rounded-lg bg-surface-subtle"
    >
      <div id={headId} className="flex items-center gap-2 bg-border-strong/5 p-3">
        {group.badge}
        {group.count !== undefined && (
          <span className="rounded-ds-full bg-surface-subtle px-2 py-0.5 text-caption font-medium text-text-secondary tabular-nums ring-1 ring-border-hairline ring-inset">
            {group.count}
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-2 p-3">
        {group.items.map((item, index) => (
          <li
            key={group.hideEmptyValue ? `${item.text}-${String(index)}` : item.text}
            className={`${TRACE_HOST} flex flex-wrap items-center gap-2 rounded-lg border border-border-hairline bg-surface-card p-2 text-sm font-medium text-text-primary shadow-xs`}
          >
            {item.text}
            <div className="ml-auto flex items-center gap-2 font-normal text-text-secondary tabular-nums">
              {(!group.hideEmptyValue || item.value !== null) && <InlineCell cell={item.value} />}
              <TraceControl
                trace={item.trace}
                label={
                  group.hideEmptyValue
                    ? `Show sources for ${item.text}`
                    : "Show sources for this test"
                }
              />
            </div>
            {item.note === null ? null : (
              <p className="basis-full text-caption font-normal text-text-tertiary">{item.note}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tests met or not met (R6): a list for each state, in the order delivered, the state never by colour alone. */
export function StatusGroups({ title, groups }: { title: string; groups: StatusGroup[] }) {
  return (
    <Section title={title} level={SUBSECTION_HEADING}>
      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <TestGroup key={group.label} group={group} />
        ))}
      </div>
    </Section>
  );
}

export function StatusBlock({ block }: { block: Extract<RecordBlock, { kind: "status" }> }) {
  return (
    <StatusGroups
      title={block.title}
      groups={block.groups.map((group) => ({
        ...group,
        label: group.state,
        badge: <StatusBadge set="Met or not met" state={group.state} />,
      }))}
    />
  );
}
