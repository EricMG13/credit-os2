import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { moduleName } from "../api";
import { field, label } from "../layout";
import { emptyRow, ROW_SPECS, text, type Row, type RowField, type RowKind } from "./rows";

type Choices = readonly (readonly [string, string])[];

function useRowEditorState({
  kind,
  rows,
  onChange,
  primary,
  openFirst,
}: {
  kind: RowKind;
  rows: readonly Row[];
  onChange: (rows: Row[]) => void;
  primary: boolean;
  openFirst?: boolean;
}) {
  const spec = ROW_SPECS[kind];
  const [ids, setIds] = useState<number[]>(() => rows.map((_, at) => at));
  const nextIdRef = useRef(rows.length);
  const [added, setAdded] = useState<number | undefined>(openFirst ? 0 : undefined);
  const keys = rows.map((_, at) => ids[at] ?? -(at + 1));
  const [removed, setRemoved] = useState({ text: "", count: 0 });
  const removeButtonsRef = useRef(new Map<number, HTMLButtonElement>());
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const refocusRef = useRef<{ add: boolean; at: number }>(undefined);
  const visibleFields = spec.fields.filter((item) => primary || !item.primaryOnly);

  function changeField(index: number, name: string, value: string) {
    onChange(rows.map((item, at) => (at === index ? { ...item, [name]: value } : item)));
  }

  function removeRow(index: number) {
    refocusRef.current = { add: rows.length === 1, at: index };
    setRemoved((previous) => ({
      text: `${spec.title} ${String(index + 1)} removed.`,
      count: previous.count + 1,
    }));
    setIds(keys.filter((_, at) => at !== index));
    onChange(rows.filter((_, at) => at !== index));
  }

  function addRow() {
    nextIdRef.current += 1;
    setRemoved((previous) => ({ text: "", count: previous.count }));
    setAdded(nextIdRef.current);
    setIds([...keys, nextIdRef.current]);
    onChange([...rows, emptyRow(kind)]);
  }

  useEffect(() => {
    const wanted = refocusRef.current;
    refocusRef.current = undefined;
    if (!wanted) return;
    const keyAt = ids[Math.min(wanted.at, ids.length - 1)];
    const target =
      wanted.add || keyAt === undefined
        ? addButtonRef.current
        : removeButtonsRef.current.get(keyAt);
    target?.focus();
  }, [ids]);

  return {
    spec,
    keys,
    added,
    removed,
    visibleFields,
    changeField,
    removeRow,
    addRow,
    removeButtonsRef,
    addButtonRef,
  };
}

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
  const base = useId();
  const {
    spec,
    keys,
    added,
    removed,
    visibleFields,
    changeField,
    removeRow,
    addRow,
    removeButtonsRef,
    addButtonRef,
  } = useRowEditorState({ kind, rows, onChange, primary, openFirst });
  const errorId = `${base}-error`;
  const maxId = `${base}-max`;
  const full = rows.length >= spec.max;
  return (
    <div className="grid gap-2">
      {required && rows.length === 0 && !error && (
        <p className="text-small text-text-secondary">
          At least one {spec.title.toLowerCase()} is required for a new issue.
        </p>
      )}
      <RowEditorRows
        rows={rows}
        keys={keys}
        base={base}
        title={spec.title}
        kind={kind}
        fields={visibleFields}
        added={added}
        focusChoices={focusChoices}
        onField={changeField}
        onRemove={removeRow}
        removeRef={(key, node) => {
          if (node) removeButtonsRef.current.set(key, node);
          else removeButtonsRef.current.delete(key);
        }}
        summary={spec.summary}
      />
      <div className="grid gap-1">
        <div>
          <Button
            size="sm"
            color="secondary"
            className="min-h-8 max-[480px]:min-h-11"
            ref={addButtonRef}
            data-field={kind}
            isDisabled={full}
            aria-describedby={
              [full && maxId, error && errorId].filter(Boolean).join(" ") || undefined
            }
            onPress={addRow}
          >
            {spec.add}
          </Button>
        </div>
        {full && (
          <p id={maxId} className="text-small text-text-secondary">
            At most {spec.max} {spec.plural}.
          </p>
        )}
        <p role="status" className="text-small text-text-secondary empty:hidden">
          {removed.text ? <span key={removed.count}>{removed.text}</span> : null}
        </p>
        {error && (
          <p id={errorId} role="alert" className="text-small text-error-primary">
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
    <details open={open || undefined} className="group/row min-w-0">
      <summary className="flex min-h-8 cursor-pointer list-none flex-wrap items-center gap-x-2 pr-24 text-small max-[480px]:min-h-11 [&::-webkit-details-marker]:hidden">
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-text-tertiary transition-transform group-open/row:rotate-180"
        />
        <span className="font-medium">{title}</span>
        <span className="text-text-secondary">{summary}</span>
      </summary>
      <div className="mt-3 grid gap-4">
        {groups.map((group) => (
          <div key={group} className="grid gap-2">
            {group && <h5 className="text-small font-medium text-text-secondary">{group}</h5>}
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

function EditableRow({
  id,
  title,
  summary,
  fields,
  kind,
  row,
  open,
  focusChoices,
  onField,
  onRemove,
  removeRef,
}: {
  id: string;
  title: string;
  summary: string;
  fields: readonly RowField[];
  kind: RowKind;
  row: Row;
  open: boolean;
  focusChoices?: Choices;
  onField: (name: string, value: string) => void;
  onRemove: () => void;
  removeRef: (node: HTMLButtonElement | null) => void;
}) {
  return (
    <div className="relative min-w-0 rounded-ds-sm border border-border-hairline p-3">
      <RowItem
        id={id}
        title={title}
        summary={summary}
        fields={fields}
        kind={kind}
        row={row}
        startOpen={open}
        focusChoices={focusChoices}
        onField={onField}
      />
      <Button
        size="sm"
        color="secondary"
        className="absolute top-2 right-3 min-h-8 max-[480px]:min-h-11"
        aria-label={`Remove ${title}`}
        ref={removeRef}
        onPress={onRemove}
      >
        Remove
      </Button>
    </div>
  );
}

function RowEditorRows({
  rows,
  keys,
  base,
  title,
  kind,
  fields,
  added,
  focusChoices,
  onField,
  onRemove,
  removeRef,
  summary,
}: {
  rows: readonly Row[];
  keys: readonly number[];
  base: string;
  title: string;
  kind: RowKind;
  fields: readonly RowField[];
  added: number | undefined;
  focusChoices?: Choices;
  onField: (index: number, name: string, value: string) => void;
  onRemove: (index: number) => void;
  removeRef: (key: number, node: HTMLButtonElement | null) => void;
  summary: (row: Row) => string;
}) {
  return (
    <>
      {rows.map((row, index) => {
        const key = keys[index];
        if (key === undefined) return null;
        const rowTitle = `${title} ${String(index + 1)}`;
        return (
          <EditableRow
            key={key}
            id={`${base}-${String(key)}`}
            title={rowTitle}
            summary={summary(row)}
            fields={fields}
            kind={kind}
            row={row}
            open={key === added}
            focusChoices={focusChoices}
            onField={(name, value) => {
              onField(index, name, value);
            }}
            onRemove={() => {
              onRemove(index);
            }}
            removeRef={(node) => {
              removeRef(key, node);
            }}
          />
        );
      })}
    </>
  );
}

/** What a screen puts on a control so a refusal can be shown on it (`problemAttrs` in StartRun). */
export type Marker = {
  "data-field": string;
  "aria-invalid"?: "true";
  "aria-describedby"?: string;
};

function selectChoices(
  value: string,
  item: RowField,
  offered: readonly (readonly [string, string])[],
) {
  if (!value || item.kind !== "select" || offered.some(([option]) => option === value))
    return offered;
  const name = item.key === "focus_module" ? moduleName(value) : value;
  return [...offered, [value, name] as const];
}

function RowControl({
  id,
  item,
  blank,
  value,
  choices,
  marker,
  described,
  onChange,
}: {
  id: string;
  item: RowField;
  blank: boolean;
  value: string;
  choices: readonly (readonly [string, string])[];
  marker?: Marker;
  described?: string;
  onChange: (value: string) => void;
}) {
  if (item.kind === "select") {
    return (
      <select
        id={id}
        className={`${field} text-body`}
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
    );
  }

  return (
    <input
      id={id}
      className={`${field} text-body`}
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
  );
}

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
  const choices = selectChoices(value, item, offered);
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
      <RowControl
        id={id}
        item={item}
        blank={blank}
        value={value}
        choices={choices}
        marker={marker}
        described={described}
        onChange={onChange}
      />
      {hintText && (
        <p id={hint} className="text-caption text-text-secondary">
          {hintText}
        </p>
      )}
      {message}
    </div>
  );
}
