import { breakPointView, BreakPointsTile } from "../BreakPoints";
import { downsideView, DownsideTile } from "../Downside";
import { type OutputEntry } from "../../publishedReport";
import { Bento } from "../overview/Tile";
import { withDraws } from "./draws";
import { onlyGaps, OtherCharts } from "./written";
import { LeadGap, Trace, Beside } from "./parts";
import { drawsNothing, leadHref } from "./read";
import type { LeadProps } from "./types";

const LADDER = "EBITDA break points";
const SCENARIOS = "Downside scenarios";

/** The first table under a heading that opens with the register id, whatever its header. */
function underId(entry: OutputEntry, id: string) {
  const opens = new RegExp(`^[*\`]*${id.replace(".", "\\.")}(?![\\w.])`, "i");
  return entry.sections
    .filter((section) => opens.test(section.heading.trim()))
    .flatMap(({ blocks }) => blocks)
    .find((block) => block.type === "table");
}

/** Why the page draws no figure for a register, in the reader's words; traced when the handoff has a table under its id. */
function why(entry: OutputEntry, id: string, subject: string) {
  const found = underId(entry, id);
  return { reason: `This page could not read ${subject}.`, line: found?.line };
}

/** CP-2A: how far EBITDA can fall before each limit, and every stress case side by side. */
export const DownsideLead = withDraws(
  function DownsideLead(props: LeadProps) {
    const { entry } = props;
    if (drawsNothing(entry)) return null;
    const evidence = leadHref(props);
    const href = (line: number) => evidence(line);
    const breaks = breakPointView(entry);
    const scenarios = downsideView(entry);
    const gap = (id: string, subject: string, label: string) => {
      const { reason, line } = why(entry, id, subject);
      return {
        reason,
        trace: line === undefined ? undefined : <Trace href={href(line)} name={label} />,
      };
    };
    const others = <OtherCharts entry={entry} module="CP-2A" href={evidence} drawn={[]} />;
    const short = onlyGaps(entry, []);
    // A ladder heads the page with the shorter tiles beside it; a first tile that is only a gap
    // spans the row as one compact tile and the scenarios take the next row whole.
    const span = breaks ? 4 : 12;
    const second = scenarios ? (
      <DownsideTile data={scenarios} href={href} span={span} />
    ) : (
      <LeadGap
        span={span}
        label={SCENARIOS}
        title={SCENARIOS}
        {...gap("T2DS.4", "the stressed metrics by scenario", SCENARIOS)}
      />
    );
    return (
      <Bento>
        {breaks ? (
          <>
            <BreakPointsTile data={breaks} href={href} span={8} />
            <Beside>
              {second}
              {short && others}
            </Beside>
            {!short && others}
          </>
        ) : (
          <>
            <LeadGap
              span={12}
              label={LADDER}
              title={LADDER}
              {...gap("T2DS.6", "the break points", LADDER)}
            />
            {second}
            {others}
          </>
        )}
      </Bento>
    );
  },
  ["figures"],
);
