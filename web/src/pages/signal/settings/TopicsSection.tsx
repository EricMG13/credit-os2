// Settings, Topics (mock settings frame 4): each topic a row with its name and "N stories this
// week", its keywords as tags and the kinds it takes as tags. A topic with no keywords takes every
// story of its kinds, and says so. New topic and Edit write: in the sample a writer sees them
// disabled with the reason in view; on a service each opens the topic's form (Edit can also delete
// the topic). A reader sees the topics and no write control (ruling 18).
import { useState } from "react";
import { Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Tags } from "../parts/Tags";
import type { SignalSettingsTopic } from "../slice";
import { useSignalActions } from "../actions";
import { useOpener } from "../parts/focus";
import { FormDialog, type FormField, type FormValues } from "../parts/FormDialog";
import { KINDS, writes, type TopicRule } from "../writes";
import { Section } from "./Section";
import { SampleReason, useSampleOff } from "./SampleReason";

const REASON_ID = "signal-topics-write-reason";

/**
 * The kinds switched on in a topic's form. A topic of no kinds is delivered with every kind it
 * takes, and those hold one a writer cannot choose (filings): its form starts with none switched
 * on, so saving it keeps it a topic of every kind.
 */
function chosenKinds(topic: SignalSettingsTopic | null): readonly string[] {
  const kinds = topic?.kinds ?? [];
  return kinds.every((kind) => KINDS.some((k) => k.label === kind)) ? kinds : [];
}

function fieldsFor(topic: SignalSettingsTopic | null): FormField[] {
  return [
    {
      key: "name",
      kind: "text",
      label: "Name",
      value: topic?.name,
      missing: "Enter the topic's name.",
    },
    {
      key: "keywords",
      kind: "text",
      label: "Keywords",
      hint: "Separate keywords with commas. With none, the topic takes every story of its kinds.",
      value: topic?.keywords.join(", "),
    },
    {
      key: "kinds",
      kind: "switches",
      label: "Kinds of story",
      hint: "With none switched on, the topic takes every kind, filings included.",
      options: KINDS.map((k) => k.label),
      value: chosenKinds(topic),
    },
  ];
}

function ruleOf({ text, chosen }: FormValues): TopicRule {
  const words = (text["keywords"] ?? "").split(",").map((word) => word.trim());
  return {
    name: (text["name"] ?? "").trim(),
    keywords: words.filter((word) => word !== ""),
    kinds: KINDS.filter((k) => chosen["kinds"]?.includes(k.label)).map((k) => k.key),
  };
}

/** The form a service's New topic and Edit open; `topic` null adds one. */
function TopicForm({
  open,
  topic,
  onClose,
  onGone,
}: {
  open: boolean;
  topic: SignalSettingsTopic | null;
  onClose: () => void;
  onGone: () => void;
}) {
  const actions = useSignalActions();
  if (actions === null) return null;
  const refusal = (answer: { refusal: string | null }) => answer.refusal;
  return (
    <FormDialog
      open={open}
      title={topic === null ? "New topic" : `Edit ${topic.name}`}
      fields={fieldsFor(topic)}
      action={topic === null ? "Add topic" : "Save topic"}
      onSend={(values) =>
        actions.write(writes.topic(topic?.id ?? null, ruleOf(values))).then(refusal)
      }
      other={
        topic === null
          ? undefined
          : {
              label: "Delete topic",
              onSend: () => actions.write(writes.dropTopic(topic.id)).then(refusal),
            }
      }
      onClose={onClose}
      onGone={onGone}
    />
  );
}

function Row({
  topic,
  writer,
  onEdit,
}: {
  topic: SignalSettingsTopic;
  writer: boolean;
  onEdit: () => void;
}) {
  const off = useSampleOff(REASON_ID);
  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-2 border-t border-border-hairline py-4">
      <div className="w-40 shrink-0">
        <b className="block text-body font-semibold text-text-primary">{topic.name}</b>
        <small className="block text-small text-text-tertiary">{topic.weekly}</small>
      </div>
      <div className="grid min-w-48 flex-1 gap-2">
        {topic.keywords.length === 0 ? (
          <span className="text-small text-text-tertiary">
            No keywords: every story of this kind
          </span>
        ) : (
          <Tags tags={topic.keywords} label={`Keywords: ${topic.name}`} />
        )}
        <Tags tags={topic.kinds} label={`Kinds: ${topic.name}`} />
      </div>
      {writer ? (
        <Button color="tertiary" aria-label={`Edit: ${topic.name}`} {...off} onPress={onEdit}>
          Edit
        </Button>
      ) : null}
    </li>
  );
}

export function TopicsSection({
  topics,
  writer,
}: {
  topics: SignalSettingsTopic[];
  writer: boolean;
}) {
  const off = useSampleOff(REASON_ID);
  const opener = useOpener();
  // Which form is open: a topic's id, "new", or none. The topic stays named while the dialog leaves.
  const [form, setForm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const open = (id: string | null) => {
    opener.remember();
    setForm({ open: true, id });
  };
  return (
    <Section
      title="Topics"
      hint="A story joins a topic when its headline or summary carries one of the keywords."
      action={
        writer ? (
          <Button
            color="primary"
            iconLeading={Plus}
            {...off}
            onPress={() => {
              open(null);
            }}
          >
            New topic
          </Button>
        ) : undefined
      }
    >
      {writer ? (
        <SampleReason id={REASON_ID}>Sample data: topics cannot be changed here.</SampleReason>
      ) : null}
      {writer ? (
        <TopicForm
          key={form.id ?? "new"}
          open={form.open}
          topic={topics.find((topic) => topic.id === form.id) ?? null}
          onClose={() => {
            setForm({ ...form, open: false });
          }}
          onGone={opener.restore}
        />
      ) : null}
      {topics.length === 0 ? (
        <p className="text-small text-text-tertiary">No topics yet</p>
      ) : (
        <ul>
          {topics.map((topic) => (
            <Row
              key={topic.id}
              topic={topic}
              writer={writer}
              onEdit={() => {
                open(topic.id);
              }}
            />
          ))}
        </ul>
      )}
    </Section>
  );
}
