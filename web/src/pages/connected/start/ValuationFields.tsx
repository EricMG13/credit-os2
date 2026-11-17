import type { ReactNode } from "react";
import { RowEditor, RowInput, type Marker } from "./RowEditor";
import {
  BASIS_FIELD,
  MARKET_FIELDS,
  MULTIPLE_FIELDS,
  PART_TITLES,
  PEER_SOURCE_FIELD,
  peerKind,
  showsPeers,
  showsPrecedents,
  type ValuationForm,
} from "./valuation";
import type { Row, RowField } from "./rows";

type Part = "issuer_market" | "user_multiple";

function Box({
  prefix,
  item,
  value,
  onChange,
  marker,
  message,
}: {
  prefix: string;
  item: RowField;
  value: string;
  onChange: (value: string) => void;
  marker?: Marker;
  message?: ReactNode;
}) {
  return (
    <RowInput
      id={`${prefix}-${item.key}`}
      item={item}
      blank={false}
      value={value}
      options={item.options}
      onChange={onChange}
      marker={marker}
      message={message}
    />
  );
}

function PartFields({
  title,
  part,
  fields,
  form,
  onChange,
}: {
  title: string;
  part: Part;
  fields: readonly RowField[];
  form: ValuationForm;
  onChange: (next: ValuationForm) => void;
}) {
  return (
    <section aria-label={title} className="grid gap-3 sm:grid-cols-2">
      <h4 className="text-sm font-semibold sm:col-span-2">{title}</h4>
      {fields.map((item) => (
        <Box
          key={item.key}
          prefix={part}
          item={item}
          value={form[part][item.key] ?? ""}
          onChange={(value) => {
            onChange({ ...form, [part]: { ...form[part], [item.key]: value } });
          }}
        />
      ))}
    </section>
  );
}

/** Valuation as ordinary fields: a part appears only when the chosen options use it. */
export function ValuationFields({
  form,
  onChange,
  marker,
  message,
}: {
  form: ValuationForm;
  onChange: (next: ValuationForm) => void;
  /** On the section's first control, so a refusal naming the section lands there. */
  marker?: Marker;
  message?: ReactNode;
}) {
  const rows = (key: "peers" | "precedents") => (next: Row[]) => {
    onChange({ ...form, [key]: next });
  };
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Box
          prefix="valuation"
          item={PEER_SOURCE_FIELD}
          marker={marker}
          message={message}
          value={form.peer_source}
          onChange={(peer_source) => {
            onChange({ ...form, peer_source });
          }}
        />
        <Box
          prefix="valuation"
          item={BASIS_FIELD}
          value={form.basis}
          onChange={(basis) => {
            onChange({ ...form, basis });
          }}
        />
      </div>
      {showsPeers(form.peer_source) && (
        <section aria-label="Peers" className="grid gap-2">
          <h4 className="text-sm font-semibold">Peers</h4>
          <RowEditor
            kind={peerKind(form.peer_source)}
            rows={form.peers}
            onChange={rows("peers")}
            primary
          />
        </section>
      )}
      {showsPrecedents(form.basis) && (
        <section aria-label="Precedents" className="grid gap-2">
          <h4 className="text-sm font-semibold">Precedents</h4>
          <RowEditor
            kind="precedents"
            rows={form.precedents}
            onChange={rows("precedents")}
            primary
          />
        </section>
      )}
      {form.basis === "issuer_trading" && (
        <PartFields
          title={PART_TITLES.issuer_market}
          part="issuer_market"
          fields={MARKET_FIELDS}
          form={form}
          onChange={onChange}
        />
      )}
      {form.basis === "user_multiple" && (
        <PartFields
          title={PART_TITLES.user_multiple}
          part="user_multiple"
          fields={MULTIPLE_FIELDS}
          form={form}
          onChange={onChange}
        />
      )}
    </div>
  );
}
