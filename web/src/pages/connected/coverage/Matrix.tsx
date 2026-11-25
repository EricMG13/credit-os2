import { useState } from "react";
import { cx } from "@/utils/cx";
import { moduleName } from "../api";
import { latestRun, type Coverage as Data, type CoverageRun, type Issuer } from "../coverageData";
import { stageColumns, RunStates } from "./RunStates";
import { named, reportPath, RunLine, runText, tableBox, th } from "./shared";
import { hasHandoff, LEGEND, LegendItem, StateShape, stateWord } from "./StateMark";
import { useNarrow } from "./useNarrow";

const STICKY = "sticky left-0 z-10 bg-surface-card";

/** The scrolling box a wide table sits in: named, focusable, and padded so focus clears the sticky column. */
function Scroller({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      // A scrolling region must take focus, or a keyboard reader cannot reach what it hides.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className={cx(
        tableBox,
        "scroll-pl-56 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2",
      )}
    >
      {children}
    </div>
  );
}

function Legend() {
  return (
    <ul aria-label="What the shapes mean" className="flex flex-wrap gap-x-5 gap-y-1">
      {LEGEND.map((item) => (
        <LegendItem key={item.word} {...item} />
      ))}
    </ul>
  );
}

/** Two header rows: the stage names across their groups, over the module names on end. */
function StageHead({ data }: { data: Data }) {
  const groups = stageColumns(data);
  return (
    <thead>
      <tr className="border-b border-border-hairline">
        <th rowSpan={2} scope="col" className={cx(th, STICKY, "z-20 align-bottom")}>
          Issuer
        </th>
        {groups.map((group) => (
          <th
            key={group.name}
            colSpan={group.columns.length}
            scope="colgroup"
            title={group.name}
            className="max-w-0 truncate border-l border-border-hairline px-1.5 pt-2 pb-1 text-left align-bottom text-caption font-medium text-text-tertiary"
          >
            {group.name}
          </th>
        ))}
      </tr>
      <tr className="border-b border-border-hairline">
        {groups.flatMap((group) =>
          group.columns.map((column, index) => (
            <th
              key={column.code}
              scope="col"
              title={named(column)}
              className={cx(
                "h-32 px-0 pb-2 text-center align-bottom text-caption font-medium text-text-secondary",
                index === 0 && "border-l border-border-hairline",
              )}
            >
              <span className="mx-auto block [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">
                {named(column)}
              </span>
            </th>
          )),
        )}
      </tr>
    </thead>
  );
}

const CELL =
  "mx-auto flex size-8 max-w-full cursor-pointer items-center justify-center rounded-ds-xs outline-focus-ring hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-0";

/**
 * A run's states as shapes under each fixed column. Every cell takes focus, and pointing at,
 * focusing or pressing it reads its issuer, module and state aloud in the line under the matrix;
 * a module with a handoff also opens its page in the report.
 */
function ShapeCells({
  data,
  run,
  issuer,
  say,
}: {
  data: Data;
  run: CoverageRun;
  issuer: string;
  say: (text: string) => void;
}) {
  return (
    <>
      {stageColumns(data).flatMap((group) =>
        group.columns.map((column, index) => {
          const cell = run.cells[column.code];
          const module = moduleName(column.code) === column.code ? column.title : moduleName(column.code);
          const label = `${module} for ${issuer}: ${stateWord(cell)}`;
          const reading = `${issuer} (${runText(run)}), ${module}: ${stateWord(cell)}`;
          const shared = {
            "aria-label": label,
            title: stateWord(cell),
            className: CELL,
            onFocus: () => {
              say(reading);
            },
            onMouseEnter: () => {
              say(reading);
            },
            onClick: () => {
              say(reading);
            },
          };
          return (
            <td
              key={column.code}
              className={cx("p-0 text-center", index === 0 && "border-l border-border-hairline")}
            >
              {hasHandoff(cell) ? (
                <a href={`${reportPath(run.folder)}#modules/${column.code}`} {...shared}>
                  <StateShape cell={cell} />
                </a>
              ) : (
                <button type="button" {...shared}>
                  <StateShape cell={cell} />
                </button>
              )}
            </td>
          );
        }),
      )}
    </>
  );
}

function IssuerName({
  issuer,
  run,
  say,
  wrap = false,
  chosen,
  toggle,
  open,
  setOpen,
}: {
  issuer: Issuer;
  run: CoverageRun;
  /** Read the issuer aloud in the status line, so a cut name is reachable on focus. */
  say?: (text: string) => void;
  /** Wrap a long name rather than cut it (a phone card). */
  wrap?: boolean;
  chosen: ReadonlySet<string>;
  toggle: (key: string) => void;
  open: string | null;
  setOpen: (key: string | null) => void;
}) {
  return (
    <span className="flex min-w-0 items-center gap-1">
      <label className="-ml-1 flex size-8 flex-none items-center justify-center max-[480px]:size-11">
        <input
          type="checkbox"
          className="size-5"
          aria-label={`Compare ${issuer.name}`}
          checked={chosen.has(issuer.key)}
          onChange={() => {
            toggle(issuer.key);
          }}
        />
      </label>
      <button
        type="button"
        title={`${issuer.name}: ${runText(run)}`}
        onFocus={() => {
          say?.(`${issuer.name} (${runText(run)})`);
        }}
        onMouseEnter={() => {
          say?.(`${issuer.name} (${runText(run)})`);
        }}
        className={cx(
          "min-h-8 min-w-0 cursor-pointer text-left font-semibold underline-offset-2 hover:underline max-[480px]:min-h-11",
          wrap ? "wrap-anywhere" : "truncate",
        )}
        aria-expanded={open === issuer.key}
        onClick={() => {
          setOpen(open === issuer.key ? null : issuer.key);
        }}
      >
        {issuer.name}
      </button>
    </span>
  );
}

/**
 * Issuer × module. Wide screens draw one row per issuer and one column per module, each cell a
 * shape with its word as name and tooltip and a legend above; a phone draws one card per issuer
 * with the five stages as rows.
 */
export function Matrix({
  data,
  issuers,
  chosen,
  toggle,
  open,
  setOpen,
}: {
  data: Data;
  issuers: Issuer[];
  chosen: ReadonlySet<string>;
  toggle: (key: string) => void;
  open: string | null;
  setOpen: (key: string | null) => void;
}) {
  const narrow = useNarrow();
  const [reading, setReading] = useState("");
  const name = { chosen, toggle, open, setOpen };
  if (narrow)
    return (
      <ul aria-label="Issuers by module" className="grid gap-3">
        {issuers.map((issuer) => {
          const run = latestRun(issuer);
          if (!run) return null;
          return (
            <li
              key={issuer.key}
              className="grid gap-3 rounded-ds-lg border border-border-subtle bg-surface-card p-4"
            >
              <div className="grid gap-0.5">
                <IssuerName issuer={issuer} run={run} wrap {...name} />
                <RunLine run={run} />
              </div>
              <RunStates data={data} run={run} />
            </li>
          );
        })}
      </ul>
    );
  return (
    <div className="grid gap-3">
      <Legend />
      <Scroller label="Issuers by module">
        <table className="w-full table-fixed text-small">
          <caption className="sr-only">
            Each issuer’s newest run: what every module delivered, as shapes
          </caption>
          <colgroup>
            <col className="w-72" />
          </colgroup>
          <StageHead data={data} />
          <tbody>
            {issuers.map((issuer) => {
              const run = latestRun(issuer);
              if (!run) return null;
              return (
                <tr key={issuer.key} className="border-b border-border-hairline last:border-0">
                  <th scope="row" className={cx(STICKY, "p-1 text-left font-semibold")}>
                    <IssuerName issuer={issuer} run={run} say={setReading} {...name} />
                  </th>
                  <ShapeCells data={data} run={run} issuer={issuer.name} say={setReading} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </Scroller>
      <p role="status" className="min-h-5 text-small text-text-secondary">
        {reading || "Point at or focus a shape to read its state; a shape with an output opens the module."}
      </p>
    </div>
  );
}
