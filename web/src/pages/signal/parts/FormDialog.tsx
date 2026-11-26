// A form modal for one write to the service: a few fields, Cancel and the action. It stays open
// while the service answers, shows the service's sentence when it refuses (what was typed is kept)
// and closes once the write is accepted. With no field it is the question asked before a removal. Built as the name and share dialogs are; drawn on a
// service only, so the design-reference app never opens one.
import { useState, type ReactNode, type SyntheticEvent } from "react";
import { Alert } from "@/components/alert/Alert";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { PHONE_TARGETS } from "./classes";
import { useOnGone } from "./focus";
import { TextArea } from "./TextArea";
import { Toggle } from "./Toggle";

const TITLE_ID = "signal-form-title";

/** A choice whose label may repeat: `id` is what the form holds and sends. */
type ChoiceOption = { id: string; label: string };
type Common = { key: string; label: string; hint?: string };
export type FormField =
  /** `missing`: the sentence shown when the field is left empty; without it the field is optional. */
  | (Common & { kind: "text" | "area"; value?: string; missing?: string; maxLength?: number })
  | (Common & { kind: "choice"; options: readonly (string | ChoiceOption)[]; value: string })
  | (Common & { kind: "switches"; options: readonly string[]; value: readonly string[] });

/** What the form holds when sent: each text, area and choice by key, and each set of switches. */
export type FormValues = { text: Record<string, string>; chosen: Record<string, string[]> };
/** Null once the service has accepted, else the sentence to show. */
type Send = (values: FormValues) => Promise<string | null>;

type Props = {
  title: string;
  /** A sentence under the title; it may hold a link. */
  intro?: ReactNode;
  fields: readonly FormField[];
  /** The action's word. Without one the form has nothing to send and only Cancel is drawn. */
  action?: string;
  /** The action cannot be undone (a removal): its button is the kit's destructive one. */
  destructive?: boolean;
  onSend: Send;
  /** A second write the form offers (a topic's Delete), with no field checked. */
  other?: { label: string; onSend: () => Promise<string | null> };
  onClose: () => void;
  /** Where focus goes once the dialog has gone: the control that opened it. */
  onGone: () => void;
};

function start(fields: readonly FormField[]): FormValues {
  const values: FormValues = { text: {}, chosen: {} };
  for (const field of fields) {
    if (field.kind === "switches") values.chosen[field.key] = [...field.value];
    else values.text[field.key] = field.value ?? "";
  }
  return values;
}

function FieldInput({
  field,
  values,
  missing,
  onChange,
}: {
  field: FormField;
  values: FormValues;
  missing: boolean;
  onChange: (values: FormValues) => void;
}) {
  const text = values.text[field.key] ?? "";
  const setText = (next: string) => {
    onChange({ ...values, text: { ...values.text, [field.key]: next } });
  };
  if (field.kind === "choice") {
    return (
      <Select
        label={field.label}
        hint={field.hint}
        items={field.options.map((one) =>
          typeof one === "string" ? { id: one, label: one } : one,
        )}
        value={text}
        onChange={(key) => {
          setText(String(key));
        }}
      >
        {(item) => <Select.Item id={item.id} label={item.label} />}
      </Select>
    );
  }
  if (field.kind === "switches") {
    const on = values.chosen[field.key] ?? [];
    return (
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-2 text-small font-medium text-text-secondary">{field.label}</legend>
        {field.options.map((option) => (
          <Toggle
            key={option}
            label={option}
            isSelected={on.includes(option)}
            onChange={(selected) => {
              const next = selected ? [...on, option] : on.filter((one) => one !== option);
              onChange({ ...values, chosen: { ...values.chosen, [field.key]: next } });
            }}
          />
        ))}
        {field.hint === undefined ? null : (
          <p className="text-small text-text-tertiary">{field.hint}</p>
        )}
      </fieldset>
    );
  }
  const shared = {
    label: field.label,
    value: text,
    maxLength: field.maxLength,
    isInvalid: missing,
    hint: missing ? field.missing : field.hint,
    onChange: setText,
  };
  return field.kind === "area" ? <TextArea rows={3} {...shared} /> : <Input {...shared} />;
}

/** The form is the dialog's content, so each opening starts from the fields' own values. */
function Form({
  title,
  intro,
  fields,
  action,
  destructive = false,
  onSend,
  other,
  onClose,
  onGone,
}: Props) {
  useOnGone(onGone);
  const [values, setValues] = useState(() => start(fields));
  const [missing, setMissing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const run = (send: () => Promise<string | null>) => {
    setBusy(true);
    setRefusal(null);
    void send().then((refused) => {
      setBusy(false);
      if (refused === null) onClose();
      else setRefusal(refused);
    });
  };
  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    const empty = fields.find(
      (field) =>
        field.kind !== "switches" &&
        field.kind !== "choice" &&
        field.missing !== undefined &&
        (values.text[field.key] ?? "").trim() === "",
    );
    setMissing(empty?.key ?? null);
    if (empty === undefined) run(() => onSend(values));
  };
  return (
    <form
      noValidate
      onSubmit={submit}
      className={`flex flex-col gap-5 p-5 sm:p-6 ${PHONE_TARGETS}`}
    >
      <div className="flex flex-col gap-1">
        <h2 id={TITLE_ID} className="font-display text-h3 text-text-primary">
          {title}
        </h2>
        {intro === undefined ? null : <p className="text-small text-text-secondary">{intro}</p>}
      </div>
      {fields.map((field) => (
        <FieldInput
          key={field.key}
          field={field}
          values={values}
          missing={missing === field.key}
          onChange={(next) => {
            setValues(next);
            setMissing(null);
          }}
        />
      ))}
      {refusal === null ? null : <Alert tone="error" title={refusal} />}
      <div className="flex flex-wrap justify-end gap-3">
        {other === undefined ? null : (
          <Button
            color="secondary"
            className="mr-auto"
            isDisabled={busy}
            onPress={() => {
              run(other.onSend);
            }}
          >
            {other.label}
          </Button>
        )}
        <Button color="secondary" onPress={onClose}>
          Cancel
        </Button>
        {action === undefined ? null : (
          <Button
            color={destructive ? "primary-destructive" : "primary"}
            type="submit"
            isDisabled={busy}
          >
            {action}
          </Button>
        )}
      </div>
    </form>
  );
}

export function FormDialog({ open, ...form }: Props & { open: boolean }) {
  return (
    <ModalOverlay
      isOpen={open}
      isDismissable
      onOpenChange={(next) => {
        if (!next) form.onClose();
      }}
    >
      <Modal className="sm:max-w-160">
        <Dialog aria-labelledby={TITLE_ID}>
          <Form {...form} />
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
