/* eslint-disable jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role -- explicit table roles keep the table semantics when the parts are drawn as stacked blocks on a phone */
import { Button } from "@/components/base/buttons/button";
import { ArrowRight } from "@untitledui/icons";
import { HandoffDownload } from "../ReportContent";
import {
  evidencePath,
  publishedHref,
  type OutputEntry,
  type PublishedRun,
} from "../publishedReport";
import { STACK } from "./evidenceKit";
import { handoffName } from "./evidenceLabels";
import { Tile } from "./overview/Tile";

const HEADINGS = ["Handoff", "SHA-256", "File"];

/** The module handoffs as files: name, SHA-256, a way to open each in Evidence and to download it. */
export function EvidenceHandoffs({
  entries,
  module,
  run,
}: {
  entries: OutputEntry[];
  module?: string;
  run: PublishedRun;
}) {
  const zip = publishedHref(run.evidence.zip, run.folder);
  const shown = entries.filter((item) => !module || item.output.module === module);
  return (
    <Tile
      span={12}
      label="Handoffs"
      kicker="Module handoffs as delivered"
      title="Handoffs"
      trace={
        zip && (
          <Button href={zip} download color="secondary" className="min-h-8 max-[480px]:min-h-11">
            Download all handoffs
          </Button>
        )
      }
    >
      {!zip && (
        <p className="text-small text-text-secondary">No handoff ZIP was delivered for this run.</p>
      )}
      {run.evidence.handoffs.filter((handoff) => !module || handoff.module === module).length ===
        0 && (
        <p className="text-small text-text-secondary">
          No handoff files were delivered for this run.
        </p>
      )}
      {shown.length > 0 && (
        <div
          role="region"
          aria-label="Handoff files"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className="min-w-0 overflow-x-auto rounded-ds-md border border-border-hairline"
        >
          <table role="table" className={STACK.table}>
            <caption className="sr-only">Handoffs</caption>
            <thead role="rowgroup" className={STACK.head}>
              <tr role="row">
                {HEADINGS.map((heading) => (
                  <th
                    key={heading}
                    role="columnheader"
                    scope="col"
                    className="px-4 py-3 font-medium"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody role="rowgroup" className={STACK.body}>
              {shown.map((item) => (
                <tr role="row" key={item.output.id} className={STACK.row}>
                  <th
                    role="rowheader"
                    scope="row"
                    data-label={HEADINGS[0]}
                    className={`${STACK.cell} font-medium text-text-primary`}
                  >
                    <Button
                      href={evidencePath(run.folder, item)}
                      color="link-gray"
                      size="sm"
                      className="min-h-8 underline max-[480px]:min-h-11"
                      iconTrailing={ArrowRight}
                    >
                      {handoffName(item)}
                    </Button>
                  </th>
                  <td
                    role="cell"
                    data-label={HEADINGS[1]}
                    className={`${STACK.cell} font-mono text-mono wrap-anywhere text-text-tertiary`}
                  >
                    {/* 64 characters as two even lines of 32, as on Sources. */}
                    <code className="inline-block w-[32ch] max-w-full break-all">
                      {item.output.sha256}
                    </code>
                  </td>
                  <td
                    role="cell"
                    data-label={HEADINGS[2]}
                    className={`${STACK.cell} [&_a]:inline-flex [&_a]:min-h-8 [&_a]:items-center max-[480px]:[&_a]:min-h-11`}
                  >
                    <HandoffDownload run={run} entry={item} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Tile>
  );
}
