import type { ReactElement } from "react";
import type { Cohort } from "./cohort";

/** Issuers excluded from one cohort, with the reason the cohort calculation recorded. */
export function LeftOut({
  out,
  title,
  details,
}: {
  out: Cohort["out"];
  title: string;
  details?: ReadonlyMap<string, readonly string[]>;
}): ReactElement | null {
  if (out.length === 0) return null;

  return (
    <section aria-label={title}>
      <h3>{title}</h3>
      <ul>
        {out.map(({ issuer, reason }) => (
          <li key={issuer.key}>
            <span>{issuer.name}</span>:{" "}
            <span>{details?.get(issuer.key)?.join("; ") ?? reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
