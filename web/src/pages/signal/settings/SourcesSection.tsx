// Settings, Sources (mock settings frame 3): the kit's dense Table, one row per source. Source,
// State and Health sort by the delivered ranks (a source with no health sorts last either way);
// Failing shows its reason under the badge. Proposing a source writes: in the sample it is disabled
// with its reason in view; on a service it opens a form, and the owner approves from the command line.
import { useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { Globe01, Plus } from "@untitledui/icons";
import { Table } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { StatusBadge } from "@/components/status/StatusBadge";
import { SourceLogo } from "../parts/SourceLogo";
import { WeekBars } from "../parts/WeekBars";
import type { SignalSource } from "../slice";
import { usePageWrite, useSignalActions } from "../actions";
import { useSignalViewer } from "../viewer";
import { useOpener } from "../parts/focus";
import { FormDialog, type FormField } from "../parts/FormDialog";
import { KINDS, writes } from "../writes";
import { Section } from "./Section";
import { SampleReason, useSampleOff } from "./SampleReason";

const REASON_ID = "signal-sources-write-reason";
const COLUMNS = ["name", "state", "health"] as const;

function order(sources: SignalSource[], sort: SortDescriptor | undefined): SignalSource[] {
  const column = COLUMNS.find((c) => c === sort?.column);
  if (column === undefined || sort === undefined) return sources;
  const sign = sort.direction === "descending" ? -1 : 1;
  return [...sources].sort((a, b) => {
    if (column === "health" && (a.health === null || b.health === null)) {
      return Number(a.health === null) - Number(b.health === null);
    }
    return sign * (a.sort[column] - b.sort[column]);
  });
}

function Small({ children }: { children: string }) {
  return (
    <small className="mt-1 block text-caption font-normal text-text-tertiary">{children}</small>
  );
}

/** Called, not drawn as an element: a null result is the cell's missing health (n.a.). */
function health(source: SignalSource) {
  if (source.health === null) return null;
  // Keyed by slot, not by text: the reason and the note may be the same sentence.
  const notes = [
    ["reason", source.reason],
    ["note", source.healthNote],
  ] as const;
  return (
    <>
      <StatusBadge set="Signal source states" state={source.health} />
      {notes.map(([slot, text]) => (text === null ? null : <Small key={slot}>{text}</Small>))}
    </>
  );
}

/**
 * A source's tile beside its name, drawn in every row once the service says any listed source has
 * a logo (so the names stay in line): the logo where the page has it, else a plain mark. The list
 * carries no letters for a source, so the mark is an icon. Decoration: the name is beside it.
 */
function SourceTile({ source }: { source: SignalSource }) {
  return (
    <span
      aria-hidden="true"
      data-source-tile
      className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-ds-xs bg-surface-subtle text-text-tertiary"
    >
      <SourceLogo source={source} inset="p-0.5">
        <Globe01 className="size-3.5" />
      </SourceLogo>
    </span>
  );
}

const PROPOSAL: readonly FormField[] = [
  { key: "name", kind: "text", label: "Name", missing: "Enter the source's name." },
  { key: "kind", kind: "choice", label: "Kind", options: KINDS.map((k) => k.label), value: "News" },
  {
    key: "url",
    kind: "text",
    label: "Feed address",
    hint: "The https address of the source's feed.",
    missing: "Enter the address of the source's feed.",
  },
];

/** Propose a source: the button, and on a service the form it opens. */
function Propose() {
  const actions = useSignalActions();
  const off = useSampleOff(REASON_ID);
  const opener = useOpener();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        color="primary"
        iconLeading={Plus}
        {...off}
        onPress={() => {
          opener.remember();
          setOpen(true);
        }}
      >
        Propose a source
      </Button>
      {actions === null ? null : (
        <FormDialog
          open={open}
          title="Propose a source"
          intro="A proposed source brings no stories until the owner approves it."
          fields={PROPOSAL}
          action="Propose"
          onSend={({ text }) => {
            const kind = KINDS.find((k) => k.label === text["kind"])?.key ?? "news";
            const request = writes.source(
              (text["name"] ?? "").trim(),
              kind,
              (text["url"] ?? "").trim(),
            );
            return actions.write(request).then((answer) => answer.refusal);
          }}
          onClose={() => {
            setOpen(false);
          }}
          onGone={opener.restore}
        />
      )}
    </>
  );
}

export function SourcesSection({
  sources,
  weeksHeading,
  more,
  writer,
}: {
  sources: SignalSource[];
  weeksHeading: string;
  /** The service's sentence for a cut list, drawn under the table; null when the list is whole. */
  more: string | null;
  writer: boolean;
}) {
  const [sort, setSort] = useState<SortDescriptor | undefined>();
  const page = usePageWrite();
  const actions = useSignalActions();
  const { profileType } = useSignalViewer();
  const canModerate = profileType === "admin" && page !== null;
  const tiles = sources.some((source) => source.logo);
  return (
    <Section
      wide
      title="Sources"
      hint="Stories come only from approved sources. Anyone who writes can propose one; an Admin approves."
      action={writer ? <Propose /> : undefined}
    >
      <SampleReason id={REASON_ID}>Sample data: sources cannot be proposed here.</SampleReason>
      {sources.length === 0 ? (
        <p className="text-small text-text-tertiary">No sources yet.</p>
      ) : (
        // The table keeps a width its columns can be read at (600px; 760px with its fifth column).
        // Where the section is narrower it scrolls sideways inside a named region the keyboard can
        // reach (as the issuer table does), and the sentence above it says so: it is drawn only
        // while the section is under 600px wide, which is when the table does not fit.
        <div className="@container">
          <p className="mb-2 text-small text-text-tertiary @min-[600px]:hidden">
            Scroll horizontally to see every column.
          </p>
          <div
            role="region"
            aria-label="Sources table"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className="overflow-x-auto rounded-ds-lg bg-surface-card ring-1 ring-border-subtle outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2 [&>div]:overflow-x-visible"
          >
            <Table
              aria-label="Sources"
              size="sm"
              className="min-w-150 2xl:min-w-190"
              sortDescriptor={sort}
              onSortChange={setSort}
            >
              <Table.Header>
                <Table.Head
                  id="name"
                  isRowHeader
                  allowsSorting
                  className="max-2xl:w-1/3"
                  label="Source"
                />
                <Table.Head id="state" allowsSorting label="State" />
                <Table.Head id="health" allowsSorting label="Health" />
                {/* Its own column only from 1536px, where five columns fit beside the section list. */}
                <Table.Head id="check" className="max-2xl:hidden" label="Last check and item" />
                <Table.Head id="weeks" label={weeksHeading} />
                {canModerate ? <Table.Head id="actions" label="Admin actions" /> : null}
              </Table.Header>
              <Table.Body items={order(sources, sort)}>
                {(source) => (
                  <Table.Row id={source.id}>
                    <Table.Cell>
                      <span className="flex items-center gap-2">
                        {tiles ? <SourceTile source={source} /> : null}
                        <b className="block font-medium text-text-primary">{source.name}</b>
                      </span>
                      <Small>{source.kind}</Small>
                      <div data-last-check className="2xl:hidden">
                        <Small>{`Last check ${source.lastCheck ?? "n.a."}`}</Small>
                        {source.lastCheck === null ? null : (
                          <Small>{`Last item ${source.lastItem ?? "n.a."}`}</Small>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <StatusBadge set="Signal source states" state={source.state} />
                      {source.stateNote === null ? null : <Small>{source.stateNote}</Small>}
                    </Table.Cell>
                    <Table.Cell>{health(source)}</Table.Cell>
                    <Table.Cell className="max-2xl:hidden">
                      {source.lastCheck === null ? null : (
                        <>
                          {source.lastCheck}
                          <Small>{`Last item ${source.lastItem ?? "n.a."}`}</Small>
                        </>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {source.weeks.length === 0 ? null : <WeekBars weeks={source.weeks} />}
                    </Table.Cell>
                    {canModerate ? (
                      <Table.Cell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            color="secondary"
                            size="sm"
                            isDisabled={source.state === "Approved"}
                            onPress={() => {
                              void page.send(writes.approveSource(source.id)).then((answer) => {
                                if (answer.status === 401 || answer.status === 403)
                                  actions?.refresh();
                                if (answer.refusal === null && answer.stale !== true)
                                  page.note("Source approved.");
                              });
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            color="secondary"
                            size="sm"
                            isDisabled={source.state === "Paused"}
                            onPress={() => {
                              void page.send(writes.pauseSource(source.id)).then((answer) => {
                                if (answer.status === 401 || answer.status === 403)
                                  actions?.refresh();
                                if (answer.refusal === null && answer.stale !== true)
                                  page.note("Source paused.");
                              });
                            }}
                          >
                            Pause
                          </Button>
                        </div>
                      </Table.Cell>
                    ) : null}
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </div>
          {more === null ? null : <p className="mt-3 text-small text-text-tertiary">{more}</p>}
        </div>
      )}
    </Section>
  );
}
