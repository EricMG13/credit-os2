// Settings, Issuers: the watchlist as writers keep it. Each issuer a row with its name, its
// aliases as tags, its SEC number and library key, and the service's sentence on its filing
// source; the service's sentence on whether filings are fetched stands once above the list. New
// issuer, Edit and Delete write: in the sample they are disabled with the reason in view; on a
// service New issuer and Edit open the issuer's form and Delete asks first. The owner approves a
// filing source and sets the contact the SEC asks for on the command line, never here. Readers do
// not see this section: an issuer's page and its follow star are theirs.
import { useRef, useState } from "react";
import { Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useSignalActions } from "../actions";
import { FIGURE } from "../parts/classes";
import { useOpener } from "../parts/focus";
import { FormDialog, type FormField, type FormValues } from "../parts/FormDialog";
import { Tags } from "../parts/Tags";
import type { SignalSettingsIssuer } from "../slice";
import { writes, type IssuerForm } from "../writes";
import { Section } from "./Section";
import { SampleReason, useSampleOff } from "./SampleReason";

const REASON_ID = "signal-issuers-write-reason";

function fieldsFor(issuer: SignalSettingsIssuer | null): FormField[] {
  return [
    {
      key: "name",
      kind: "text",
      label: "Name",
      value: issuer?.name,
      missing: "Enter the issuer's name.",
      maxLength: 80,
    },
    {
      key: "aliases",
      kind: "text",
      label: "Aliases",
      hint: "Other names and tickers, separated by commas. A story joins the issuer when its headline or summary holds the name or an alias as whole words.",
      value: issuer?.aliases.join(", "),
    },
    {
      key: "cik",
      kind: "text",
      label: "SEC number (CIK)",
      hint: "10 digits. With one, the issuer's SEC filings are proposed as a source for the owner to approve.",
      value: issuer?.cik ?? "",
      maxLength: 10,
    },
    {
      key: "libraryKey",
      kind: "text",
      label: "Library key",
      hint: "With one, the issuer's page links to the Library.",
      value: issuer?.libraryKey ?? "",
      maxLength: 120,
    },
  ];
}

/** What the form posts: all four, as an edit replaces all four (an empty field is none). */
function formOf({ text }: FormValues): IssuerForm {
  const typed = (key: string) => (text[key] ?? "").trim();
  const aliases = typed("aliases")
    .split(",")
    .map((alias) => alias.trim());
  return {
    name: typed("name"),
    aliases: aliases.filter((alias) => alias !== ""),
    cik: typed("cik") === "" ? null : typed("cik"),
    libraryKey: typed("libraryKey") === "" ? null : typed("libraryKey"),
  };
}

/** Which dialog is open: a new issuer's form (no issuer), or an issuer's form or its removal. */
type Open = { open: boolean; issuer: SignalSettingsIssuer | null; purpose: "edit" | "delete" };

/** The dialog a service's New issuer, Edit and Delete open; a refusal is the service's sentence, in the dialog. */
function IssuerDialog({
  form,
  onClose,
  onGone,
}: {
  form: Open;
  onClose: () => void;
  onGone: () => void;
}) {
  const actions = useSignalActions();
  if (actions === null) return null;
  const { issuer, purpose } = form;
  const sent = (request: Parameters<typeof actions.write>[0]) =>
    actions.write(request).then((answer) => answer.refusal);
  if (issuer !== null && purpose === "delete") {
    return (
      <FormDialog
        open={form.open}
        title={`Delete ${issuer.name}?`}
        intro="The issuer leaves the watchlist for everyone: its page, its follows and its place in digests go, and its filings are no longer fetched. Stories already in the feed stay. This cannot be undone."
        fields={[]}
        action="Delete issuer"
        destructive
        onSend={() => sent(writes.dropIssuer(issuer.id))}
        onClose={onClose}
        onGone={onGone}
      />
    );
  }
  return (
    <FormDialog
      open={form.open}
      title={issuer === null ? "New issuer" : `Edit ${issuer.name}`}
      fields={fieldsFor(issuer)}
      action={issuer === null ? "Add issuer" : "Save issuer"}
      onSend={(values) => sent(writes.issuer(issuer?.id ?? null, formOf(values)))}
      onClose={onClose}
      onGone={onGone}
    />
  );
}

/** A stored code (the SEC number, the library key) with its label, or the words saying there is none. */
function Code({ label, value, none }: { label: string; value: string | null; none: string }) {
  if (value === null) return <span>{none}</span>;
  return (
    <span>
      {label} <span className={`wrap-anywhere text-text-secondary ${FIGURE}`}>{value}</span>
    </span>
  );
}

function Row({
  issuer,
  onOpen,
}: {
  issuer: SignalSettingsIssuer;
  onOpen: (purpose: Open["purpose"]) => void;
}) {
  const off = useSampleOff(REASON_ID);
  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-2 border-t border-border-hairline py-4">
      <div className="grid min-w-48 flex-1 gap-2">
        <b className="block text-body font-semibold text-text-primary">{issuer.name}</b>
        {issuer.aliases.length === 0 ? (
          <span className="text-small text-text-tertiary">No aliases</span>
        ) : (
          <Tags tags={issuer.aliases} label={`Aliases: ${issuer.name}`} />
        )}
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-small text-text-tertiary">
          <Code label="SEC number" value={issuer.cik} none="No SEC number" />
          <Code label="Library key" value={issuer.libraryKey} none="No library key" />
        </p>
        {issuer.source === null ? null : (
          <p className="max-w-[72ch] text-small text-text-secondary">
            Filings: {issuer.source.note}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-x-1">
        <Button
          color="tertiary"
          aria-label={`Edit: ${issuer.name}`}
          {...off}
          onPress={() => {
            onOpen("edit");
          }}
        >
          Edit
        </Button>
        <Button
          color="tertiary"
          aria-label={`Delete: ${issuer.name}`}
          {...off}
          onPress={() => {
            onOpen("delete");
          }}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}

export function IssuersSection({
  issuers,
  filings,
}: {
  issuers: SignalSettingsIssuer[];
  /** The service's sentence on whether filings are fetched; null where it sent none. */
  filings: string | null;
}) {
  const off = useSampleOff(REASON_ID);
  // A deleted issuer's row goes with its Delete: New issuer then takes focus.
  const first = useRef<HTMLButtonElement>(null);
  const opener = useOpener(() => first.current);
  const [form, setForm] = useState<Open>({ open: false, issuer: null, purpose: "edit" });
  const open = (issuer: SignalSettingsIssuer | null, purpose: Open["purpose"] = "edit") => {
    opener.remember();
    setForm({ open: true, issuer, purpose });
  };
  return (
    <Section
      title="Issuers"
      hint="A story that names an issuer, or one of its aliases, is gathered on the issuer's page. Anyone can follow an issuer."
      action={
        <Button
          ref={first}
          color="primary"
          iconLeading={Plus}
          {...off}
          onPress={() => {
            open(null);
          }}
        >
          New issuer
        </Button>
      }
    >
      <SampleReason id={REASON_ID}>Sample data: issuers cannot be changed here.</SampleReason>
      {filings === null ? null : (
        <p className="mb-4 max-w-[72ch] text-small text-text-secondary">{filings}</p>
      )}
      <IssuerDialog
        key={form.issuer === null ? "new" : `${form.purpose} ${form.issuer.id}`}
        form={form}
        onClose={() => {
          setForm({ ...form, open: false });
        }}
        onGone={opener.restore}
      />
      {issuers.length === 0 ? (
        <p className="text-small text-text-tertiary">No issuers yet</p>
      ) : (
        <ul>
          {issuers.map((issuer) => (
            <Row
              key={issuer.id}
              issuer={issuer}
              onOpen={(purpose) => {
                open(issuer, purpose);
              }}
            />
          ))}
        </ul>
      )}
    </Section>
  );
}
