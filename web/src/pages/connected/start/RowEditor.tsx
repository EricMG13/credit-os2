import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { moduleName } from "../api";
import { field, label } from "../layout";
import { emptyRow, ROW_SPECS, text, type Row, type RowField, type RowKind } from "./rows";

type Choices = readonly (readonly [string, string])[];

export function RowEditor({
  kind,
  rows,
  onChange,
  primary,
  required,
  focusChoices,
  openFirst,
  error,
}: {
  kind: RowKind;
  rows: readonly Row[];
  onChange: (rows: Row[]) => void;
  primary: boolean;
  required?: boolean;
  focusChoices?: Choices;
  /** Draw the first row open when the editor appears. */
  openFirst?: boolean;
  error?: string;
}) {
  const spec = ROW_SPECS[kind];
  const base = useId();
  const errorId = `${base}-error`;
  const maxId = `${base}-max`;
  const full = rows.length >= spec.max;
  // Each row keeps one identity while it is in the list, so its open state and input ids
  // follow the row, not its position. The identity is not part of the row that is sent.
  const [ids, setIds] = useState<number[]>(() => rows.map((_, at) => at));
  const nextId = useRef(rows.length);
  const [added, setAdded] = useState<number | undefined>(openFirst ? 0 : undefined);
  // An id is missing only for the render between a change from outside and the next setIds; the
  // negative key is unique to the position, so no two rows share a key.
  const keys = rows.map((_, at) => ids[at] ?? -(at + 1));
  const [removed, setRemoved] = useState({ text: "", count: 0 });
  const removeButtons = useRef(new Map<number, HTMLButtonElement>());
  const addButton = useRef<HTMLButtonElement | null>(null);
  const refocus = useRef<{ add: boolean; at: number }>(undefined);
  useEffect(() => {
    const wanted = refocus.current;
    refocus.current = undefined;
    if (!wanted) return;
    const keyAt = ids[Math.min(wanted.at, ids.length - 1)];
    const target =
      wanted.add || keyAt === undefined ? addButton.current : removeButtons.current.get(keyAt);
    target?.focus();
  }, [ids]);
  return (
    <div className="grid gap-2">
      {required && rows.length === 0 && !error && (
        <p className="text-sm text-text-secondary">
          At least one {spec.title.toLowerCase()} is required for a new issue.
        </p>
      )}
      {rows.map((row, index) => {
        const key = keys[index];
        if (key === undefined) return null;
        return (
          <div key={key} className="relative min-w-0 rounded-lg border border-border-hairline p-3">
            <RowItem
              id={`${base}-${String(key)}`}
              title={`${spec.title} ${String(index + 1)}`}
              summary={spec.summary(row)}
              fields={spec.fields.filter((item) => primary || !item.primaryOnly)}
              kind={kind}
              row={row}
              startOpen={key === added}
              focusChoices={focusChoices}
              onField={(name, value) => {
                onChange(
                  rows.map((item, at) => (at === index ? { ...item, [name]: value } : item)),
                );
              }}
            />
            <Button
              size="sm"
              color="secondary"
              className="absolute right-3 top-2"
              aria-label={`Remove ${spec.title} ${String(index + 1)}`}
              ref={(node) => {
                if (node) removeButtons.current.set(key, node);
                else removeButtons.current.delete(key);
              }}
              onPress={() => {
                refocus.current = { add: rows.length === 1, at: index };
                setRemoved((previous) => ({
                  text: `${spec.title} ${String(index + 1)} removed.`,
                  count: previous.count + 1,
                }));
                setIds(keys.filter((_, at) => at !== index));
                onChange(rows.filter((_, at) => at !== index));
              }}
            >
              Remove
            </Button>
          </div>
        );
      })}
      <div className="grid gap-1">
        <div>
          <Button
            size="sm"
            color="secondary"
            ref={addButton}
            data-field={kind}
            isDisabled={full}
            aria-describedby={
              [full && maxId, error && errorId].filter(Boolean).join(" ") || undefined
            }
            onPress={() => {
              nextId.current += 1;
              setRemoved((previous) => ({ text: "", count: previous.count }));
              setAdded(nextId.current);
              setIds([...keys, nextId.current]);
              onChange([...rows, emptyRow(kind)]);
            }}
          >
            {spec.add}
          </Button>
        </div>
        {full && (
          <p id={maxId} className="text-sm text-text-secondary">
            At most {spec.max} {spec.plural}.
          </p>
        )}
        <p role="status" className="text-sm text-text-secondary empty:hidden">
          {removed.text ? <span key={removed.count}>{removed.text}</span> : null}
        </p>
        {error && (
          <p id={errorId} role="alert" className="text-sm text-error-primary">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function RowItem({
  id,
  title,
  summary,
  fields,
  kind,
  row,
  startOpen,
  focusChoices,
  onField,
}: {
  id: string;
  title: string;
  summary: string;
  fields: readonly RowField[];
  kind: RowKind;
  row: Row;
  startOpen: boolean;
  focusChoices?: Choices;
  onField: (key: string, value: string) => void;
}) {
  // Open once, when the row appears; the analyst's own toggling is never overridden.
  const [open] = useState(startOpen);
  const groups = [...new Set(fields.map((item) => item.group ?? ""))];
  return (
    <details open={open || undefined} className="min-w-0">
      <summary className="cursor-pointer pr-24 text-sm">
        <span className="font-semibold">{title}</span>
        <span className="ml-2 text-text-secondary">{summary}</span>
      </summary>
      <div className="mt-3 grid gap-4">
        {groups.map((group) => (
          <div key={group} className="grid gap-2">
            {group && <h5 className="text-sm font-semibold text-text-secondary">{group}</h5>}
            <div className="grid gap-3 sm:grid-cols-2">
              {fields
                .filter((item) => (item.group ?? "") === group)
                .map((item) => {
                  const options =
                    item.options ?? (item.key === "focus_module" ? focusChoices : undefined);
                  return (
                    <RowInput
                      key={item.key}
                      id={`${id}-${item.key}`}
                      item={item}
                      blank={
                        !options?.some(([option]) => option === "") &&
                        emptyRow(kind)[item.key] === ""
                      }
                      value={text(row, item.key)}
                      options={options}
                      onChange={(value) => {
                        onField(item.key, value);
                      }}
                    />
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

/** What a screen puts on a control so a refusal can be shown on it (`problemAttrs` in StartRun). */
export type Marker = {
  "data-field": string;
  "aria-invalid"?: "true";
  "aria-describedby"?: string;
};

export function RowInput({
  id,
  item,
  blank,
  value,
  options,
  onChange,
  marker,
  message,
}: {
  id: string;
  item: RowField;
  blank: boolean;
  value: string;
  options?: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
  /** Set on the first control of a section that a refusal can name. */
  marker?: Marker;
  /** The refusal text, drawn under the control the marker is on. */
  message?: ReactNode;
}) {
  const hintText = item.hint ?? "";
  const hint = hintText ? `${id}-hint` : undefined;
  const described = [hint, marker?.["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  const offered = options ?? [];
  // A value the options do not list is still the value that is sent, so it is shown.
  const choices =
    value && item.kind === "select" && !offered.some(([option]) => option === value)
      ? [...offered, [value, item.key === "focus_module" ? moduleName(value) : value] as const]
      : offered;
  return (
    <div className="grid content-start gap-1">
      <div className="flex items-baseline gap-2">
        <label htmlFor={id} className={label}>
          {item.label}
        </label>
        {item.required && (
          <span className="text-caption font-medium whitespace-nowrap text-text-secondary">
            Required
          </span>
        )}
      </div>
      {item.kind === "select" ? (
        <select
          id={id}
          className={field}
          {...marker}
          aria-describedby={described}
          aria-required={item.required ? "true" : undefined}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        >
          {blank && <option value="" />}
          {choices.map(([option, name]) => (
            <option key={option} value={option}>
              {name}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          className={field}
          type={item.kind === "date" ? "date" : "text"}
          inputMode={item.kind === "number" ? "decimal" : undefined}
          placeholder={item.placeholder}
          {...marker}
          aria-describedby={described}
          aria-required={item.required ? "true" : undefined}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      )}
      {hintText && (
        <p id={hint} className="text-caption text-text-secondary">
          {hintText}
        </p>
      )}
      {message}
    </div>
  );
}
