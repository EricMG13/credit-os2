import { cx } from "@/utils/cx";
import { Ruler } from "../overview/marks";
import { FigureTile, GapTile, LeadFrame } from "./kit/LeadFrame";
import { GapChip } from "./kit/marks";
import { reasonText } from "./kit/reader";
import {
  readChangeScreen,
  readKeyFigures,
  readScreens,
  type Figure,
  type KeyFigure,
  type Screen,
} from "./shortSnapshotData";
import type { Lead, LeadProps } from "./types";

/*
 * CP-L10 short snapshot lead. Synthetic contract: built from src/deploy_vii/methods/cpl10.md (the
 * `Measure | Value | Period | Source` Key figures table) and bindings/cpl10.py; no CP-L10 handoff has
 * ever run on a real case, so this lead is unproven on a real run. The change screen is drawn only from
 * a table with Topic, Prior and Current columns (the contract names no others).
 *
 * Two periods of one measure a year apart are one figure, prior to current; any other pair of
 * periods is two figures, each with its own period and no change between them.
 */

const signed = (sign: -1 | 0 | 1, size: string) =>
  sign === 1 ? `+${size}` : sign === -1 ? `\u2212${size}` : size;

const stated = (figure: Figure) => (figure.kind === "value" ? figure.text : "not supplied");

const TONE_TEXT = { better: "text-better-mark", worse: "text-worse-mark" } as const;

/** One key figure: label, value, then its change line, then its paired mark: the rows line up across a band. */
function KeyFigureCell({ item }: { item: KeyFigure }) {
  const { current, prior, change, marks } = item;
  const word = change && (change.tone === "better" || change.tone === "worse") ? change.tone : null;
  return (
    <li
      data-figure={`${item.measure}, ${current.period}`}
      className="row-span-4 grid min-w-0 grid-rows-subgrid gap-y-1.5 border-t border-l border-border-hairline p-4 -mt-px -ml-px sm:p-5"
    >
      <p className="text-caption text-text-tertiary">{`${item.measure}, ${current.period}`}</p>
      <div>
        {current.kind === "gap" ? (
          <GapChip reason={reasonText(current.reason)} />
        ) : (
          <span className="font-mono text-h3 font-medium wrap-anywhere text-text-primary tabular-nums">
            {current.text}
          </span>
        )}
      </div>
      <p className="text-caption text-text-secondary">
        {change && (
          <span
            data-part="change"
            className={cx("font-mono tabular-nums", word && TONE_TEXT[word])}
          >
            {signed(change.sign, change.size)}
            {word ? ` ${word}` : ""}
          </span>
        )}
        {change && prior ? " \u00b7 " : ""}
        {prior &&
          (prior.kind === "value"
            ? `from ${prior.text} in ${prior.period}`
            : `${prior.period}: not supplied`)}
      </p>
      <div className="w-[184px] max-w-full">
        {prior && marks && change && (
          <Ruler
            from={{ label: prior.period, value: marks.prior, text: stated(prior) }}
            to={{ label: current.period, value: marks.current, text: stated(current) }}
            tone={change.tone}
            suffix={marks.suffix}
            label={`${item.measure}: ${stated(prior)} in ${prior.period}, ${stated(current)} in ${current.period}`}
          />
        )}
      </div>
    </li>
  );
}

function Strip({ props }: { props: LeadProps }) {
  const read = readKeyFigures(props.entry);
  if (read.state === "gap")
    return (
      <GapTile span={12} label="Key figures" kicker="Key figures">
        {read.reason}
      </GapTile>
    );
  return (
    <FigureTile
      props={props}
      span={12}
      label="Key figures"
      kicker="Each figure in its stated period"
      title="Key figures"
      line={read.line}
      source="the key figures"
      table={{
        caption: "Key figures",
        headers: ["Measure", "Period", "Value", "Earlier period", "Earlier value", "Change"],
        rows: read.figures.map((item) => [
          item.measure,
          item.current.period,
          item.current.text,
          item.prior?.period ?? "Not stated",
          item.prior ? item.prior.text : "Not stated",
          item.change ? signed(item.change.sign, item.change.size) : "Not stated",
        ]),
      }}
    >
      <ul
        aria-label="Key figures"
        className="grid min-w-0 grid-cols-1 overflow-hidden sm:grid-cols-2 rounded-ds-lg border border-border-subtle bg-surface-card md:grid-cols-3 xl:grid-cols-4"
      >
        {read.figures.map((item) => (
          <KeyFigureCell key={`${String(item.line)}-${item.measure}`} item={item} />
        ))}
      </ul>
    </FigureTile>
  );
}

function ChangeScreen({ props }: { props: LeadProps }) {
  const read = readChangeScreen(props.entry);
  if (!read) return null;
  if (read.state === "gap")
    return (
      <GapTile span={12} label="Change screen" kicker="Change screen">
        {read.reason}
      </GapTile>
    );
  return (
    <FigureTile
      props={props}
      span={12}
      label="Change screen"
      kicker="Topic by topic, earlier to later"
      title="Change screen"
      line={read.line}
      source="the change screen"
      table={{
        caption: "Change screen",
        headers: ["Topic", "Prior", "Current", "Direction", "Reading"],
        rows: read.items.map((item) => [
          item.topic,
          item.prior,
          item.current,
          item.direction ?? "Not stated",
          item.text ?? "Not stated",
        ]),
      }}
    >
      <ul className="flex flex-col divide-y divide-border-hairline">
        {read.items.map((item) => (
          <li
            key={`${item.topic}-${String(item.line)}`}
            className="flex min-w-0 flex-col gap-1 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-small font-medium text-text-primary">{item.topic}</p>
              <p className="font-mono text-small text-text-secondary tabular-nums">
                {item.prior} <span aria-hidden="true">{"→"}</span>
                <span className="sr-only"> to </span> {item.current}
                {item.direction && (
                  <span className="ml-2 font-body text-caption text-text-primary">
                    {item.direction}
                  </span>
                )}
              </p>
            </div>
            {item.text && <p className="text-small text-text-secondary">{item.text}</p>}
          </li>
        ))}
      </ul>
    </FigureTile>
  );
}

/** The materiality word's mark: the table's own word, matched without regard to case, never recomputed. */
const MATERIALITY_TEXT: Readonly<Record<string, string>> = {
  high: "text-warning-text",
};

/** One screen: its topics as a list (topic, finding, then the module's own materiality, evidence and next step) over the table of the same cells. */
function ScreenTile({
  props,
  screen,
}: {
  props: LeadProps;
  screen: Extract<Screen, { state: "ready" }>;
}) {
  return (
    <FigureTile
      props={props}
      span={12}
      label={screen.title}
      kicker="Topic by topic"
      title={screen.title}
      line={screen.line}
      source={`the ${screen.title.toLowerCase()}`}
      table={{ caption: screen.title, headers: screen.headers, rows: screen.rows }}
    >
      <ul className="flex flex-col divide-y divide-border-hairline">
        {screen.rows.map((cells, at) => {
          const [topic = "", finding = "", materiality = "", evidence = "", next = ""] = cells;
          return (
            <li
              key={`${topic}-${String(screen.lines[at])}`}
              className="flex min-w-0 flex-col gap-1 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-small font-medium text-text-primary">{topic}</p>
                <p className="text-caption text-text-secondary">
                  <span
                    className={cx(
                      "font-medium",
                      Object.hasOwn(MATERIALITY_TEXT, materiality.trim().toLowerCase())
                        ? MATERIALITY_TEXT[materiality.trim().toLowerCase()]
                        : undefined,
                    )}
                  >
                    {materiality}
                  </span>
                  {" \u00b7 "}
                  {evidence}
                </p>
              </div>
              <p className="text-small text-text-secondary">{finding}</p>
              <p className="text-caption">
                <span className="text-text-tertiary">Next step</span>{" "}
                <span className="text-text-secondary">{next}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </FigureTile>
  );
}

/** CP-L10 in a credit screening run: the five screens, each a tile or, where it cannot be read, the gap tile. */
function Screens({ props }: { props: LeadProps }) {
  return (
    <>
      {readScreens(props.entry, props.run.pathway).map((screen) =>
        screen.state === "gap" ? (
          <GapTile key={screen.title} span={12} label={screen.title} kicker={screen.title}>
            {screen.reason}
          </GapTile>
        ) : (
          <ScreenTile key={screen.title} props={props} screen={screen} />
        ),
      )}
    </>
  );
}

/** CP-L10: the key-figure strip, each figure prior to current where the table states both periods; then the change screen. */
export const ShortSnapshotLead: Lead = function ShortSnapshotLead(props) {
  // Ruling C7: in a credit screening run the module writes five screens, not key figures.
  const screening = props.run.pathway === "credit_screening";
  return (
    <LeadFrame props={props}>
      {screening ? (
        <Screens props={props} />
      ) : (
        <>
          <Strip props={props} />
          <ChangeScreen props={props} />
        </>
      )}
    </LeadFrame>
  );
};
// This lead draws no typed figure, event lane or map of the module's own.
ShortSnapshotLead.draws = [];
