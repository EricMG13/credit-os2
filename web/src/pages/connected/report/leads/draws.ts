import type { FC } from "react";
import type { Lead, LeadKind, LeadProps } from "./types";

/** The lead with its static `draws`: exactly the kinds given, in that order, frozen. */
export function withDraws(component: FC<LeadProps>, kinds: readonly LeadKind[]): Lead {
  return Object.assign(component, { draws: Object.freeze([...kinds]) });
}
