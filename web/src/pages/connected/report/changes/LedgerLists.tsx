import { PublishedSource } from "../PublishedTrace";
import { GapNote } from "../overview/Tile";
import { LINK } from "./PassageTile";
import type { LedgerGroup } from "./model";

/** The ledger's rows of one status, each in the module's words with its trace. */
export function LedgerList({ group }: { group: LedgerGroup }) {
  const { heading, items } = group;
  return (
    <section className="grid content-start gap-3" aria-label={heading}>
      <h4 className="text-caption text-text-tertiary">
        {heading} ({items.length})
      </h4>
      <ul className="grid gap-3">
        {items.map(({ text, missing, note, noteLabel, status, line, href }) => (
          <li key={line} className="flex items-start justify-between gap-3">
            <span className="grid min-w-0 gap-0.5">
              {text === null && missing ? (
                <span className="text-small text-gap-text">Limitation not stated</span>
              ) : text === null ? (
                <a className={LINK} href={href}>
                  Read this limitation in Evidence
                </a>
              ) : (
                <span className="reading-copy text-small text-text-primary">{text}</span>
              )}
              {status !== group.status && group.heading !== status && (
                <span className="text-caption text-text-tertiary">Status: {status}</span>
              )}
              {note && (
                <span className="text-caption text-text-secondary">
                  {group.status === "Closed" ? "Closed by: " : noteLabel ? `${noteLabel}: ` : ""}
                  {note}
                </span>
              )}
            </span>
            <PublishedSource
              href={href}
              name={text ?? "This limitation"}
              linkLabel={`Source for ${text ?? "this limitation"}`}
            >
              Source
            </PublishedSource>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EmptyLedger() {
  return <GapNote>None recorded</GapNote>;
}
