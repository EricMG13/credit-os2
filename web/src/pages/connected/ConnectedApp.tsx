import { lazy, Suspense, useEffect } from "react";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/gap/Skeleton";
import { PageHeader } from "../../shell/PageHeader";
import { Shell, type Area } from "../../shell/Shell";
import type { Mode } from "./api";

const ReportLibrary = lazy(() =>
  import("./LibraryIndex").then(({ ReportLibrary }) => ({ default: ReportLibrary })),
);
const ReportReader = lazy(() =>
  import("./ReportLibrary").then(({ ReportReader }) => ({ default: ReportReader })),
);
const RunActivity = lazy(() =>
  import("./RunActivity").then(({ RunActivity }) => ({ default: RunActivity })),
);
const RunProgress = lazy(() =>
  import("./RunProgress").then(({ RunProgress }) => ({ default: RunProgress })),
);
const StartRun = lazy(() => import("./StartRun").then(({ StartRun }) => ({ default: StartRun })));

function LoadingPage() {
  return (
    <div
      role="status"
      aria-label="Loading this page"
      className="mx-auto mt-6 grid w-full max-w-[96rem] gap-6"
    >
      <Skeleton lines={2} />
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((key) => (
          <div key={key} className="rounded-ds-lg border border-border-subtle p-8">
            <Skeleton lines={5} />
          </div>
        ))}
      </div>
    </div>
  );
}

const SECTIONS: { area: Area; href: string; label?: string }[] = [
  { area: "library", href: "/" },
  { area: "run", href: "/runs", label: "Run activity" },
];

function assign(path: string) {
  window.location.assign(path);
}

function reportFolder(path: string) {
  const segment = /^\/report\/([^/]+)\/?$/.exec(path)?.[1];
  if (!segment) return null;
  try {
    const folder = decodeURIComponent(segment);
    return !/[^\p{Letter}\p{Number}_. -]/u.test(folder) && folder !== "." && folder !== ".."
      ? folder
      : null;
  } catch {
    return null;
  }
}

export function ConnectedApp({
  path,
  search = window.location.search,
  mode,
  navigate = assign,
}: {
  path: string;
  search?: string;
  mode: Mode;
  navigate?: (path: string) => void;
}) {
  const run = /^\/run\/([a-zA-Z0-9][a-zA-Z0-9_.-]{0,79})\/?$/.exec(path)?.[1];
  const report = reportFolder(path);
  const start = path === "/start" || path === "/start/";
  const prior = new URLSearchParams(search).get("from");
  const runs = path === "/runs" || path === "/runs/";
  useEffect(() => {
    const title = start
      ? "Start a run"
      : runs
        ? "Run activity"
        : run
          ? "Run progress"
          : report
            ? "Credit report"
            : "Library";
    document.title = `${title} — Credit OS`;
  }, [path, start, runs, run, report]);
  const current = start || run || runs ? "run" : "library";
  return (
    <Shell current={current} sections={SECTIONS} symbol="/symbol.svg">
      <Suspense fallback={<LoadingPage />}>
        {path === "/" || path === "/index.html" ? (
          <ReportLibrary />
        ) : start ? (
          <StartRun key={prior} mode={mode} navigate={navigate} from={prior ?? undefined} />
        ) : runs ? (
          <RunActivity />
        ) : run ? (
          <RunProgress key={run} id={run} mode={mode} />
        ) : report ? (
          <ReportReader key={report} id={report} mode={mode} />
        ) : (
          <PageHeader title="Page not found" actions={<Button href="/">Library</Button>} />
        )}
      </Suspense>
    </Shell>
  );
}
