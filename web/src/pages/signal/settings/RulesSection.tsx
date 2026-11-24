// Settings, Thread rules (mock settings frame 2): one switch per rule with its label and hint.
// The rules are the mock's examples (mock question 11); a switch changes in memory only. On a
// service no rule can be changed from the page yet, so each switch shows its state and is disabled.
import type { SignalSettingsRule } from "../slice";
import { Toggle } from "../parts/Toggle";
import { Section } from "./Section";
import { useNotWritable, WriteReason } from "./WriteReason";

const REASON_ID = "signal-rules-write-reason";

export function RulesSection({
  rules,
  on,
  onChange,
}: {
  rules: SignalSettingsRule[];
  on: (rule: SignalSettingsRule) => boolean;
  onChange: (rule: SignalSettingsRule, value: boolean) => void;
}) {
  const fixed = useNotWritable();
  return (
    <Section title="Thread rules" hint="These apply to every group.">
      {rules.length === 0 ? (
        <p className="text-sm text-text-tertiary">No thread rules yet.</p>
      ) : (
        <>
          <WriteReason id={REASON_ID} live="Thread rules cannot be changed from this page yet." />
          <ul className="flex flex-col gap-5">
            {rules.map((rule) => (
              <li key={rule.id}>
                <Toggle
                  label={rule.label}
                  hint={rule.hint}
                  isSelected={on(rule)}
                  isDisabled={fixed}
                  aria-describedby={fixed ? REASON_ID : undefined}
                  onChange={(value) => {
                    onChange(rule, value);
                  }}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}
