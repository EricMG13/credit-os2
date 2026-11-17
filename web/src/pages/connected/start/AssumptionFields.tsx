import { moduleName } from "../api";
import { blankPin, PINS, type AssumptionsForm, type PinKey } from "./assumptions";
import type { ReactNode } from "react";
import { RowEditor, RowInput, type Marker } from "./RowEditor";

/** Scenario assumptions as ordinary fields: one group per module the run includes. */
export function AssumptionFields({
  form,
  modules,
  onChange,
  marker,
  message,
}: {
  form: AssumptionsForm;
  modules: readonly string[];
  onChange: (next: AssumptionsForm) => void;
  /** On the section's first control, so a refusal naming the section lands there. */
  marker?: Marker;
  message?: ReactNode;
}) {
  const shown = PINS.filter((pin) => modules.includes(pin.module));
  const set = (key: PinKey, value: AssumptionsForm[PinKey]) => {
    onChange({ ...form, [key]: value });
  };
  return (
    <div className="grid gap-4">
      {shown.map((pin, position) => {
        const title = moduleName(pin.module);
        const current = form[pin.key];
        return (
          <section
            key={pin.key}
            aria-label={title}
            className="grid gap-3 rounded-lg border border-border-hairline p-3"
          >
            <h4 className="text-sm font-semibold">{title}</h4>
            <div className="grid gap-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...(position === 0 ? marker : undefined)}
                  checked={current !== null}
                  onChange={(event) => {
                    set(pin.key, event.target.checked ? blankPin(pin) : null);
                  }}
                />
                Pin {title}
              </label>
              {position === 0 ? message : null}
            </div>
            {current && (
              <div className="grid gap-3">
                {pin.key === "cp2a" && (
                  <RowEditor
                    kind="scenarios"
                    rows={current.scenarios}
                    primary
                    openFirst
                    onChange={(scenarios) => {
                      set(pin.key, { ...current, scenarios });
                    }}
                  />
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {pin.fields.map((item) => (
                    <RowInput
                      key={item.key}
                      id={`assumption-${pin.key}-${item.key}`}
                      item={item}
                      blank={false}
                      value={current.values[item.key] ?? ""}
                      onChange={(value) => {
                        set(pin.key, {
                          ...current,
                          values: { ...current.values, [item.key]: value },
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
