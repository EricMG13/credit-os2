import { Segmented } from "@/components/kit/Segmented";
import { cx } from "@/utils/cx";
import { Well } from "../report/overview/Tile";
import { PurposeCards } from "../../run/start/Purpose";
import { PATHWAYS, drawnModules } from "../api";
import {
  CASE_KIND_LABEL,
  CASE_KINDS,
  LEVELS,
  PATHWAY_LABEL,
  PURPOSES,
  RUN_PURPOSE_LABEL,
} from "./plain";
import { SYNTHETIC_LIMITS, type IntakeView, shownCapText } from "./intake";
import { PATHWAY_QUESTIONS } from "./pathways";

const PATHWAY_CARDS = Object.entries(PATHWAYS).map(([id, pathway]) => ({
  id,
  title: pathway.label,
  description: PATHWAY_QUESTIONS[id] ?? "",
  modules: `${String(drawnModules(pathway.modules).length)} base modules`,
}));

export function PurposeFields({ view }: { view: IntakeView }) {
  return (
    <>
      <div className="@container sm:col-span-2">
        <PurposeCards
          className="@[44rem]:grid-cols-2"
          label={PATHWAY_LABEL}
          value={view.run.pathway}
          purposes={PATHWAY_CARDS.map((pathway) => {
            const cap = view.caps[pathway.id];
            const capText = cap && shownCapText(Number(cap));
            return { ...pathway, cap: capText ? `Cap ${capText}` : "Cap unavailable" };
          })}
          onChange={view.changePathway}
        />
      </div>
      {view.synthetic && (
        <p className="text-small text-text-secondary sm:col-span-2">{SYNTHETIC_LIMITS}</p>
      )}
      <Well className="flex flex-col gap-4 p-4 sm:col-span-2">
        <h3 className="text-h4 font-medium text-text-primary">Options</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <OptionControl
            wide
            label={RUN_PURPOSE_LABEL}
            value={view.run.run_type ?? "research"}
            choices={
              view.earnings
                ? { earnings: PURPOSES.earnings }
                : {
                    research: PURPOSES.research,
                    primary: PURPOSES.primary,
                    secondary: PURPOSES.secondary,
                  }
            }
            onChange={view.changePurpose}
          />
          <OptionControl
            label={CASE_KIND_LABEL}
            value={view.run.case_kind}
            help="Public cases can use approved lookups. Web search through Copilot is unavailable."
            choices={CASE_KINDS}
            onChange={(value) => {
              view.changeRun("case_kind", value);
            }}
          />
          <OptionControl
            label="Run form level"
            value={view.level}
            help="Advanced adds model, effort, turns per module, module selection and valuation and assumption fields."
            choices={LEVELS}
            onChange={view.changeLevel}
          />
        </div>
      </Well>
    </>
  );
}

function OptionControl({
  label,
  value,
  help,
  choices,
  onChange,
  wide = false,
}: {
  label: string;
  value: string;
  help?: string;
  choices: Readonly<Record<string, string>>;
  onChange: (value: string) => void;
  /** Across both columns, where its options would not fit on one line in one. */
  wide?: boolean;
}) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", wide && "lg:col-span-2")}>
      <span aria-hidden="true" className="text-caption text-text-tertiary">
        {label}
      </span>
      <Segmented
        label={label}
        current={value}
        // As the select it replaces: choosing the option already chosen changes nothing.
        onSelect={(key) => {
          if (key !== value) onChange(key);
        }}
        segments={Object.entries(choices).map(([key, text]) => ({ key, label: text }))}
      />
      {help && <p className="text-small text-text-tertiary">{help}</p>}
    </div>
  );
}
