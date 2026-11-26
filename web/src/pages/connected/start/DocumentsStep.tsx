import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { File05, Folder } from "@untitledui/icons";
import { FileUpload } from "@/components/application/file-upload/file-upload-base";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { field } from "../layout";
import { StatusBadge } from "@/components/status/StatusBadge";
import { serviceText } from "../api";
import { ISSUE_CLASSES, ISSUE_CLASSIFICATION, ISSUER_ID, storedName } from "./plain";
import type { LimitGroup } from "./limits";
import { OUTCOME_STATE, moduleNames } from "./limitWords";
import {
  SOURCE_TYPE_HINT,
  type DocumentRow,
  type IntakeView,
  documentsRead,
  carriedIntro,
} from "./intake";
import { FieldMessage, problemAttrs, problemOn, SelectField } from "./fields";
import { ComparisonPortfolio } from "./ComparisonPortfolio";
import { StandingPortfolios } from "./StandingPortfolios";

/** At least 32 px tall everywhere, 44 px at phone width. */
const TARGET = "min-h-8 max-[480px]:min-h-11";
const FIELD = cx(field, "text-body", TARGET);
/** The service's kind for a file: a quiet label, not a control, in sentence case. */
const KIND_LABEL =
  "inline-flex max-w-full items-center rounded-ds-xs bg-surface-subtle px-1.5 py-0.5 text-caption break-words text-text-secondary";

const kindWords = (kind: string) => {
  const words = kind.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

function documentBadge({
  repeat,
  reason,
  description,
  pendingCopy,
  copied,
}: {
  repeat?: string;
  reason?: string;
  description?: string;
  pendingCopy: DocumentRow["pendingCopy"];
  copied: DocumentRow["copied"];
}) {
  if (repeat) return { color: "error", text: "Repeated content" } as const;
  if (reason) return { color: "error", text: "Ignored" } as const;
  if (description) return { color: "success", text: "Inspected" } as const;
  if (pendingCopy) return { color: "gray", text: "Will be copied" } as const;
  return { color: "gray", text: copied ? "Copied" : "Selected" } as const;
}

/** The service's facts about a read file: its description without the kind the chip carries. */
function factsOf(description: string | undefined, kind: string | undefined) {
  if (!description || !kind) return description;
  const words = kind.replaceAll("_", " ");
  return description === words ? "" : description.replace(`${words} · `, "");
}

function IntakeDocumentRow({
  row,
  view,
  onRemove,
}: {
  row: DocumentRow;
  view: IntakeView;
  onRemove: () => void;
}) {
  const { name, stored, file, pendingCopy, copied } = row;
  const repeat = file ? view.repeatedContent.get(file) : undefined;
  const reason = repeat ?? (stored ? view.ignored.get(stored) : undefined);
  const description = stored ? view.inspected.get(stored) : undefined;
  const record = stored ? view.shownDocs.find((doc) => storedName(doc) === stored) : undefined;
  const badge = documentBadge({ repeat, reason, description, pendingCopy, copied });
  const uploading = view.busy === "documents" && file !== undefined && !stored;
  const facts = reason || factsOf(description, record?.kind);
  return (
    <li className="flex min-w-0 items-start gap-3 py-3 text-small">
      <File05 aria-hidden="true" className="mt-1 size-5 shrink-0 text-text-tertiary" />
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="font-medium wrap-anywhere text-text-primary">{name}</p>
        <div className="flex flex-wrap items-center gap-2">
          {record?.kind && (
            <span
              className={cx(
                KIND_LABEL,
                // A file the service could not place is a gap, drawn with the gap's edge.
                record.kind === "unrecognised" &&
                  "border border-dashed border-border-gap bg-transparent text-gap-text",
              )}
            >
              {kindWords(record.kind)}
            </span>
          )}
          {uploading ? (
            <StatusBadge set="File state" state="Uploading" />
          ) : (
            <Badge size="sm" color={badge.color}>
              {badge.text}
            </Badge>
          )}
        </div>
        {facts && <p className="wrap-anywhere text-text-secondary">{facts}</p>}
      </div>
      <Button
        size="sm"
        color="secondary"
        className={TARGET}
        data-remove
        aria-label={`Remove ${name}`}
        isDisabled={view.busy !== undefined}
        onPress={onRemove}
      >
        Remove
      </Button>
    </li>
  );
}

function MissingRow({ group, pathway }: { group: LimitGroup; pathway: string }) {
  const fixes = [
    ...new Set(group.causes.map((cause) => serviceText(cause.fix ?? "", pathway)).filter(Boolean)),
  ];
  const also = moduleNames(group.consequences, pathway);
  return (
    <li className="grid gap-1 py-3 text-small">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge set="Run limits" state={OUTCOME_STATE[group.outcome]} />
        <span className="font-medium text-text-primary">
          {moduleNames(group.causes, pathway).join(", ")}
        </span>
      </div>
      {group.causes.map((cause) => (
        <p key={cause.id} className="wrap-anywhere text-text-secondary">
          {serviceText(cause.reason, pathway)}
        </p>
      ))}
      {fixes.map((fix) => (
        <p key={fix} className="wrap-anywhere text-text-primary">
          {fix}
        </p>
      ))}
      {also.length > 0 && (
        <p className="wrap-anywhere text-text-tertiary">Also affects: {also.join(", ")}</p>
      )}
    </li>
  );
}

function MissingList({
  groups,
  name,
  pathway,
}: {
  groups: readonly LimitGroup[];
  name: string;
  pathway: string;
}) {
  return (
    <ul aria-label={name} className="divide-y divide-border-hairline">
      {groups.map((group) => (
        <MissingRow key={group.key} group={group} pathway={pathway} />
      ))}
    </ul>
  );
}

/** What a review found: what is missing or limiting first, then what only needs checking. */
function MissingForModules({
  missing,
  pathway,
}: {
  missing: NonNullable<IntakeView["missing"]>;
  pathway: string;
}) {
  const lacking = missing.filter((group) => group.outcome !== "check");
  const toCheck = missing.filter((group) => group.outcome === "check");
  return (
    <div className="grid gap-2 sm:col-span-2">
      <h3 className="text-h4 font-medium">Missing for the modules</h3>
      {missing.length === 0 ? (
        <p className="text-small text-text-secondary">Nothing was missing at your last review.</p>
      ) : (
        <>
          <p className="text-small text-text-secondary">
            At your last review. Review the run again after adding files.
          </p>
          {lacking.length > 0 && (
            <MissingList groups={lacking} name="Missing for the modules" pathway={pathway} />
          )}
          {toCheck.length > 0 && (
            <>
              <h4 className="text-body font-medium">To check</h4>
              <MissingList groups={toCheck} name="To check" pathway={pathway} />
            </>
          )}
        </>
      )}
    </div>
  );
}

/** A control's label with "Required" said in words beside it, as the row editors do. */
function Labelled({
  text,
  required = true,
  children,
}: {
  text: string;
  required?: boolean;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="min-w-0 text-small font-medium text-text-primary">
          {text}
        </label>
        {required && (
          <span className="text-caption font-medium whitespace-nowrap text-text-secondary">
            Required
          </span>
        )}
      </div>
      {children(id)}
    </>
  );
}

/**
 * After a file is removed focus goes to the next file's Remove, else the previous one's, else the
 * drop zone's file button, so it never falls to the page. Returns the handler to call on Remove.
 */
function useFocusAfterRemove(root: RefObject<HTMLDivElement | null>, count: number) {
  const pending = useRef<{ index: number; count: number } | undefined>(undefined);
  useEffect(() => {
    const at = pending.current;
    if (!at || count >= at.count) return;
    pending.current = undefined;
    const removes = root.current?.querySelectorAll<HTMLElement>("[data-remove]");
    const target =
      removes && removes.length > 0
        ? removes[Math.min(at.index, removes.length - 1)]
        : root.current?.querySelector<HTMLElement>("[data-dropzone] button");
    target?.focus();
  }, [count, root]);
  return (index: number) => {
    pending.current = { index, count };
  };
}

export function DocumentFields({
  view,
  folderInput,
}: {
  view: IntakeView;
  folderInput: RefObject<HTMLInputElement | null>;
}) {
  const root = useRef<HTMLDivElement>(null);
  const removing = useFocusAfterRemove(root, view.documentRows.length);
  return (
    <>
      <FileUpload.Root ref={root} className="sm:col-span-2">
        <FileUpload.DropZone
          inputLabel="Documents"
          hint={`Add ${SOURCE_TYPE_HINT}. Up to 50 MB per file.`}
          isDisabled={view.busy !== undefined}
          onDropFiles={view.addFiles}
          className="min-h-40 justify-center border border-dashed border-border-container bg-surface-subtle py-10 ring-0 [&_button]:min-h-8 max-[480px]:[&_button]:min-h-11 [&_div:has(>button)]:items-center"
        />
        {view.selectionProblem && (
          <p
            role="alert"
            className="rounded-ds-sm border border-error-edge bg-error-fill px-3 py-2 text-small text-error-text"
          >
            {view.selectionProblem}
          </p>
        )}
        <input
          ref={folderInput}
          className="sr-only"
          aria-label="Document folder"
          tabIndex={-1}
          type="file"
          multiple
          {...{ webkitdirectory: "" }}
          onChange={(event) => {
            view.addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            color="secondary"
            className={TARGET}
            iconLeading={Folder}
            onPress={() => folderInput.current?.click()}
          >
            Choose a folder
          </Button>
          <Button
            color="secondary"
            className={TARGET}
            isDisabled={!view.canRead || view.busy !== undefined}
            onPress={view.inspectDocuments}
          >
            {view.busy === "documents" ? "Reading documents…" : "Inspect documents"}
          </Button>
          <p className="text-small text-text-tertiary">
            Optional. Continue reads the documents too.
          </p>
        </div>
        <p role="status" className="text-small text-text-secondary empty:hidden">
          {view.read && view.documentRows.length > 0 ? (
            <span key={view.inspections}>
              {documentsRead(view.shownDocs.length, view.ignored.size)}
            </span>
          ) : null}
        </p>
        {view.documentRows.length > 0 ? (
          <FileUpload.List
            aria-label="Documents added"
            className="gap-0 divide-y divide-border-hairline"
          >
            {view.documentRows.map((row, index) => (
              <IntakeDocumentRow
                key={`${row.name}-${String(index)}`}
                row={row}
                view={view}
                onRemove={() => {
                  removing(index);
                  view.discardDocument(row.name, row.file);
                }}
              />
            ))}
          </FileUpload.List>
        ) : (
          <p className="text-small text-text-secondary">No documents yet.</p>
        )}
        {view.missing === undefined && view.documentRows.length > 0 && (
          // One quiet line, not a panel: the list above is the step's subject.
          <p className="text-small text-text-tertiary">
            Which modules each file serves is not reported before review.
          </p>
        )}
      </FileUpload.Root>
      {view.missing !== undefined && (
        <MissingForModules missing={view.missing} pathway={view.run.pathway} />
      )}
      <StandingPortfolios view={view.standing} />
      <ComparisonPortfolio
        view={view.comparison}
        problem={view.problem}
        busy={view.busy !== undefined}
      />
      <div className="grid gap-2 sm:col-span-2">
        <h3 className="text-h4 font-medium">Issuer and case date</h3>
        {view.copy && (
          <>
            <p className="text-small text-text-secondary">{carriedIntro(view.copy.prior)}</p>
            <Button
              href={`/run/${encodeURIComponent(view.copy.run)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Open source run (opens in a new tab)"
              color="link-gray"
              size="sm"
              className={cx("w-fit", TARGET)}
            >
              Open source run
            </Button>
          </>
        )}
        {view.priorNote && (
          <p role="status" className="text-small text-text-secondary">
            {view.priorNote}
          </p>
        )}
      </div>
      <div className="grid content-start gap-1.5">
        <Labelled text="Issuer name">
          {(id) => (
            <input
              id={id}
              className={FIELD}
              required
              placeholder="e.g. Northbridge Group plc"
              {...problemAttrs(view.problem, "issuer_name")}
              value={view.identity.issuer_name}
              onChange={(event) => {
                view.changeIdentity("issuer_name", event.target.value);
              }}
            />
          )}
        </Labelled>
        <FieldMessage problem={view.problem} field="issuer_name" />
      </div>
      <div className="grid content-start gap-1.5">
        <Labelled text={ISSUER_ID}>
          {(id) => (
            <input
              id={id}
              className={FIELD}
              required
              pattern="[a-z0-9][a-z0-9\-]{0,39}"
              maxLength={40}
              placeholder="e.g. northbridge-group-plc"
              {...problemAttrs(view.problem, "issuer_id")}
              value={view.issuerId}
              readOnly={!!view.copy}
              onChange={(event) => {
                view.changeIssuerId(event.target.value);
              }}
            />
          )}
        </Labelled>
        <FieldMessage problem={view.problem} field="issuer_id" />
        {view.problem?.field === "issuer_id" && view.problem.offer && (
          <div>
            <Button
              color="secondary"
              size="sm"
              className={TARGET}
              onPress={() => {
                view.useIssuerId(view.problem?.offer ?? "");
              }}
            >
              {`Use ${view.problem.offer}`}
            </Button>
          </div>
        )}
        <p className="text-small text-text-secondary">
          Letters a–z, digits and hyphens, up to 40 characters.
        </p>
        {view.issuerNotice && <p className="text-small text-text-secondary">{view.issuerNotice}</p>}
      </div>
      <div className="grid content-start gap-1.5">
        <Labelled text="As-of date">
          {(id) => (
            <input
              id={id}
              className={FIELD}
              type="date"
              required
              {...problemAttrs(view.problem, "as_of")}
              value={view.run.as_of}
              onChange={(event) => {
                view.changeRun("as_of", event.target.value);
              }}
            />
          )}
        </Labelled>
        <FieldMessage problem={view.problem} field="as_of" />
      </div>
      <div className="[&_select]:min-h-8 max-[480px]:[&_select]:min-h-11">
        <SelectField
          title={ISSUE_CLASSIFICATION}
          value={view.identity.issue_classification ?? ""}
          choices={{ "": "Choose classification", ...ISSUE_CLASSES }}
          onChange={(value) => {
            view.changeIdentity("issue_classification", value);
          }}
        />
      </div>
      <div className="grid gap-1.5">
        <Labelled text="Your name">
          {(id) => (
            <input
              id={id}
              className={FIELD}
              required
              maxLength={80}
              autoComplete="off"
              placeholder="Eric G"
              {...problemAttrs(view.problem, "submitted_by")}
              aria-describedby={
                problemOn(view.problem, "submitted_by") !== undefined
                  ? "error-submitted_by run-analyst-name"
                  : "run-analyst-name"
              }
              value={view.submittedBy}
              onChange={(event) => {
                view.changeSubmittedBy(event.target.value);
              }}
            />
          )}
        </Labelled>
        <FieldMessage problem={view.problem} field="submitted_by" />
        <p id="run-analyst-name" className="text-small text-text-tertiary">
          First name and initial, such as Eric G. Use two initials, such as Eric MG, if a colleague
          has a similar name. Shown on Run activity and in Teams.
        </p>
      </div>
      {view.copy ? (
        <Button color="secondary" className={TARGET} onPress={view.resetIssuer}>
          This is a different issuer
        </Button>
      ) : (
        <Button color="secondary" className={TARGET} onPress={view.carryLatest}>
          Use inputs from latest run
        </Button>
      )}
    </>
  );
}
