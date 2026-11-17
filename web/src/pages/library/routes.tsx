// The library page group. Add a page as a route object below with a literal `path: "/…"` property
// written in this file; every path starts with /library/. scripts/route-paths.mjs reads these paths
// to visit each in a browser, and a test fails if it cannot see one. A page reads its data with
// `readSlice(useSource().library)`. Edit only this folder and fixtures/library.json.
import type { LibraryData } from "../../data";
import type { Route } from "../route-table";
import { Changes } from "./Changes";
import { Evidence } from "./Evidence";
import { History } from "./History";
import { Home } from "./Home";
import { ModulePage } from "./Module";
import { Overview } from "./Overview";
import { PAGE_NAME } from "./parts/PageTitle";
import { readSlice } from "./read";
import type { Run } from "./slice";

export { readSlice } from "./read";

type Subject = NonNullable<Route["subject"]>;

/** The issuer the address names, if the library holds one. */
function issuerOf(params: Record<string, string>, data: LibraryData) {
  const slice = readSlice(data.library);
  return slice.kind === "ok"
    ? slice.data.issuers.find((issuer) => issuer.id === params["issuer"])
    : undefined;
}

const historySubject: Subject = (params, data) => issuerOf(params, data)?.name;

/**
 * A run page's subject: what the page shows first (a module, an Evidence tab), the issuer and the
 * run's date. A run the library does not hold gives none.
 */
function runSubject(lead: (params: Record<string, string>, run: Run) => string | null): Subject {
  return (params, data) => {
    const issuer = issuerOf(params, data);
    const run = issuer?.runs.find((item) => item.id === params["run"]);
    if (issuer === undefined || run === undefined) return undefined;
    return [lead(params, run), issuer.name, run.head.asOf]
      .filter((part) => part !== null)
      .join(" — ");
  };
}

const runPage = runSubject(() => null);
const evidenceTab = (tab: string): Subject => runSubject(() => tab);
const traceSubject = runSubject((params, run) => {
  const item = run.evidence?.trace.rows.find((row) => row.id === params["item"]);
  return item === undefined ? "Trace" : `Trace — ${item.item}`;
});
const moduleSubject = runSubject((params, run) => {
  const wanted = params["module"] ?? run.head.firstModule;
  return run.modules?.find((module) => module.id === wanted)?.name ?? null;
});

export const routes: readonly Route[] = [
  {
    path: "/library/home",
    home: "/library/home",
    layout: "bleed",
    title: PAGE_NAME.home,
    render: () => <Home />,
  },
  {
    path: "/library/:issuer/history",
    layout: "bleed",
    title: PAGE_NAME.history,
    subject: historySubject,
    render: (params) => <History issuer={params["issuer"]} />,
  },
  {
    path: "/library/:issuer/:run/overview",
    layout: "bleed",
    title: PAGE_NAME.overview,
    subject: runPage,
    render: (params) => <Overview issuer={params["issuer"]} run={params["run"]} />,
  },
  {
    path: "/library/:issuer/:run/changes",
    layout: "bleed",
    title: PAGE_NAME.changes,
    subject: runPage,
    render: (params) => <Changes issuer={params["issuer"]} run={params["run"]} />,
  },
  {
    path: "/library/:issuer/:run/modules",
    layout: "bleed",
    title: PAGE_NAME.modules,
    subject: moduleSubject,
    render: (params) => (
      <ModulePage issuer={params["issuer"]} run={params["run"]} module={undefined} />
    ),
  },
  {
    path: "/library/:issuer/:run/modules/:module",
    layout: "bleed",
    title: PAGE_NAME.modules,
    subject: moduleSubject,
    render: (params) => (
      <ModulePage issuer={params["issuer"]} run={params["run"]} module={params["module"]} />
    ),
  },
  {
    path: "/library/:issuer/:run/evidence",
    layout: "bleed",
    title: PAGE_NAME.evidence,
    subject: evidenceTab("Summary"),
    render: (params) => <Evidence issuer={params["issuer"]} run={params["run"]} page="summary" />,
  },
  {
    path: "/library/:issuer/:run/evidence/summary",
    layout: "bleed",
    title: PAGE_NAME.evidence,
    subject: evidenceTab("Summary"),
    render: (params) => <Evidence issuer={params["issuer"]} run={params["run"]} page="summary" />,
  },
  {
    path: "/library/:issuer/:run/evidence/sources",
    layout: "bleed",
    title: PAGE_NAME.evidence,
    subject: evidenceTab("Sources"),
    render: (params) => <Evidence issuer={params["issuer"]} run={params["run"]} page="sources" />,
  },
  {
    path: "/library/:issuer/:run/evidence/trace",
    layout: "bleed",
    title: PAGE_NAME.evidence,
    subject: evidenceTab("Trace"),
    render: (params) => <Evidence issuer={params["issuer"]} run={params["run"]} page="trace" />,
  },
  {
    path: "/library/:issuer/:run/evidence/trace/:item",
    layout: "bleed",
    title: PAGE_NAME.evidence,
    subject: traceSubject,
    render: (params) => (
      <Evidence issuer={params["issuer"]} run={params["run"]} page="trace" item={params["item"]} />
    ),
  },
  {
    path: "/library/:issuer/:run/evidence/gaps/:item",
    layout: "bleed",
    title: PAGE_NAME.evidence,
    subject: evidenceTab("Gaps"),
    render: (params) => (
      <Evidence issuer={params["issuer"]} run={params["run"]} page="gaps" item={params["item"]} />
    ),
  },
  {
    path: "/library/:issuer/:run/evidence/record",
    layout: "bleed",
    title: PAGE_NAME.evidence,
    subject: evidenceTab("Record"),
    render: (params) => <Evidence issuer={params["issuer"]} run={params["run"]} page="record" />,
  },
  {
    path: "/library/:issuer/:run/evidence/gaps",
    layout: "bleed",
    title: PAGE_NAME.evidence,
    subject: evidenceTab("Gaps"),
    render: (params) => <Evidence issuer={params["issuer"]} run={params["run"]} page="gaps" />,
  },
];
