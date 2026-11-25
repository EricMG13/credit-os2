import type { ReactNode } from "react";
import { RowInput, type Marker } from "./RowEditor";
import { CP3_FIELD, DEEP_DEBATE, type ModuleOptionsForm } from "./valuation";

/** Each choice is shown only when the pathway runs the module it belongs to. */
export function ModuleOptionsFields({
  form,
  runs,
  onChange,
  marker,
  message,
}: {
  form: ModuleOptionsForm;
  runs: { cp3: boolean; cp6: boolean };
  onChange: (next: ModuleOptionsForm) => void;
  /** On the section's first control, so a refusal naming the section lands there. */
  marker?: Marker;
  message?: ReactNode;
}) {
  if (!runs.cp3 && !runs.cp6) return null;
  return (
    <div className="grid gap-3">
      {runs.cp3 && (
        <RowInput
          id="module-options-cp3_mode"
          item={CP3_FIELD}
          blank={false}
          value={form.cp3_mode}
          options={CP3_FIELD.options}
          marker={marker}
          message={message}
          onChange={(cp3_mode) => {
            onChange({ ...form, cp3_mode });
          }}
        />
      )}
      {runs.cp6 && (
        <div className="grid gap-1">
          <label className="flex items-center gap-2 text-small font-medium">
            <input
              type="checkbox"
              {...(runs.cp3 ? undefined : marker)}
              aria-describedby={[
                "module-options-deep-debate-hint",
                runs.cp3 ? "" : (marker?.["aria-describedby"] ?? ""),
              ]
                .filter(Boolean)
                .join(" ")}
              checked={form.cp6_deep_debate}
              onChange={(event) => {
                onChange({ ...form, cp6_deep_debate: event.target.checked });
              }}
            />
            {DEEP_DEBATE}
          </label>
          <p id="module-options-deep-debate-hint" className="text-caption text-text-secondary">
            A longer, fuller committee argument, never a softer sizing posture. Off by default.
          </p>
          {runs.cp3 ? null : message}
        </div>
      )}
    </div>
  );
}
