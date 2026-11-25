import { useId, useRef } from "react";
import { File05 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { field } from "../layout";
import { FieldMessage, problemAttrs, SelectField, type ShownProblem } from "./fields";
import {
  COMPARISON_EXPLANATION,
  COMPARISON_HOLDS,
  COMPARISON_HOLDS_CHOICES,
  COMPARISON_NAME,
  COMPARISON_TITLE,
  comparisonFacts,
} from "./plain";
import { COMPARISON_FILE_HINT, type ComparisonView } from "./referencePortfolio";

/** At least 32 px tall everywhere, 44 px at phone width. */
const TARGET = "min-h-8 max-[480px]:min-h-11";

/** The finding the date sentence already says; the rest are shown as the service wrote them. */
const SAID = /^The files state no as-of date/;

function Result({ view }: { view: ComparisonView }) {
  const { result } = view;
  if (!result) return null;
  const notes = result.findings.filter((finding) => !SAID.test(finding));
  return (
    <div className="grid gap-1 rounded-ds-sm border border-border-hairline bg-surface-subtle px-3 py-2 text-small">
      <p className="font-medium wrap-anywhere text-text-primary">{result.name}</p>
      <p className="wrap-anywhere text-text-secondary">{comparisonFacts(result).join(" ")}</p>
      {notes.length > 0 && (
        <ul aria-label="Notes on the portfolio's files" className="list-disc pl-5">
          {notes.map((note) => (
            <li key={note} className="wrap-anywhere text-text-secondary">
              {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The Documents step's optional comparison portfolio: a name, what it holds, its files, and what
 * the service read from them. Its files are not documents of the run.
 */
export function ComparisonPortfolio({
  view,
  problem,
  busy,
}: {
  view: ComparisonView;
  problem?: ShownProblem;
  busy: boolean;
}) {
  const titleId = useId();
  const nameId = useId();
  const helpId = useId();
  const input = useRef<HTMLInputElement>(null);
  const started = view.files.length > 0 || view.name !== "" || view.holds !== "";
  return (
    <section aria-labelledby={titleId} className="grid gap-3 sm:col-span-2">
      <div className="grid gap-1">
        <h3 id={titleId} className="text-h4 font-medium">
          {COMPARISON_TITLE}
        </h3>
        <p id={helpId} className="reading-copy text-small text-text-secondary">
          {COMPARISON_EXPLANATION}
        </p>
      </div>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <label htmlFor={nameId} className="text-small font-medium text-text-primary">
            {COMPARISON_NAME}
          </label>
          <input
            id={nameId}
            className={cx(field, "text-body", TARGET)}
            maxLength={80}
            autoComplete="off"
            {...problemAttrs(problem, "reference_portfolio")}
            value={view.name}
            onChange={(event) => {
              view.changeName(event.target.value);
            }}
          />
          <FieldMessage problem={problem} field="reference_portfolio" />
        </div>
        <div className="[&_select]:min-h-8 max-[480px]:[&_select]:min-h-11">
          <SelectField
            title={COMPARISON_HOLDS}
            value={view.holds}
            choices={COMPARISON_HOLDS_CHOICES}
            onChange={view.changeHolds}
          />
        </div>
      </div>
      <input
        ref={input}
        className="sr-only"
        aria-label="Comparison portfolio files"
        aria-describedby={helpId}
        tabIndex={-1}
        type="file"
        multiple
        accept=".csv,.xlsx"
        onChange={(event) => {
          view.addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button color="secondary" className={TARGET} onPress={() => input.current?.click()}>
          Choose portfolio files
        </Button>
        <Button
          color="secondary"
          className={TARGET}
          isDisabled={view.files.length === 0 || busy}
          onPress={view.read}
        >
          Read portfolio
        </Button>
        {started && (
          <Button color="secondary" className={TARGET} isDisabled={busy} onPress={view.remove}>
            Remove comparison portfolio
          </Button>
        )}
        <p className="text-small text-text-tertiary">{COMPARISON_FILE_HINT}</p>
      </div>
      {view.fileProblem && (
        <p
          role="alert"
          className="rounded-ds-sm border border-error-edge bg-error-fill px-3 py-2 text-small text-error-text"
        >
          {view.fileProblem}
        </p>
      )}
      {view.files.length > 0 && (
        <ul
          aria-label="Comparison portfolio files chosen"
          className="divide-y divide-border-hairline"
        >
          {view.files.map((file) => (
            <li key={file.name} className="flex min-w-0 items-center gap-3 py-2 text-small">
              <File05 aria-hidden="true" className="size-5 shrink-0 text-text-tertiary" />
              <span className="min-w-0 flex-1 font-medium wrap-anywhere text-text-primary">
                {file.name}
              </span>
              <Button
                size="sm"
                color="secondary"
                className={TARGET}
                aria-label={`Remove ${file.name} from the comparison portfolio`}
                isDisabled={busy}
                onPress={() => {
                  view.removeFile(file);
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div role="status" className="empty:hidden">
        <Result view={view} />
      </div>
    </section>
  );
}
