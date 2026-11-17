import { SearchLg } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { StatusBadge } from "@/components/status/StatusBadge";
import type { Reader, RunRecord } from "./slice";
import { DownloadButton } from "./parts/DownloadButton";
import { NothingForModule } from "./parts/ModuleFilter";
import {
  PlainHead,
  REGISTER_CELL,
  RegisterCard,
  RegisterTable,
  SortHead,
  sortRows,
  useSort,
} from "./parts/RegisterTable";
import { Snippet } from "./parts/Snippet";
import { TableCard } from "./parts/TableCard";
import { toTableCell } from "./parts/chartCell";
import { SUBSECTION_HEADING } from "./parts/heading";

const H = "font-display text-h3 text-text-primary";

/**
 * The module timings: the Table side of the mock's gantt, in the shared card; the Chart side is not
 * drawn (the kit has no such chart), so there is no Chart or Table toggle. The state sits in the
 * table's end column as the Module state badge. A run that holds no module says so instead. With a
 * module chosen, its row is all that is drawn; a module the table lists no row of says so.
 */
function Timings({
  timings,
  chosen,
  onClear,
}: {
  timings: RunRecord["timings"];
  chosen: Reader | null;
  onClear: () => void;
}) {
  const [module, state, started, accepted, took] = timings.columns;
  if (timings.emptyText !== null) {
    const Title = SUBSECTION_HEADING;
    return (
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.FeaturedIcon icon={SearchLg} />
        </EmptyState.Header>
        <EmptyState.Content>
          <EmptyState.Title as={Title}>{timings.title}</EmptyState.Title>
          <EmptyState.Description>{timings.emptyText}</EmptyState.Description>
        </EmptyState.Content>
      </EmptyState>
    );
  }
  const held =
    chosen === null ? timings.rows : timings.rows.filter((row) => row.module === chosen.name);
  if (chosen !== null && held.length === 0) {
    return (
      <NothingForModule
        title={`No time is listed for ${chosen.name}`}
        clearLabel="Show all modules"
        onClear={onClear}
      />
    );
  }
  return (
    <TableCard
      title={timings.title}
      note={chosen === null ? timings.note : `Unfiltered timing record: ${timings.note}`}
      label={timings.title}
      size="text-h3"
      trace={null}
      head={[module, started, accepted, took]}
      endHeading={state}
      rows={held.map((row) => ({
        label: row.module,
        cells: [row.started, row.accepted, row.took].map(toTableCell),
        end: <StatusBadge set="Module state" state={row.state} />,
      }))}
      footnotes={
        chosen === null
          ? []
          : [
              `${String(held.length)} of ${String(timings.rows.length)} recorded module timings shown for ${chosen.name}.`,
            ]
      }
    />
  );
}

/** The registers each module wrote: sorted by name on request, each with its own "Open". */
function Registers({ registers }: { registers: RunRecord["registers"] }) {
  const [sort, onSort] = useSort<"name">();
  const [name, writtenBy, rows, file, open] = registers.columns;
  const ordered = sortRows(registers.rows, sort, (row) => row.name);
  return (
    <RegisterCard
      title={registers.title}
      count={registers.count}
      description={registers.note}
      action={<DownloadButton download={registers.downloadAll} />}
    >
      <RegisterTable
        name={registers.title}
        head={
          <>
            <SortHead column="name" label={name} sort={sort} onSort={onSort} />
            <PlainHead>{writtenBy}</PlainHead>
            <PlainHead align="right">{rows}</PlainHead>
            <PlainHead>{file}</PlainHead>
            <PlainHead srOnly align="right">
              {open}
            </PlainHead>
          </>
        }
      >
        <tbody>
          {ordered.map((row) => (
            <tr key={row.name} className="border-b border-border-hairline">
              <th
                scope="row"
                className={`${REGISTER_CELL} text-left font-medium text-text-primary`}
              >
                {row.name}
              </th>
              <td className={REGISTER_CELL}>{row.writtenBy}</td>
              <td className={`${REGISTER_CELL} text-right tabular-nums`}>{row.rows}</td>
              <td className={`${REGISTER_CELL} font-mono`}>{row.file}</td>
              <td className={`${REGISTER_CELL} text-right`}>
                <DownloadButton
                  download={{ label: open, href: row.href, reason: row.reason }}
                  color="link-color"
                  open
                  end
                />
              </td>
            </tr>
          ))}
        </tbody>
      </RegisterTable>
    </RegisterCard>
  );
}

/** The delivered head of the column of module codes, which no page draws (amendment 2026-11-12). */
const CODE_HEAD = "Code";

/**
 * The model-calls table as drawn: the delivered table without its "Code" column, every other head
 * and cell as delivered. A row's cells are one fewer than the heads, so column `at` is cell `at - 1`.
 */
function withoutCodes({ columns, rows, total }: RunRecord["calls"]) {
  const at = columns.indexOf(CODE_HEAD, 1);
  const drop = <T,>(items: readonly T[], index: number) => items.filter((_, i) => i !== index);
  const row = ({ label, cells }: RunRecord["calls"]["total"]) => ({
    label,
    cells: drop(cells, at - 1),
  });
  return { head: drop(columns, at), rows: rows.map(row), total: row(total) };
}

/**
 * The model calls and their delivered total. The table lists the modules the record holds a row of,
 * which may be fewer than the run's `modules`; then it says how many it lists, since its total is the
 * run's. With a module chosen, its row is all that is drawn, with no total or count, which are the
 * run's; a module the table lists no row of says so.
 */
function Calls({
  calls,
  modules,
  chosen,
  onClear,
}: {
  calls: RunRecord["calls"];
  modules: number;
  chosen: Reader | null;
  onClear: () => void;
}) {
  const { head, rows, total } = withoutCodes(calls);
  const held = chosen === null ? rows : rows.filter((row) => row.label === chosen.name);
  if (chosen !== null && held.length === 0) {
    return (
      <NothingForModule
        title={`No model calls are listed for ${chosen.name}`}
        clearLabel="Show all modules"
        onClear={onClear}
      />
    );
  }
  const partial = chosen === null && rows.length < modules;
  return (
    <TableCard
      title={calls.title}
      count={chosen === null ? calls.count : null}
      note={chosen === null ? calls.note : `Unfiltered call record: ${calls.note}`}
      label={calls.title}
      size="text-h4"
      trace={null}
      head={head}
      rows={chosen === null ? [...held, total] : held}
      footnotes={
        partial
          ? [
              `Call rows cover ${String(rows.length)} of ${String(modules)} modules in the run. The Total row is the delivered total for the run.`,
            ]
          : []
      }
      tableClass={chosen === null ? "[&_tbody_tr:last-child>*]:font-semibold" : ""}
    />
  );
}

/**
 * The Record tab: when each module started and was accepted, the hashes to copy, the spend against
 * the cap, the model calls and the registers as written. Configuration names and file names appear
 * only here. Every figure is the delivered text. `modules` is the number of modules the run holds;
 * `module` is the one chosen in the Evidence filter, which narrows the two tables of modules.
 */
export function EvidenceRecord({
  record,
  modules,
  module,
  onClear,
}: {
  record: RunRecord;
  modules: number;
  module: Reader | null;
  onClear: () => void;
}) {
  const Heading = SUBSECTION_HEADING;
  const { hashes, spend, calls } = record;
  return (
    <div className="flex flex-col gap-8">
      <Timings timings={record.timings} chosen={module} onClear={onClear} />
      <div className="grid grid-cols-1 gap-6 min-[1200px]:grid-cols-2">
        <section className="flex flex-col gap-4">
          <Heading className={H}>{hashes.title}</Heading>
          {hashes.items.map((item) => (
            <Snippet
              key={item.label}
              caption={item.label}
              kind={item.kind}
              value={item.value}
              copyLabel={item.copyLabel}
              what={item.what}
            />
          ))}
        </section>
        <section className="flex flex-col gap-4">
          <Heading className={H}>{spend.title}</Heading>
          <ProgressBar
            value={spend.progress.value}
            max={spend.progress.max}
            label={spend.progress.text}
          />
          <p className="text-small text-text-secondary">{spend.note}</p>
        </section>
      </div>
      <Calls calls={calls} modules={modules} chosen={module} onClear={onClear} />
      <Registers registers={record.registers} />
    </div>
  );
}
