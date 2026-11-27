import { useEffect, useMemo, useState } from "react";
import { BarChartSquare02, ChevronRight, SearchLg } from "@untitledui/icons";
import { Alert, Callout } from "@/components/alert/Alert";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/gap/Skeleton";
import { Segmented } from "@/components/kit/Segmented";
import { PageHeader } from "../../shell/PageHeader";
import {
  commonPeriod,
  factsOf,
  periodsOrdered,
  getCoverage,
  latestRun,
  matchIssuers,
  NO_FILTERS,
  periodsOf,
  readBound,
  readGroups,
  writeGroups,
  type Coverage as Data,
  type Filters,
  type Issuer,
  type SavedGroup,
} from "./coverageData";
import { serviceText } from "./api";
import { card, field as control, label } from "./layout";
import { useCanStart } from "./startAction";
import { Chip, ChipGroup, RemovableChip } from "@/components/kit/Chip";
import { boundUnit, unitNamer } from "./coverage/boundUnit";
import { writtenUnit } from "./moneyUnits";
import { Choice, FieldOptions } from "./coverage/Controls";
import { FindView } from "./coverage/Find";
import { Headroom } from "./coverage/Headroom";
import { IssuerDetail } from "./coverage/IssuerDetail";
import { Matrix } from "./coverage/Matrix";
import { Monitor } from "./coverage/Monitor";
import { Patterns } from "./coverage/Patterns";
import { Refinancing } from "./coverage/Refinancing";
export { MONITOR_GROUPS } from "./coverage/Monitor";
import { RankView } from "./coverage/Rank";
import { named, STATE_WORDS } from "./coverage/shared";
import { TrendView } from "./coverage/Trend";
import { useResource } from "./useResource";

type View =
  | "monitor"
  | "patterns"
  | "refinancing"
  | "headroom"
  | "market"
  | "matrix"
  | "rank"
  | "find"
  | "trend";
const VIEWS: readonly { id: View; name: string }[] = [
  { id: "monitor", name: "Monitor" },
  { id: "patterns", name: "Patterns" },
  { id: "refinancing", name: "Refinancing" },
  { id: "headroom", name: "Headroom" },
  { id: "market", name: "Market" },
  { id: "matrix", name: "Modules" },
  { id: "rank", name: "Rank" },
  { id: "find", name: "Find" },
  { id: "trend", name: "Trend" },
];

function isAnalyticsView(
  view: View,
): view is "monitor" | "patterns" | "refinancing" | "headroom" | "market" {
  return (
    view === "monitor" ||
    view === "patterns" ||
    view === "refinancing" ||
    view === "headroom" ||
    view === "market"
  );
}

function addressState(): { view: View; field: string; filters: Filters } {
  const query = new URLSearchParams(window.location.search);
  const view = VIEWS.find((item) => item.id === query.get("view"))?.id ?? "monitor";
  return {
    view,
    field: query.get("field") ?? "",
    filters: {
      ...NO_FILTERS,
      query: query.get("q") ?? "",
      sector: query.get("sector") ?? "all",
      pathway: query.get("pathway") ?? "all",
    },
  };
}

/**
 * The coverage data as a reader is shown it: a module code inside a field's group or label, or a
 * figure's stated heading, is drawn as the module's name. Nothing else is changed; keys, links and
 * figures are as the service sent them.
 */
function readerData(data: Data): Data {
  return {
    ...data,
    fields: data.fields.map((item) => ({
      ...item,
      group: serviceText(item.group),
      label: serviceText(item.label),
    })),
    facts: data.facts.map((fact) =>
      fact.heading ? { ...fact, heading: serviceText(fact.heading) } : fact,
    ),
  };
}

function Dashboard({ data: served }: { data: Data }) {
  const data = useMemo(() => readerData(served), [served]);
  const [start] = useState(addressState);
  const [view, setView] = useState<View>(start.view);
  const [filters, setFilters] = useState<Filters>(start.filters);
  const [fieldId, setFieldId] = useState(start.field);
  const [periodPick, setPeriodPick] = useState("");
  const [unitPick, setUnitPick] = useState<string | null>(null);
  const [order, setOrder] = useState<"high" | "low">("high");
  const [by, setBy] = useState("none");
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [onlyChosen, setOnlyChosen] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [selectedIssuer, setSelectedIssuer] = useState<string | null>(data.issuers[0]?.key ?? null);
  const [groups, setGroups] = useState<SavedGroup[]>(readGroups);
  const [groupName, setGroupName] = useState("");
  /** A saved group's issuers that the library still publishes: a gone issuer is not ticked. */
  const published = (group: SavedGroup) =>
    group.issuers.filter((key) => data.issuers.some((issuer) => issuer.key === key));

  const titles = useMemo(
    () => new Map(data.columns.map((column) => [column.code, named(column)])),
    [data],
  );
  const numbers = data.fields.filter((item) => item.kind === "number" && item.series !== "row");
  const choices = data.fields.filter((item) => item.kind === "choice");
  const field = numbers.find((item) => item.id === fieldId) ?? numbers[0];
  const sectors = [...new Set(data.issuers.flatMap((issuer) => issuer.sector ?? []))].sort();
  const pathways = [
    ...new Set(data.issuers.flatMap((issuer) => latestRun(issuer)?.pathwayTitle ?? [])),
  ].sort();
  const words =
    filters.choice === "all"
      ? []
      : [
          ...new Set(
            data.facts.filter((fact) => fact.field === filters.choice).map((fact) => fact.text),
          ),
        ].sort();

  useEffect(() => {
    const address = new URL(window.location.href);
    const values = {
      view: view === "monitor" ? "" : view,
      field: field && (view === "rank" || view === "trend") ? field.id : "",
      q: filters.query,
      sector: filters.sector === "all" ? "" : filters.sector,
      pathway: filters.pathway === "all" ? "" : filters.pathway,
    };
    for (const [key, value] of Object.entries(values)) {
      if (value) address.searchParams.set(key, value);
      else address.searchParams.delete(key);
    }
    window.history.replaceState(window.history.state, "", address);
  }, [view, field, filters]);

  const set = (change: Partial<Filters>) => {
    setFilters((previous) => ({ ...previous, ...change }));
  };
  const stated = field ? periodsOf(data, data.issuers, field.id) : [];
  const period =
    stated.find((item) => item === periodPick) ??
    (field ? commonPeriod(data, data.issuers, field.id) : null);
  // The bounds read one figure at one period in one reporting unit; Trend draws every period, so
  // it applies none. A bound removes an issuer only after comparing its figure: an issuer stated in
  // another unit, or with no one figure for the period, was not compared and stays, listed apart.
  const [low, high] = [readBound(filters.min), readBound(filters.max)];
  const boundSet = view !== "trend" && (low.value !== null || high.value !== null);
  // The unit is read from the issuers the other filters keep, not from every issuer.
  const unbounded = matchIssuers(data, { ...filters, min: "", max: "" }, null).filter(
    (issuer) => !onlyChosen || chosen.has(issuer.key),
  );
  const bound =
    field && period !== null
      ? boundUnit(data, unbounded, field.id, period, unitPick)
      : { units: [], unit: null, tied: [] };
  // Two units tie: the page does not choose, so the bound stays open until the reader does.
  const waiting = boundSet && bound.unit === null && bound.tied.length > 0;
  const matched = matchIssuers(
    data,
    waiting ? { ...filters, min: "", max: "" } : filters,
    field?.id ?? null,
    view === "trend" ? null : period,
    bound.unit,
  );
  const shown = onlyChosen ? matched.filter((issuer) => chosen.has(issuer.key)) : matched;
  /** What an issuer's newest run states for the chosen figure and period. */
  const figureOf = (issuer: Issuer): { unit: string } | { reason: string } => {
    const run = latestRun(issuer);
    const rows =
      run && field && period !== null
        ? factsOf(data, run.key, field.id).filter((fact) => fact.period === period)
        : [];
    const [one] = rows;
    if (rows.length === 1 && one?.at != null) return { unit: one.unit ?? "" };
    if (rows.length > 1) return { reason: "states it more than once" };
    return { reason: rows.length === 1 ? "states a gap" : "states none" };
  };
  const applied = boundSet && !waiting;
  const comparedIn = (issuer: Issuer) => {
    const found = figureOf(issuer);
    return "unit" in found && found.unit === bound.unit;
  };
  const otherUnit = applied
    ? shown.flatMap((issuer) => {
        const found = figureOf(issuer);
        return "unit" in found && found.unit !== bound.unit ? [{ issuer, unit: found.unit }] : [];
      })
    : [];
  const noFigure = applied
    ? shown.flatMap((issuer) => {
        const found = figureOf(issuer);
        return "reason" in found ? [{ issuer, reason: found.reason }] : [];
      })
    : [];
  const compared = applied ? shown.filter(comparedIn).length : 0;
  const toggle = (key: string) => {
    setChosen((previous) => {
      const next = new Set(previous);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  };
  const saveGroup = () => {
    const name = groupName.trim();
    if (!name || chosen.size === 0) return;
    const next = [...groups.filter((group) => group.name !== name), { name, issuers: [...chosen] }];
    setGroups(next);
    writeGroups(next);
    setGroupName("");
  };
  const detail = shown.find((issuer) => issuer.key === open);
  const column = data.columns.find((item) => item.code === filters.module);
  const choiceField = choices.find((item) => item.id === filters.choice);
  // Filters set in the disclosure show beside the chips and remove themselves.
  const active = [
    column && {
      key: "module",
      text: `Module: ${named(column)}${filters.state === "all" ? "" : `, ${STATE_WORDS[filters.state]}`}`,
      clear: () => {
        set({ module: "all", state: "all" });
      },
    },
    choiceField && {
      key: "choice",
      text: `${titles.get(choiceField.module) ?? ""} ${choiceField.label}${filters.word === "all" ? "" : `: ${filters.word}`}`.trim(),
      clear: () => {
        set({ choice: "all", word: "all" });
      },
    },
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const phone = "max-[480px]:min-h-11";
  const unordered = field !== undefined && !periodsOrdered(data, data.issuers, field.id);
  const periodChips = stated.length > 0 && (
    <>
      <div role="group" aria-label="Period" className="flex flex-wrap items-center gap-2 pb-0.5">
        <span aria-hidden="true" className="text-caption text-text-tertiary">
          Period
        </span>
        {stated.map((item) => (
          <Chip
            key={item}
            pressed={item === period}
            onPress={() => {
              setPeriodPick(item);
              setUnitPick(null);
            }}
          >
            {item}
          </Chip>
        ))}
      </div>
      {unordered && (
        <p className="w-full text-caption text-gap-text">
          Periods are in the order the modules state them; this page could not put them in time
          order.
        </p>
      )}
    </>
  );
  const figureSelect = (
    <Choice
      name="Figure"
      value={field?.id ?? ""}
      onChange={(id) => {
        setFieldId(id);
        setUnitPick(null);
      }}
    >
      <FieldOptions fields={numbers} titles={titles} />
    </Choice>
  );
  // A bound reads one figure at one period in one unit, shown as a chip on every view that applies it.
  const boundMark = (text: string) =>
    bound.unit === null
      ? text
      : bound.unit === ""
        ? `${text} (no unit stated)`
        : writtenUnit(text, bound.unit);
  const boundText =
    field && period !== null && applied
      ? `${field.label} ${[low.value !== null && `≥ ${boundMark(filters.min.trim())}`, high.value !== null && `≤ ${boundMark(filters.max.trim())}`].filter(Boolean).join(", ")} · ${period}`
      : null;
  const badBounds = (["min", "max"] as const).filter((side) => readBound(filters[side]).invalid);
  const viewName = VIEWS.find((item) => item.id === view)?.name ?? "Coverage";
  const heading = isAnalyticsView(view)
    ? viewName
    : view === "matrix"
      ? "What each module delivered, by issuer"
      : view === "find"
        ? "Module passages, by issuer"
        : field
          ? view === "rank"
            ? `${field.label}${period ? `, ${period}` : ""}, ranked`
            : `${field.label}, by period`
          : view === "rank"
            ? "Ranked figure"
            : "Figure by period";

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Segmented
          label="View"
          current={view}
          segments={VIEWS.map((item) => ({ key: item.id, label: item.name }))}
          onSelect={(key) => {
            const next = VIEWS.find((item) => item.id === key);
            if (next) setView(next.id);
          }}
        />
        <label className="relative block w-full min-w-0 sm:max-w-md sm:flex-1">
          <span className="sr-only">Search issuers and module text</span>
          <SearchLg
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary"
          />
          <input
            type="search"
            aria-label="Search issuers and module text"
            placeholder="Search issuers and module text"
            value={filters.query}
            onChange={(event) => {
              set({ query: event.currentTarget.value });
            }}
            className={`h-10 w-full rounded-ds-md border border-border-control bg-surface-canvas pr-3 pl-9 text-body text-text-primary placeholder:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${phone}`}
          />
        </label>
        <p role="status" className="text-small text-text-secondary sm:ml-auto">
          {String(shown.length)} of {String(data.issuers.length)} issuers shown
          {otherUnit.length + noFigure.length > 0 &&
            [
              ` · ${String(compared)} compared`,
              otherUnit.length > 0 && `${String(otherUnit.length)} not compared (another unit)`,
              noFigure.length > 0 &&
                `${String(noFigure.length)} not compared (no figure for ${period ?? ""})`,
            ]
              .filter(Boolean)
              .join(", ")}
        </p>
      </div>

      <section aria-label="Filters" className="grid gap-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {(sectors.length > 0 || filters.sector !== "all") && (
            <ChipGroup
              label="Sector"
              choices={sectors}
              value={filters.sector}
              onChange={(sector) => {
                set({ sector });
              }}
            />
          )}
          {(pathways.length > 0 || filters.pathway !== "all") && (
            <ChipGroup
              label="Pathway"
              choices={pathways}
              value={filters.pathway}
              onChange={(pathway) => {
                set({ pathway });
              }}
            />
          )}
          {groups.length > 0 && (
            <div
              role="group"
              aria-label="Saved group"
              className="flex min-w-0 flex-wrap items-center gap-2"
            >
              <span aria-hidden="true" className="text-caption text-text-tertiary">
                Saved groups
              </span>
              {groups.map((group) => (
                <Chip
                  key={group.name}
                  pressed={
                    onlyChosen &&
                    published(group).length === chosen.size &&
                    published(group).every((key) => chosen.has(key))
                  }
                  onPress={() => {
                    setChosen(new Set(published(group)));
                    setOnlyChosen(true);
                  }}
                >
                  {group.name}
                </Chip>
              ))}
            </div>
          )}
          {active.map((item) => (
            <RemovableChip key={item.key} onRemove={item.clear}>
              {item.text}
            </RemovableChip>
          ))}
          {badBounds.map((side) => (
            <RemovableChip
              key={side}
              onRemove={() => {
                set({ [side]: "" });
              }}
            >
              {`${side === "min" ? "At least" : "At most"}: not a number`}
            </RemovableChip>
          ))}
          {waiting && (
            <span
              role="status"
              className="gap-hatch inline-flex max-w-full rounded-ds-xs border border-dashed border-border-gap"
            >
              <span className="m-px rounded-ds-xs bg-surface-card px-3 py-1 text-small text-gap-text">
                Choose a unit for the bound: {bound.tied.map(unitNamer(bound.units)).join(" or ")}
              </span>
            </span>
          )}
          {boundText && (
            <RemovableChip
              onRemove={() => {
                set({ min: "", max: "" });
              }}
            >
              {boundText}
            </RemovableChip>
          )}
          <Button
            color="tertiary"
            size="sm"
            className={`min-h-8 ${phone}`}
            onPress={() => {
              setFilters(NO_FILTERS);
              setOnlyChosen(false);
            }}
          >
            Clear filters
          </Button>
        </div>
        <details className="group rounded-ds-md border border-border-hairline bg-surface-card px-4">
          <summary
            className={`flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-ds-sm text-small font-medium text-text-secondary outline-focus-ring hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 ${phone}`}
          >
            <ChevronRight
              aria-hidden="true"
              className="size-4 shrink-0 text-text-tertiary group-open:rotate-90"
            />
            More filters: module, module state, confidence and figure bounds
            {badBounds.length > 0 && (
              <span className="ml-2 text-error-text">· a bound is not a number</span>
            )}
          </summary>
          <div className="grid gap-3 py-3">
            <div
              role="group"
              aria-label="By module"
              className="flex flex-wrap items-end gap-x-4 gap-y-3"
            >
              <Choice
                name="Module"
                value={filters.module}
                onChange={(module) => {
                  set({ module });
                }}
              >
                <option value="all">Any</option>
                {data.columns.map((item) => (
                  <option key={item.code} value={item.code}>
                    {named(item)}
                  </option>
                ))}
              </Choice>
              {filters.module !== "all" && (
                <Choice
                  name="Module state"
                  value={filters.state}
                  onChange={(state) => {
                    set({ state: state as Filters["state"] });
                  }}
                >
                  <option value="all">Any</option>
                  {Object.entries(STATE_WORDS).map(([state, word]) => (
                    <option key={state} value={state}>
                      {word}
                    </option>
                  ))}
                </Choice>
              )}
              {choices.length > 0 && (
                <Choice
                  name="Module confidence"
                  value={filters.choice}
                  onChange={(choice) => {
                    set({ choice, word: "all" });
                  }}
                >
                  <option value="all">Any</option>
                  <FieldOptions fields={choices} titles={titles} />
                </Choice>
              )}
              {filters.choice !== "all" && (
                <Choice
                  name="Is"
                  value={filters.word}
                  onChange={(word) => {
                    set({ word });
                  }}
                >
                  <option value="all">Any</option>
                  {words.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Choice>
              )}
            </div>
            {numbers.length > 0 && view !== "trend" && (
              <div
                role="group"
                aria-label="By figure"
                className="flex flex-wrap items-end gap-x-4 gap-y-3 border-t border-border-hairline pt-3"
              >
                {view !== "rank" && (
                  <>
                    {figureSelect}
                    {periodChips}
                  </>
                )}
                {(["min", "max"] as const).map((side) => (
                  <label key={side} className={`${label} w-28`}>
                    {side === "min" ? "At least" : "At most"}
                    <input
                      inputMode="decimal"
                      value={filters[side]}
                      aria-invalid={readBound(filters[side]).invalid || undefined}
                      onChange={(event) => {
                        set({ [side]: event.currentTarget.value });
                      }}
                      className={`${control} ${phone}`}
                    />
                    {readBound(filters[side]).invalid && (
                      <span className="text-small font-normal text-error-text">Enter a number</span>
                    )}
                  </label>
                ))}
                {bound.units.length > 1 && (
                  <div
                    role="group"
                    aria-label="Bound unit"
                    className="flex flex-wrap items-center gap-2 pb-0.5"
                  >
                    <span aria-hidden="true" className="text-caption text-text-tertiary">
                      Bound unit
                    </span>
                    {bound.units.map((unit) => (
                      <Chip
                        key={unit}
                        pressed={unit === bound.unit}
                        onPress={() => {
                          setUnitPick(unit);
                        }}
                      >
                        {unit === "" ? "No unit stated" : unitNamer(bound.units)(unit)}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </details>
        {(chosen.size > 0 || onlyChosen) && (
          <div
            role="group"
            aria-label="Compare"
            className="flex flex-wrap items-end gap-x-5 gap-y-3 rounded-ds-md border border-border-hairline bg-surface-card px-4 py-3"
          >
            <p className="flex min-h-10 items-center text-small font-medium text-text-primary">
              {`${String(chosen.size)} ${chosen.size === 1 ? "issuer" : "issuers"} ticked to compare`}
            </p>
            <label className={`flex min-h-10 items-center gap-2 text-small font-medium ${phone}`}>
              <input
                type="checkbox"
                className="size-4"
                checked={onlyChosen}
                onChange={(event) => {
                  setOnlyChosen(event.currentTarget.checked);
                }}
              />
              Show only ticked issuers
            </label>
            <label className={`${label} w-56`}>
              Save ticked issuers as
              <input
                value={groupName}
                onChange={(event) => {
                  setGroupName(event.currentTarget.value);
                }}
                className={`${control} ${phone}`}
              />
            </label>
            <Button
              color="secondary"
              className={phone}
              isDisabled={!groupName.trim() || chosen.size === 0}
              onPress={saveGroup}
            >
              Save group
            </Button>
          </div>
        )}
      </section>

      {numbers.length > 0 && (view === "rank" || view === "trend") && (
        <section
          aria-label="Figure"
          className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-ds-lg border border-border-subtle bg-surface-card p-4"
        >
          {figureSelect}
          {view === "rank" && (
            <>
              {periodChips}
              <Segmented
                label="Order"
                current={order}
                segments={[
                  { key: "high", label: "Highest first" },
                  { key: "low", label: "Lowest first" },
                ]}
                onSelect={(key) => {
                  setOrder(key === "low" ? "low" : "high");
                }}
              />
              <Choice name="Group by" value={by} onChange={setBy}>
                <option value="none">No grouping</option>
                <option value="sector">Sector</option>
                <option value="pathway">Pathway</option>
                <FieldOptions fields={choices} titles={titles} />
              </Choice>
            </>
          )}
        </section>
      )}

      {otherUnit.length > 0 && (
        <p className="text-small text-gap-text">
          Not compared, stated in another unit:{" "}
          {otherUnit
            .map(({ issuer, unit }) => `${issuer.name} (${unitNamer(bound.units)(unit)})`)
            .join("; ")}
          .
        </p>
      )}
      {noFigure.length > 0 && (
        <p className="text-small text-gap-text">
          Not compared, no figure for {period}:{" "}
          {noFigure.map(({ issuer, reason }) => `${issuer.name} (${reason})`).join("; ")}.
        </p>
      )}
      <h2 className="font-display text-h3 text-text-primary">{heading}</h2>
      {view === "monitor" ? (
        shown.length === 0 ? (
          <p className={card}>No issuers match these filters.</p>
        ) : (
          <Monitor
            data={data}
            issuers={shown}
            selected={selectedIssuer}
            onSelect={setSelectedIssuer}
          />
        )
      ) : view === "patterns" ? (
        <Patterns
          data={data}
          issuers={shown}
          selected={selectedIssuer}
          onSelect={setSelectedIssuer}
        />
      ) : view === "refinancing" ? (
        <Refinancing
          data={data}
          issuers={shown}
          selected={selectedIssuer}
          onSelect={setSelectedIssuer}
        />
      ) : view === "headroom" ? (
        <Headroom
          data={data}
          issuers={shown}
          selected={selectedIssuer}
          onSelect={setSelectedIssuer}
        />
      ) : isAnalyticsView(view) ? (
        <section aria-label={viewName} className={card}>
          <label className="flex flex-wrap items-center gap-2 text-small text-text-secondary">
            Issuer
            <select
              aria-label="Selected issuer"
              value={selectedIssuer ?? ""}
              onChange={(event) => {
                setSelectedIssuer(event.currentTarget.value || null);
              }}
              className={control}
            >
              <option value="">No issuer selected</option>
              {data.issuers.map((issuer) => (
                <option key={issuer.key} value={issuer.key}>
                  {issuer.name}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-3">{viewName} analysis is not available yet.</p>
        </section>
      ) : shown.length === 0 ? (
        <p className={card}>No issuers match these filters.</p>
      ) : view === "matrix" ? (
        <>
          <Matrix
            data={data}
            issuers={shown}
            chosen={chosen}
            toggle={toggle}
            open={open}
            setOpen={setOpen}
          />
          {detail && <IssuerDetail data={data} issuer={detail} />}
        </>
      ) : view === "rank" ? (
        <RankView
          data={data}
          issuers={shown}
          field={field}
          period={period}
          order={order}
          by={by}
          boundUnit={boundSet ? bound.unit : null}
        />
      ) : view === "find" ? (
        <FindView data={data} issuers={shown} query={filters.query} titles={titles} />
      ) : (
        <TrendView data={data} issuers={shown} field={field} />
      )}
      <p className="reading-copy max-w-3xl text-small text-text-secondary">
        Every figure and sentence is as its module wrote it, except those marked computed, which
        this page works out from them by the ruled arithmetic. Views read each issuer’s newest run.
      </p>
    </div>
  );
}

export function Coverage({ readOnly = false }: { readOnly?: boolean }) {
  const { value, error, retry } = useResource(getCoverage);
  const empty = value === null || value?.issuers.length === 0;
  // As on the Library: a run can be started from here unless the page is read-only or a preview.
  const canStart = useCanStart(readOnly, Boolean(value?.preview));
  return (
    <>
      <PageHeader title="Coverage" />
      <section className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4">
        {error && (
          <Alert
            tone="error"
            title="Coverage could not be loaded"
            action={
              <Button size="sm" color="secondary" onPress={retry}>
                Try again
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        {value === undefined && !error && (
          <div role="status" aria-label="Loading coverage" className={card}>
            <Skeleton lines={6} />
          </div>
        )}
        {empty && (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.FeaturedIcon icon={BarChartSquare02} />
            </EmptyState.Header>
            <EmptyState.Content>
              <EmptyState.Title>No published runs yet</EmptyState.Title>
              <EmptyState.Description>
                Coverage fills in as runs are published to the Library.
              </EmptyState.Description>
            </EmptyState.Content>
            <EmptyState.Footer>
              {canStart ? (
                <Button href="/start">Start a run</Button>
              ) : (
                <Button href="/" color="secondary">
                  Open the Library
                </Button>
              )}
            </EmptyState.Footer>
          </EmptyState>
        )}
        {value?.preview && <Callout title="Test preview">{value.preview.reason}</Callout>}
        {value && !empty && <Dashboard data={value} />}
      </section>
    </>
  );
}
