import { useId } from "react";
import { containsReference, readParagraph, type OutputEntry } from "../../publishedReport";
import { GapPattern } from "../overview/figureParts";
import { bottomLine } from "../overview/read";
import { GapNote } from "../overview/Tile";
import { FigureTile, GapTile, LeadFrame } from "./kit/LeadFrame";
import { svgId } from "./kit/marks/text";
import { IN_EVIDENCE } from "./kit/reader";
import type { Lead, LeadProps } from "./types";
import {
  clearance,
  issues,
  moduleIntegrity,
  remediation,
  saidText,
  type Issue,
  type Issues,
  type Said,
  type Severity,
  type Shape,
} from "./validationData";

const WORD: Record<Shape, string> = {
  filled: "filled circle",
  half: "half-filled circle",
  slash: "struck circle",
  ring: "empty circle",
};

/** A status as a shape: the word always sits beside it. */
function StatusMark({
  shape,
  size = 16,
  named = false,
}: {
  shape: Shape;
  size?: number;
  /** The mark is the status's only shape: it is an image with the shape's name (not visible text). */
  named?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      {...(named ? { role: "img", "aria-label": WORD[shape] } : { "aria-hidden": true })}
      data-shape={shape}
      className="flex-none"
    >
      {shape === "filled" && <circle cx="8" cy="8" r="6.5" className="fill-chart-1" />}
      {shape === "half" && (
        <>
          <circle
            cx="8"
            cy="8"
            r="6"
            strokeWidth="1.5"
            className="fill-surface-card stroke-chart-1"
          />
          <path d="M8 2a6 6 0 0 0 0 12z" className="fill-chart-1" />
        </>
      )}
      {shape === "slash" && (
        <>
          <circle
            cx="8"
            cy="8"
            r="6"
            strokeWidth="1.5"
            className="fill-surface-card stroke-chart-1"
          />
          <line
            x1="3.8"
            y1="12.2"
            x2="12.2"
            y2="3.8"
            strokeWidth="1.5"
            className="stroke-chart-1"
          />
        </>
      )}
      {shape === "ring" && (
        <circle
          cx="8"
          cy="8"
          r="6"
          strokeWidth="1.5"
          className="fill-surface-card stroke-chart-3"
        />
      )}
    </svg>
  );
}

function inkOf(severity: Severity) {
  if (!severity.stated) return "gap";
  if (!severity.known) return "neutral";
  return ({ Critical: "critical", Material: "material", Minor: "minor" } as const)[
    severity.level ?? "Critical"
  ];
}

const FILL = {
  critical: "fill-warning-mark stroke-text-primary",
  material: "fill-warning-fill stroke-warning-mark",
  minor: "fill-chart-3 stroke-chart-3",
  neutral: "fill-surface-card stroke-chart-3",
} as const;

const KIND_WORD = { gap: "Gap", contradiction: "Contradiction" } as const;

/** One issue's mark: a circle for a gap, a square for a contradiction, inked by its severity word. */
function IssueMark({
  kind,
  severity,
  counted = true,
}: {
  kind: Issue["kind"];
  severity: Severity;
  /** The mark of a row in the issues list (tests read `data-pip`); the remediation list's is decoration. */
  counted?: boolean;
}) {
  const hatch = svgId(useId(), "mark");
  const ink = inkOf(severity);
  const props = {
    "data-pip": counted ? kind : undefined,
    "data-severity": severity.word,
    strokeWidth: 2,
    className: ink === "gap" ? "stroke-border-gap" : FILL[ink],
    fill: ink === "gap" ? `url(#${hatch})` : undefined,
  };
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className="mt-1 flex-none">
      <defs>
        <GapPattern id={hatch} />
      </defs>
      {kind === "gap" ? (
        <circle cx="8" cy="8" r="7" {...props} />
      ) : (
        <rect x="1" y="1" width="14" height="14" rx="2" {...props} />
      )}
    </svg>
  );
}

/** A cell of an issue as words: its text, the stated gap, or the in-Evidence sentence. */
function issueWords(value: Said) {
  return saidText(value) || null;
}

function registerNote(name: string, state: string) {
  if (state === "absent") return `This page could not read a list of ${name}.`;
  if (state === "duplicate")
    return `This page found more than one list of ${name} and read none of them.`;
  return null;
}

/** The note for the contradictions register: none when the module's own map of contradiction is drawn. */
const contradictionsNote = (found: Issues) =>
  found.mapped && found.contradictions.state === "absent"
    ? null
    : registerNote("contradictions", found.contradictions.state);

/** Why no issue is drawn, in words; null when at least one issue is listed. */
function noIssues(found: Issues) {
  const { gaps, contradictions, total, placeholders } = found;
  if (total > 0) return null;
  const stated = [gaps, contradictions].filter((register) => register.state === "none");
  if (stated.length === 2) return "No issues are listed.";
  if (stated.length === 1) {
    const note = [registerNote("gaps", gaps.state), contradictionsNote(found)].find(
      (item) => item !== null,
    );
    return `No ${gaps.state === "none" ? "gaps" : "contradictions"} are listed. ${note ?? ""}`.trim();
  }
  const why = placeholders.length ? ` It reads: ${placeholders.join("; ")}.` : "";
  return `This page could not read a list of gaps or contradictions.${why}`;
}

/**
 * The issues, grouped by the severity word as written (each word where it first appears in the
 * handoff), each issue its own row. No count is drawn, in the figure, its label or its table.
 */
function IssueList({ found }: { found: Issues }) {
  const none = noIssues(found);
  if (none !== null) return <GapNote>{none}</GapNote>;
  const notes = [registerNote("gaps", found.gaps.state), contradictionsNote(found)].filter(
    (note) => note !== null,
  );
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-4" aria-label="Issues, by severity word">
        {found.groups.map((group) => (
          <li
            key={group.severity.word}
            data-group={group.severity.word}
            className="flex min-w-0 flex-col gap-2"
          >
            <p className="text-small font-medium text-text-primary wrap-anywhere">
              {group.severity.word}
            </p>
            <ul className="flex min-w-0 flex-col gap-2.5">
              {group.issues.map((issue) => (
                <li
                  key={`${issue.kind}-${String(issue.line)}`}
                  data-issue={issue.kind}
                  className="flex min-w-0 gap-3"
                >
                  <IssueMark kind={issue.kind} severity={issue.severity} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-small text-text-primary text-pretty wrap-anywhere">
                      <span className="text-caption font-medium text-text-tertiary">
                        {`${KIND_WORD[issue.kind]} · `}
                      </span>
                      {issueWords(issue.text) ?? "Not stated"}
                    </p>
                    {issueWords(issue.why) && (
                      <p className="text-caption text-text-secondary text-pretty wrap-anywhere">
                        {issueWords(issue.why)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {notes.map((note) => (
        <p key={note} className="text-caption text-text-secondary">
          {note}
        </p>
      ))}
    </div>
  );
}

/** The issues as table rows: the severity word, the kind and what the issue says. */
const issueRows = (found: Issues) =>
  found.groups.flatMap((group) =>
    group.issues.map((issue) => [
      group.severity.word,
      `${KIND_WORD[issue.kind]}: ${issueWords(issue.text) ?? "Not stated"}`,
    ]),
  );

function ClearanceTile(props: LeadProps) {
  const { entry } = props;
  const verdict = clearance(entry);
  const found = issues(entry);
  const integrity = moduleIntegrity(entry);
  if (verdict === null && integrity === null && noIssues(found) !== null)
    return (
      <GapTile span={8} label="Clearance" kicker="Clearance">
        {`This page could not read a clearance status. ${noIssues(found) ?? ""}`.trim()}
      </GapTile>
    );
  const rows = [
    ...(verdict?.status
      ? [["Status", [verdict.status, verdict.scope ?? ""].join(" ").trim()]]
      : []),
    ...(verdict?.after ? [["Clearance note", verdict.after]] : []),
    ...issueRows(found),
    ...(integrity?.map((item) => [item.name, item.result]) ?? []),
  ];
  return (
    <FigureTile
      props={props}
      span={8}
      label="Clearance"
      kicker="Evidence validation"
      title="Clearance"
      line={verdict?.line}
      source="the clearance status"
      table={{
        caption: "Clearance status, issues and module integrity",
        headers: ["Item", "Value"],
        rows,
      }}
    >
      {verdict === null ? (
        <GapNote>This page could not read a clearance status.</GapNote>
      ) : verdict.source === "verdict" && verdict.status !== null ? (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-3">
            {verdict.shape && <StatusMark shape={verdict.shape} size={32} named />}
            <div className="flex min-w-0 flex-col">
              <p
                className="text-h2 text-text-primary wrap-anywhere"
                data-clearance={verdict.status}
              >
                {verdict.status}
              </p>
              {verdict.scope && <p className="text-caption text-text-tertiary">{verdict.scope}</p>}
            </div>
          </div>
          {verdict.notEvaluated && (
            <p className="text-caption text-text-secondary wrap-anywhere">
              Not evaluated: {verdict.notEvaluated}
            </p>
          )}
          {verdict.limit && (
            <p className="text-caption text-text-secondary text-pretty wrap-anywhere">
              {verdict.limit}
            </p>
          )}
          {verdict.after && (
            <p className="text-small text-text-secondary text-pretty wrap-anywhere">
              {verdict.after}
            </p>
          )}
        </div>
      ) : headerDrawsIt(entry) ? (
        // The fallback is the bottom line the header just above already draws: not drawn twice.
        <p className="text-small text-text-secondary">
          This page could not read a clearance status.
        </p>
      ) : (
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-lead text-text-primary text-pretty wrap-anywhere">{verdict.status}</p>
          <p className="text-caption text-text-tertiary">
            This page could not read a clearance status; the summary is shown instead.
          </p>
        </div>
      )}
      <IssueList found={found} />
      {integrity && (
        <div className="flex flex-col gap-2 border-t border-border-hairline pt-4">
          <h4 className="text-small font-medium text-text-primary">Module by module</h4>
          <ul className="flex flex-wrap gap-2">
            {integrity.map((item) => (
              <li
                key={`${item.name}-${String(item.line)}`}
                className="flex min-h-8 min-w-0 items-center gap-2 rounded-ds-sm bg-surface-subtle px-3 py-1 text-caption text-text-secondary"
                data-module-result={item.result}
              >
                <StatusMark shape={item.shape} />
                <span className="min-w-0 wrap-anywhere">
                  <span className="font-medium text-text-primary">{item.name}</span> · {item.result}
                  {item.head ? ` (${item.head})` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </FigureTile>
  );
}

function RemediationTile(props: LeadProps) {
  const { entry } = props;
  const found = issues(entry);
  const list = remediation(entry);
  const listed = found.gaps.state === "rows" ? found.gaps : null;
  if (list === null)
    return (
      <GapTile span={4} label="Remediation" kicker="Remediation">
        {found.gaps.state === "none"
          ? "No gap actions are listed."
          : "This page could not read the actions for the gaps."}
      </GapTile>
    );
  return (
    <FigureTile
      props={props}
      span={4}
      label="Remediation"
      kicker="Actions, in the order stated"
      title="Remediation"
      line={listed?.line}
      source="the remediation list"
      table={{
        caption: "Remediation actions, in the order stated",
        headers: ["Severity", "Action", "Affects"],
        rows: list.map((issue) => [
          issue.severity.word,
          issue.action ? saidText(issue.action) : "",
          issue.affected === "evidence" ? IN_EVIDENCE : (issue.affected ?? []).join(", "),
        ]),
      }}
    >
      <ol className="flex min-w-0 flex-col gap-3">
        {list.map((issue) => (
          <li
            key={issue.line}
            className="flex min-w-0 gap-3"
            data-severity={issue.severity.word}
            data-action-line={issue.line}
          >
            <IssueMark kind="gap" severity={issue.severity} counted={false} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-caption font-medium text-text-tertiary">{issue.severity.word}</p>
              {issue.action?.kind === "text" ? (
                <p className="text-small text-text-primary text-pretty wrap-anywhere">
                  {issue.action.text}
                </p>
              ) : (
                <p className="text-small text-gap-text text-pretty wrap-anywhere">
                  {issue.action?.kind === "gap"
                    ? saidText(issue.action).replace(/^Not supplied\b/, "Action not supplied")
                    : issue.action?.kind === "evidence"
                      ? IN_EVIDENCE
                      : "This page could not read an action for this gap."}
                </p>
              )}
              {Array.isArray(issue.affected) && issue.affected.length > 0 && (
                <p className="text-caption text-text-secondary wrap-anywhere">
                  Affects: {issue.affected.join(", ")}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </FigureTile>
  );
}

/** CP-5: the clearance status, the issues listed by severity word, the module's remediation actions. */
/**
 * Whether the module header already draws the paragraph the status falls back to: the bottom
 * line's first paragraph, when it has words of its own and names no source.
 */
function headerDrawsIt(entry: OutputEntry) {
  const text = bottomLine(entry)[0]?.text ?? "";
  return readParagraph(text).body !== "" && !containsReference(text);
}

function Clearance(props: LeadProps) {
  return (
    <LeadFrame props={props}>
      <div className="min-w-0 self-start lg:col-span-8">
        <ClearanceTile {...props} />
      </div>
      <div className="min-w-0 self-start lg:col-span-4">
        <RemediationTile {...props} />
      </div>
    </LeadFrame>
  );
}

/** This lead draws no typed figure, event lane or map: the module frame keeps drawing them all. */
export const ClearanceLead: Lead = Clearance;
ClearanceLead.draws = [];
