import { useState, type ReactNode } from "react";
import { ChevronDown } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { pathwayModules, moduleName, drawnModules } from "../api";
import { field, label } from "../layout";
import { AssumptionFields } from "./AssumptionFields";
import {
  assumptionsSummary,
  datesSummary,
  dealSummary,
  filesSummary,
  fileRoles,
  issuerSummary,
  legalSummary,
  modelChoices,
  modelSummary,
  moduleOptionsSummary,
  researchSummary,
  SECTION_TITLES,
  sectionOfField,
  valuationSummary,
  type FileRole,
  type SectionKey,
} from "./contextSummary";
import { ModuleOptionsFields } from "./ModuleOptionsFields";
import { RowEditor } from "./RowEditor";
import { ROW_SPECS, type RowKind } from "./rows";
import { ValuationFields } from "./ValuationFields";
import {
  ANY_FOCUS,
  ATTACHMENTS,
  ISSUER_LIST_BOXES,
  ISSUER_TEXT_BOXES,
  LEGAL_CHOICES,
  LEGAL_DOCUMENTS,
  LISTED_EQUITY,
  TICKER,
} from "./plain";
import type { IntakeView } from "./intake";
import { problemAttrs, FieldMessage, SelectField } from "./fields";

/** The row editors of the research section, and of the ratings, quotes and facilities section. */
const RESEARCH_ROWS = ["research_questions"] as const;
const DEAL_ROWS = ["ratings", "quotes", "deal_terms"] as const;

const LABEL = cx(label, "text-small");
const HINT = "text-caption text-text-secondary";
const CHECK =
  "flex items-center gap-2 text-small font-medium text-text-primary max-[480px]:min-h-11";
/** Every text box and choice in a section is 44 px tall at phone width, the row editors' too. */
const BODY =
  "grid items-start gap-4 px-4 pt-1 pb-4 lg:grid-cols-2 max-[480px]:[&_input:not([type=checkbox])]:min-h-11 max-[480px]:[&_select]:min-h-11";

type SectionProps = { title: string; summary: string; open: boolean };

/**
 * One disclosure of the step: its title and a line saying what is set, the fields under it. The
 * sections share a `name`, so the browser keeps one open at a time, by pointer or keyboard, and
 * `focusField` opening the section of a problem closes the one that was open.
 */
function Section({ title, summary, open, children }: SectionProps & { children: ReactNode }) {
  return (
    <details name="context-section" open={open || undefined} className="group/section min-w-0">
      <summary className="grid min-h-8 cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 rounded-ds-md px-4 py-2 outline-focus-ring focus-visible:outline-2 focus-visible:-outline-offset-2 max-[480px]:min-h-11 sm:grid-cols-[15rem_minmax(0,1fr)_auto] [&::-webkit-details-marker]:hidden">
        <h3 className="text-body font-medium text-text-primary">{title}</h3>
        <span className="col-start-1 text-small text-text-secondary sm:col-start-2 sm:row-start-1">
          {summary}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="col-start-2 row-span-2 row-start-1 size-4 self-center text-text-tertiary transition-transform duration-150 group-open/section:rotate-180 motion-reduce:transition-none sm:col-start-3 sm:row-span-1"
        />
      </summary>
      <div className={BODY}>{children}</div>
    </details>
  );
}

type SectionOf = (key: SectionKey, summary: string) => SectionProps;

/**
 * The step opens with the section holding the field with a problem, else Dates and periods for an
 * Earnings Update (its periods are required), else none. It is opened once, when the step is
 * drawn: from then on the analyst's own opening and closing is never overridden.
 */
function useSections(view: IntakeView): SectionOf {
  const [first] = useState(
    () => sectionOfField(view.problem?.field) ?? (view.earnings ? "dates" : undefined),
  );
  return (key, summary) => ({ title: SECTION_TITLES[key], summary, open: key === first });
}

export function ContextFields({ view }: { view: IntakeView }) {
  const section = useSections(view);
  const roles = fileRoles(view);
  return (
    <div className="min-w-0 divide-y divide-border-hairline rounded-ds-md border border-border-hairline sm:col-span-2">
      <Section {...section("research", researchSummary(view))}>
        <AnalystNoteField view={view} />
        <RowEditors view={view} kinds={RESEARCH_ROWS} />
      </Section>
      <Section {...section("dates", datesSummary(view))}>
        <DateFields view={view} />
      </Section>
      <Section {...section("legal", legalSummary(view))}>
        <LegalFields view={view} />
      </Section>
      {roles.length > 0 && (
        <Section {...section("files", filesSummary(view, roles))}>
          <FileRoleFields view={view} roles={roles} />
        </Section>
      )}
      <Section {...section("deal", dealSummary(view))}>
        <RowEditors view={view} kinds={DEAL_ROWS} />
      </Section>
      <Section {...section("issuer", issuerSummary(view))}>
        <IssuerDetailsFields view={view} />
      </Section>
      <AdvancedSections view={view} section={section} />
    </div>
  );
}

/** A reporting period: required, and marked so, only when the pathway compares two periods. */
function PeriodField({
  view,
  field: key,
  title,
  placeholder,
}: {
  view: IntakeView;
  field: "current_period" | "prior_period";
  title: string;
  placeholder: string;
}) {
  return (
    <div className="grid content-start gap-1">
      <label className={LABEL}>
        {view.earnings ? (
          <>
            {title} <span className="font-normal text-text-tertiary">(required)</span>
          </>
        ) : (
          title
        )}
        <input
          className={field}
          aria-required={view.earnings || undefined}
          {...problemAttrs(view.problem, key)}
          placeholder={placeholder}
          value={view.run[key] ?? ""}
          onChange={(event) => {
            view.changeRun(key, event.target.value.trim().toLowerCase());
          }}
        />
      </label>
      <FieldMessage problem={view.problem} field={key} />
    </div>
  );
}

function AnalystNoteField({ view }: { view: IntakeView }) {
  return (
    <div className="grid gap-1 lg:col-span-2">
      <label className={LABEL}>
        Anything the analysis should know
        <textarea
          aria-describedby="run-analyst-questions"
          {...problemAttrs(view.problem, "analyst_note")}
          className={field}
          rows={3}
          placeholder="For example, the committee wants a view on the 2028 maturities."
          value={view.analystNote}
          onChange={(event) => {
            view.changeAnalystNote(event.target.value);
          }}
        />
      </label>
      <FieldMessage problem={view.problem} field="analyst_note" />
      <p id="run-analyst-questions" className={HINT}>
        Your note is included in the run’s research questions.
      </p>
    </div>
  );
}

function DateFields({ view }: { view: IntakeView }) {
  return (
    <>
      <label className={LABEL}>
        Date of your newest file
        <input
          className={field}
          type="date"
          value={view.newest}
          onChange={(event) => {
            view.changeNewestOverride(event.target.value);
          }}
        />
      </label>
      <div className="grid content-start gap-1">
        <label className={LABEL}>
          Research cutoff
          <input
            className={field}
            type="date"
            {...problemAttrs(view.problem, "cutoff")}
            value={view.run.cutoff || view.run.as_of}
            max={view.run.as_of || undefined}
            onChange={(event) => {
              view.changeRun("cutoff", event.target.value);
            }}
          />
        </label>
        <FieldMessage problem={view.problem} field="cutoff" />
      </div>
      <PeriodField
        view={view}
        field="current_period"
        title="Current period"
        placeholder="q3-2026"
      />
      <PeriodField view={view} field="prior_period" title="Prior period" placeholder="q2-2026" />
    </>
  );
}

function LegalFields({ view }: { view: IntakeView }) {
  return (
    <>
      <SelectField
        title={LEGAL_DOCUMENTS}
        value={view.legal}
        choices={LEGAL_CHOICES}
        problem={view.problem}
        problemField="legal_documents"
        onChange={view.changeLegal}
      />
      {view.legal !== "none" && (
        <SelectField
          title="The agreement"
          value={view.attachments.agreement ?? ""}
          choices={view.fileChoices}
          problem={view.problem}
          problemField="agreement"
          onChange={(value) => {
            view.changeAttachment("agreement", value);
          }}
        />
      )}
    </>
  );
}

/** Files with a role: the boxes `fileRoles` says the pathway and form level draw. */
function FileRoleFields({ view, roles }: { view: IntakeView; roles: readonly FileRole[] }) {
  return roles.map((key) => (
    <SelectField
      key={key}
      title={ATTACHMENTS[key]}
      value={view.attachments[key] ?? ""}
      choices={view.fileChoices}
      onChange={(value) => {
        view.changeAttachment(key, value);
      }}
    />
  ));
}

function IssuerDetailsFields({ view }: { view: IntakeView }) {
  return (
    <>
      {ISSUER_TEXT_BOXES.map(([key, title, example]) => (
        <label key={key} className={LABEL}>
          {title}
          <input
            className={field}
            placeholder={`e.g. ${example}`}
            value={view.identity[key] ?? ""}
            onChange={(event) => {
              view.changeIdentity(key, event.target.value);
            }}
          />
        </label>
      ))}
      {ISSUER_LIST_BOXES.map(([key, title], at) => (
        <label key={key} className={cx(LABEL, at === 0 && "lg:col-start-1")}>
          {title}
          <textarea
            className={field}
            placeholder="One per line"
            defaultValue={(view.identity[key] ?? []).join("\n")}
            key={view.copy?.run ?? "new"}
            onChange={(event) => {
              view.changeIdentity(
                key,
                event.target.value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              );
            }}
          />
        </label>
      ))}
      <label className={CHECK}>
        <input
          type="checkbox"
          checked={view.identity.listed_equity ?? false}
          onChange={(event) => {
            view.changeListedEquity(event.target.checked);
          }}
        />{" "}
        {LISTED_EQUITY}
      </label>
      {view.identity.listed_equity && (
        <label className={LABEL}>
          {TICKER}
          <input
            className={field}
            value={view.identity.ticker ?? ""}
            onChange={(event) => {
              view.changeIdentity("ticker", event.target.value);
            }}
          />
        </label>
      )}
    </>
  );
}

function RowEditors({ view, kinds }: { view: IntakeView; kinds: readonly RowKind[] }) {
  const focusChoices = [
    ["", ANY_FOCUS] as const,
    ...drawnModules(pathwayModules(view.run.pathway)).map((id) => [id, moduleName(id)] as const),
  ];
  return (
    <div className="grid gap-4 lg:col-span-2">
      {kinds.map((kind) => (
        <section key={kind} aria-labelledby={`rows-${kind}`} className="grid gap-2">
          <h4 id={`rows-${kind}`} className="text-small font-medium text-text-primary">
            {ROW_SPECS[kind].section}
          </h4>
          <RowEditor
            kind={kind}
            rows={view.rowsOf(kind)}
            onChange={(next) => {
              view.changeRows(kind, next);
            }}
            primary={view.run.run_type === "primary"}
            required={kind === "deal_terms" && view.run.run_type === "primary"}
            focusChoices={focusChoices}
            error={view.problem?.field === kind ? view.problem.message : undefined}
          />
        </section>
      ))}
    </div>
  );
}

/**
 * Valuation and module options, scenario assumptions, and the model and modules: each drawn on an
 * Advanced form, and the first three also on a Basic one that holds (or was refused on) them.
 */
function AdvancedSections({ view, section }: { view: IntakeView; section: SectionOf }) {
  const advanced = view.level === "advanced";
  const named = view.problem?.field;
  const valuation =
    advanced ||
    view.forms.valuation !== undefined ||
    view.forms.module_options !== undefined ||
    named === "valuation" ||
    named === "module_options";
  const runs = { cp3: view.requested.includes("CP-3"), cp6: view.requested.includes("CP-6") };
  const assumptions = advanced || Boolean(view.forms.assumptions) || named === "assumptions";
  return (
    <>
      {valuation && (
        <Section {...section("valuation", valuationSummary(view.valuation))}>
          <div className="lg:col-span-2">
            <ValuationFields
              form={view.valuation}
              onChange={view.changeValuation}
              marker={problemAttrs(view.problem, "valuation")}
              message={<FieldMessage problem={view.problem} field="valuation" />}
            />
          </div>
        </Section>
      )}
      {valuation && (runs.cp3 || runs.cp6) && (
        <Section {...section("module_options", moduleOptionsSummary(view.moduleOptions, runs))}>
          <ModuleOptionsFields
            form={view.moduleOptions}
            runs={runs}
            onChange={view.changeModuleOptions}
            marker={problemAttrs(view.problem, "module_options")}
            message={<FieldMessage problem={view.problem} field="module_options" />}
          />
        </Section>
      )}
      {assumptions && (
        <Section {...section("assumptions", assumptionsSummary(view.assumptions, view.requested))}>
          <div className="grid gap-3 lg:col-span-2">
            <p className="text-small text-text-secondary">
              Optional. Pin a value only where you hold a house view; otherwise the module chooses.
            </p>
            <AssumptionFields
              form={view.assumptions}
              modules={view.requested}
              onChange={view.changeAssumptions}
              marker={problemAttrs(view.problem, "assumptions")}
              message={<FieldMessage problem={view.problem} field="assumptions" />}
            />
          </div>
        </Section>
      )}
      {advanced && (
        <Section {...section("model", modelSummary(view))}>
          <ModelFields view={view} />
        </Section>
      )}
    </>
  );
}

function ModelFields({ view }: { view: IntakeView }) {
  const { efforts, models, effortChoices, effort } = modelChoices(view);
  return (
    <>
      <SelectField title="Model" value={view.model} choices={models} onChange={view.changeModel} />
      <SelectField
        title="Reasoning effort"
        value={effort}
        choices={effortChoices}
        disabled={!efforts.length}
        onChange={view.changeEffort}
      />
      <div className="grid content-start gap-1">
        <label className={LABEL}>
          Turns per module
          <input
            className={field}
            type="number"
            required
            min={1}
            max={64}
            step={1}
            {...problemAttrs(view.problem, "turns")}
            value={view.turns}
            onChange={(event) => {
              view.changeTurns(event.target.value);
            }}
          />
        </label>
        <FieldMessage problem={view.problem} field="turns" />
      </div>
      <fieldset className="min-w-0 lg:col-span-2">
        <legend className="mb-2 text-small font-medium text-text-primary">Requested modules</legend>
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          {drawnModules(view.requested).map((code) => (
            <label key={code} className={cx(CHECK, "font-normal")}>
              <input
                type="checkbox"
                checked={!view.modules.length || view.modules.includes(code)}
                disabled={drawnModules(view.modules).length === 1 && view.modules.includes(code)}
                onChange={(event) => {
                  view.toggleModule(code, event.target.checked);
                }}
              />{" "}
              {moduleName(code)}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
