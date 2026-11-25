import { Bento } from "../overview/Tile";
import { withDraws } from "./draws";
import { LaneTile, LeadGap } from "./parts";
import { eventsOf, leadHref, drawsNothing, statedInProse } from "./read";
import type { LeadProps } from "./types";

const QUESTIONS = "Research questions and answers";

/** CP-DR: the research questions and the dates that matter. */
export const ResearchLead = withDraws(
  function ResearchLead(props: LeadProps) {
    const { entry, run } = props;
    if (drawsNothing(entry)) return null;
    const href = leadHref(props);
    return (
      <Bento>
        <LeadGap
          span={12}
          label={QUESTIONS}
          title={QUESTIONS}
          reason="This page could not read the research questions and their answers."
        />
        {!statedInProse(entry, "Events: Research catalysts") && (
          <LaneTile
            lane={eventsOf(entry, "Research catalysts")}
            span={12}
            label="Research catalysts"
            title="Research catalysts"
            href={href}
            absent="This page could not read dated research catalysts."
            asOf={run.asOf}
          />
        )}
      </Bento>
    );
  },
  ["events"],
);
