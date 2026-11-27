import type { ReactElement } from "react";
import type { Cohort } from "./cohort";

/** Issuers excluded from one cohort, with the reason the cohort calculation recorded. */
export function LeftOut({
  out,
  title,
}: {
  out: Cohort["out"];
  title: string;
}): ReactElement | null {
  if (out.length === 0) return null;

  return (
    <section aria-label={title}>
      <h3>{title}</h3>
      <ul>
        {out.map(({ issuer, reason }) => (
          <li key={issuer.key}>
            <span>{issuer.name}</span>: <span>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
