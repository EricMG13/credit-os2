import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/gap/Skeleton";
import { PageHeader } from "../../shell/PageHeader";
import { Shell, type Area } from "../../shell/Shell";
import { askAhead, LIBRARY_ADDRESS, snapshotAddress } from "./ahead";
import type { Mode } from "./api";
import { COVERAGE_ADDRESS } from "./coverageData";
import { RunReadOnly } from "./RunReadOnly";
import { canStartRun, PreviewReport } from "./startAction";

type PageFile<P> = { default: ComponentType<P> };

/**
 * A page kept in its own file, asked for once. Asked for ahead and already answered when first
 * drawn, it is drawn in that drawing, or fails in it, with no loading state between; React keeps a
 * loading state it has shown on screen for 300 ms however soon the file arrives. Drawn before the
 * answer, it waits on that same request as any lazy page does.
 */
function page<P extends object>(load: () => Promise<ComponentType<P>>) {
  type Answer = (file: (file: PageFile<P>) => void, failed: (failure: unknown) => void) => void;
  let asked: Promise<PageFile<P>> | undefined;
  let answered: Promise<PageFile<P>> | undefined;
  // React draws an answer already given only when `then` answers as it is called.
  const answer = (then: Answer) => {
    answered = { then } as unknown as Promise<PageFile<P>>;
  };
  const ask = () => {
    if (asked) return asked;
    asked = load().then((component) => ({ default: component }));
    asked.then(
      (file) => {
        answer((loaded) => {
          loaded(file);
        });
      },
      (failure: unknown) => {
        answer((_, failed) => {
          failed(failure);
        });
      },
    );
    return asked;
  };
  return Object.assign(
    lazy(() => answered ?? ask()),
    { ask },
  );
}

const ReportLibrary = page(() => import("./LibraryIndex").then((file) => file.ReportLibrary));
const Coverage = page(() => import("./Coverage").then((file) => file.Coverage));
const ReportReader = page(() => import("./ReportLibrary").then((file) => file.ReportReader));
const RunActivity = page(() => import("./RunActivity").then((file) => file.RunActivity));
const RunProgress = page(() => import("./RunProgress").then((file) => file.RunProgress));
const StartRun = page(() => import("./StartRun").then((file) => file.StartRun));

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
  { area: "coverage", href: "/coverage" },
  { area: "run", href: "/runs", label: "Run activity" },
];

const START_ACTION = { href: "/start", label: "Start run" };

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

const RUN = /^\/run\/([a-zA-Z0-9][a-zA-Z0-9_.-]{0,79})\/?$/;

type Route =
  | { kind: "library" }
  | { kind: "coverage" }
  | { kind: "run-list" }
  | { kind: "run"; id: string }
  | { kind: "report"; id: string }
  | { kind: "start" }
  | { kind: "missing" };

function routeOf(path: string): Route {
  if (path === "/" || path === "/index.html") return { kind: "library" };
  if (path === "/coverage" || path === "/coverage/") return { kind: "coverage" };
  if (path === "/runs" || path === "/runs/") return { kind: "run-list" };
  if (path === "/start" || path === "/start/") return { kind: "start" };
  const run = RUN.exec(path)?.[1];
  if (run) return { kind: "run", id: run };
  const report = reportFolder(path);
  return report ? { kind: "report", id: report } : { kind: "missing" };
}

/**
 * Ask for the file that draws this route. For the library and reports, start their first data
 * request once the file arrives, while React draws the page.
 */
export function preloadPage(path: string, readOnly: boolean): Promise<unknown> {
  const route = routeOf(path);
  const reads = (address: string) => () => {
    askAhead(address);
  };
  const unloaded = () => undefined;
  if (route.kind === "library") return ReportLibrary.ask().then(reads(LIBRARY_ADDRESS), unloaded);
  if (route.kind === "report")
    return ReportReader.ask().then(reads(snapshotAddress(route.id)), unloaded);
  if (route.kind === "coverage") return Coverage.ask().then(reads(COVERAGE_ADDRESS), unloaded);
  if (readOnly) return Promise.resolve();
  if (route.kind === "start") return StartRun.ask().catch(unloaded);
  if (route.kind === "run-list") return RunActivity.ask().catch(unloaded);
  if (route.kind === "run") return RunProgress.ask().catch(unloaded);
  return Promise.resolve();
}

function routeTitle(route: Route) {
  if (route.kind === "start") return "Start a run";
  if (route.kind === "run-list") return "Run activity";
  if (route.kind === "run") return "Run progress";
  if (route.kind === "report") return "Credit report";
  if (route.kind === "coverage") return "Coverage";
  return "Library";
}

function CurrentPage({
  route,
  prior,
  mode,
  readOnly,
  navigate,
}: {
  route: Route;
  prior: string | null;
  mode: Mode;
  readOnly: boolean;
  navigate: (path: string) => void;
}) {
  if (route.kind === "library") return <ReportLibrary readOnly={readOnly} />;
  if (route.kind === "coverage") return <Coverage readOnly={readOnly} />;
  if (readOnly && route.kind === "run-list") return <RunReadOnly title="Run activity" />;
  if (readOnly && route.kind === "run") return <RunReadOnly title="Run progress" />;
  if (readOnly && route.kind === "start") return <RunReadOnly title="Start run" />;
  if (route.kind === "start")
    return <StartRun key={prior} mode={mode} navigate={navigate} from={prior ?? undefined} />;
  if (route.kind === "run-list") return <RunActivity mode={mode} />;
  if (route.kind === "run") return <RunProgress key={route.id} id={route.id} mode={mode} />;
  if (route.kind === "report") return <ReportReader key={route.id} id={route.id} mode={mode} />;
  return (
    <>
      <PageHeader
        title="Page not found"
        actions={
          <>
            <Button href="/">Open the Library</Button>
            {!readOnly && (
              <Button href="/runs" color="secondary">
                Open Run activity
              </Button>
            )}
          </>
        }
      />
      <p className="reading-copy mt-6 max-w-3xl text-body text-text-secondary">
        This address has no page. The link may be mistyped, or the report may have been renamed.
      </p>
    </>
  );
}

export function ConnectedApp({
  path,
  search = window.location.search,
  mode,
  readOnly = false,
  navigate = assign,
}: {
  path: string;
  search?: string;
  mode: Mode;
  readOnly?: boolean;
  navigate?: (path: string) => void;
}) {
  const route = routeOf(path);
  const prior = new URLSearchParams(search).get("from");
  const title = routeTitle(route);
  // A page showing a retained test preview says so; the bar's action follows the pages' condition.
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    document.title = `${title} — Credit OS`;
  }, [title]);
  const current =
    route.kind === "start" || route.kind === "run-list" || route.kind === "run"
      ? "run"
      : route.kind === "coverage"
        ? "coverage"
        : "library";
  return (
    <Shell
      current={current}
      sections={readOnly ? SECTIONS.slice(0, 2) : SECTIONS}
      symbol="/symbol.svg"
      // Screen map, "On every screen": Start run is the bar's primary action, except on itself.
      action={route.kind === "start" || !canStartRun(readOnly, preview) ? undefined : START_ACTION}
    >
      <PreviewReport value={setPreview}>
        <Suspense fallback={<LoadingPage />}>
          <CurrentPage
            route={route}
            prior={prior}
            mode={mode}
            readOnly={readOnly}
            navigate={navigate}
          />
        </Suspense>
      </PreviewReport>
    </Shell>
  );
}
