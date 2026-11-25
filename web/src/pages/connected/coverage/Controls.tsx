import type { ReactNode } from "react";
import { moduleName } from "../api";
import type { Field } from "../coverageData";
import { field as control, label } from "../layout";

/** A labelled select, for the long lists a row of chips would turn into a wall. */
export function Choice({
  name,
  value,
  onChange,
  children,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className={`${label} max-w-md`}>
      {name}
      <select
        value={value}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        className={`${control} max-[480px]:min-h-11`}
      >
        {children}
      </select>
    </label>
  );
}

function fieldName(field: Field, titles: ReadonlyMap<string, string>) {
  return `${titles.get(field.module) ?? moduleName(field.module)}: ${field.group}, ${field.label}`;
}

export function FieldOptions({
  fields,
  titles,
}: {
  fields: Field[];
  titles: ReadonlyMap<string, string>;
}) {
  return (
    <>
      {fields.map((item) => (
        <option key={item.id} value={item.id}>
          {fieldName(item, titles)}
        </option>
      ))}
    </>
  );
}
