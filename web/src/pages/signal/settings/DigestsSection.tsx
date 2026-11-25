// Settings, Digests (mock settings frame 5): the digest form: its name, what it covers, its
// schedule, its length and a brief. Every field is edited in memory. Save and Run once now would
// write or call a paid model (decision 0006 ruling 21, decision 0003 ruling 9), so they are
// disabled with the reason in view; the frame labels them "Save digest" and "Run once now".
// On a service the form adds a digest or changes one of the viewer's, which are listed above it
// with Run once now, Edit and Delete; what a run did is the service's own sentence. No model is
// called by the page: the service decides, and says, whether an issue was written.
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { usePageWrite, type SignalPageWrite } from "../actions";
import { TextArea } from "../parts/TextArea";
import type { SignalDigest, SignalDigestForm } from "../slice";
import { writes } from "../writes";
import { Section } from "./Section";

const SAVE_ID = "signal-digest-save-reason";
const RUN_ID = "signal-digest-run-reason";

function Choice({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      label={label}
      hint={hint}
      items={options.map((id) => ({ id, label: id }))}
      value={value}
      onChange={(key) => {
        onChange(String(key));
      }}
    >
      {(item) => <Select.Item id={item.id} label={item.label} />}
    </Select>
  );
}

type Value = Record<"name" | "covers" | "schedule" | "length" | "brief", string>;
/** A digest whose values the form takes, or null for a new one. */
type Edit = { id: string; value: Partial<Value> } | null;

/** The form's values for a digest: each delivered string the form can show (a choice must be one it offers). */
function valueOf(digest: SignalDigest, form: SignalDigestForm): Partial<Value> {
  const held = digest.form ?? {};
  const covers: unknown = Array.isArray(held["covers"]) ? held["covers"][0] : held["covers"];
  const picked = (value: unknown, options: string[]) =>
    typeof value === "string" && options.includes(value) ? value : undefined;
  const value: Partial<Value> = { name: digest.name };
  const set = (key: keyof Value, text: string | undefined) => {
    if (text !== undefined) value[key] = text;
  };
  set("covers", picked(covers, form.coversOptions));
  set("schedule", picked(held["schedule"], form.scheduleOptions));
  set("length", picked(held["length"], form.lengthOptions));
  set("brief", typeof held["brief"] === "string" ? held["brief"] : undefined);
  return value;
}

/** What Save posts: the form's strings over what the service delivered for the digest, which goes back unchanged. */
function bodyOf(edited: SignalDigest | null, value: Value): Record<string, unknown> {
  const held = edited?.form ?? {};
  const list: unknown = held["covers"];
  // The form shows one choice; a digest that covers several keeps them unless another is chosen.
  const several = Array.isArray(list) && list.length > 1 && list[0] === value.covers;
  return { ...held, ...value, name: value.name.trim(), covers: several ? list : value.covers };
}

/** The viewer's digests on a service, each with what can be done to it. */
function DigestList({
  digests,
  page,
  editing,
  onEdit,
  form,
}: {
  digests: SignalDigest[];
  page: SignalPageWrite;
  editing: string | null;
  onEdit: (edit: Edit) => void;
  form: SignalDigestForm;
}) {
  if (digests.length === 0) return <p className="text-small text-text-tertiary">No digests yet.</p>;
  const run = (digest: SignalDigest) => {
    void page.send(writes.runDigest(digest.id)).then(({ reply }) => {
      const message = (reply as { message?: unknown } | null)?.message;
      if (typeof message === "string") page.note(message);
    });
  };
  const drop = (digest: SignalDigest) => {
    void page.send(writes.dropDigest(digest.id)).then(({ refusal }) => {
      if (refusal === null && editing === digest.id) onEdit(null);
    });
  };
  return (
    <ul aria-label="Your digests">
      {digests.map((digest) => (
        <li
          key={digest.id}
          className="flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-border-hairline py-4"
        >
          <div className="min-w-48 flex-1">
            <b className="block text-body font-semibold text-text-primary">{digest.name}</b>
            {digest.paused === null ? null : (
              <small className="block text-small text-text-tertiary">{digest.paused}</small>
            )}
          </div>
          <Button
            color="tertiary"
            aria-label={`Run once now: ${digest.name}`}
            onPress={() => {
              run(digest);
            }}
          >
            Run once now
          </Button>
          <Button
            color="tertiary"
            aria-label={`Edit: ${digest.name}`}
            onPress={() => {
              onEdit({ id: digest.id, value: valueOf(digest, form) });
            }}
          >
            Edit
          </Button>
          <Button
            color="tertiary"
            aria-label={`Delete: ${digest.name}`}
            onPress={() => {
              drop(digest);
            }}
          >
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** Under the form: the sample's two disabled actions with their reasons, or a service's Save. */
function FormActions({
  page,
  editing,
  onSave,
  onCancel,
}: {
  page: SignalPageWrite | null;
  editing: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (page !== null) {
    return (
      <div className="flex flex-wrap justify-end gap-3">
        {editing ? (
          <Button color="secondary" onPress={onCancel}>
            Cancel edit
          </Button>
        ) : null}
        <Button color="primary" onPress={onSave}>
          Save digest
        </Button>
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-wrap justify-end gap-3">
        <Button color="secondary" isDisabled aria-describedby={RUN_ID}>
          Run once now
        </Button>
        <Button color="primary" isDisabled aria-describedby={SAVE_ID}>
          Save digest
        </Button>
      </div>
      <p id={RUN_ID} className="text-small text-text-tertiary">
        Running a digest calls a paid model. It stays off until the owner sets a cap.
      </p>
      <p id={SAVE_ID} className="-mt-3 text-small text-text-tertiary">
        Sample data: digests cannot be saved here.
      </p>
    </>
  );
}

export function DigestsSection({
  form,
  value,
  onChange,
  digests,
  editing,
  onEdit,
}: {
  form: SignalDigestForm;
  /** The form's current values (the delivered ones until a field is edited). */
  value: Value;
  onChange: (field: keyof Value, text: string) => void;
  /** The viewer's digests, listed on a service. */
  digests: SignalDigest[];
  /** The id of the digest the form is changing; null while it holds a new one. */
  editing: string | null;
  onEdit: (edit: Edit) => void;
}) {
  const page = usePageWrite();
  const edited = digests.find((digest) => digest.id === editing) ?? null;
  const save = () => {
    void page?.send(writes.digest(edited?.id ?? null, bodyOf(edited, value))).then((answer) => {
      if (answer.refusal === null) onEdit(null);
    });
  };
  return (
    <Section
      title={edited === null ? form.name : `Edit ${edited.name}`}
      hint="A digest is written by a model from the stories it covers, on its schedule."
    >
      <div className="flex max-w-[640px] flex-col gap-5">
        {page === null ? null : (
          <DigestList digests={digests} page={page} editing={editing} onEdit={onEdit} form={form} />
        )}
        <Input
          label="Name"
          value={value.name}
          onChange={(text) => {
            onChange("name", text);
          }}
        />
        <Choice
          label="Covers"
          hint="A group's topics, or a single topic."
          options={form.coversOptions}
          value={value.covers}
          onChange={(text) => {
            onChange("covers", text);
          }}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Choice
            label="Schedule"
            options={form.scheduleOptions}
            value={value.schedule}
            onChange={(text) => {
              onChange("schedule", text);
            }}
          />
          <Choice
            label="Length"
            options={form.lengthOptions}
            value={value.length}
            onChange={(text) => {
              onChange("length", text);
            }}
          />
        </div>
        <TextArea
          label="Brief (optional)"
          hint="Plain text. Tell the model what matters to this group."
          rows={3}
          value={value.brief}
          onChange={(text) => {
            onChange("brief", text);
          }}
        />
        <FormActions
          page={page}
          editing={edited !== null}
          onSave={save}
          onCancel={() => {
            onEdit(null);
          }}
        />
      </div>
    </Section>
  );
}
