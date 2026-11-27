# Report · Calendar

## Purpose and source contract

Show dated events and maturities in time order. Resolve module event references from `Snapshot.workspace.outputs[outputId].events[]`, then their referenced `Section.blocks[]` table (`headers`, `rows[].cells[]`); use `PublishedRun.asOf` only for the as-of marker. Preserve each event's supplied date precision, label, status, amount and basis. Events without dates remain unplaced; they do not receive a guessed position on the axis.

## Layout and components

- Keep the shared report header/tabs. Lead with a horizontal time axis with separate lanes by the event's supplied category. Keep the readable event list directly beside or below the chart.
- Use maturity amount as a relative mark only where the source provides amount and unit. Event kind stays neutral unless the source types it and the governing palette defines a treatment.
- **Reuse:** report shell, `PageHeader`, `Tabs`, `Timeline` (`web/src/components/timeline/Timeline.tsx`), `ChartWithTable`, table components and `PublishedTraceProvider` for the report-level drawer context plus `PublishedSource` for each item control (both from `web/src/pages/connected/report/PublishedTrace.tsx`). The horizontal multi-lane axis, event-list pairing and maturity/gap grouping are new composition.
- **New composition:** multi-lane calendar axis, compact list pairing and undated-event gap list. Keep each item's date/label/trace together.

At 1280, show the axis and a numbered/listed reading view side by side. At 1024, stack the list under the axis. The page itself must not scroll horizontally; long time spans may use a locally named axis viewport only if keyboard-accessible and accompanied by the full event list.

## Data, trace and states

Read event label, date, kind, amount, unit and owning module from typed event fields. Preserve “thereafter” and undated forms as written; don't assign a date. Don't calculate new event categories or aggregate maturities. Each point and list row gets a trace. Source references live in Evidence/the trace drawer.

Draw no-events, undated-only, missing amount, loading and unavailable-calendar states explicitly. Missing values are not zero. Keep the timeline legend in words and do not make color the only category cue.

## Offline placeholder wireframe

[Open the standalone calendar wireframe](wireframes/calendar.html). This generic layout follows its screen map and contains no source values.
