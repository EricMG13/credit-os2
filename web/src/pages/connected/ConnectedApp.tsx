import { lazy, Suspense, useEffect, type ComponentType } from "react";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/gap/Skeleton";
import { PageHeader } from "../../shell/PageHeader";
import { Shell, type Area } from "../../shell/Shell";
import { askAhead, LIBRARY_ADDRESS, snapshotAddress } from "./ahead";
import type { Mode } from "./api";
import { COVERAGE_ADDRESS } from "./coverageData";
import { RunReadOnly } from "./RunReadOnly";

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
const SignalLive = page(() => import("../signal/live/SignalLive").then((file) => file.SignalLive));

/** `bleed`: the page is drawn edge to edge, so the loading state takes the padding the shell left out. */
function LoadingPage({ bleed = false }: { bleed?: boolean }) {
  return (
    <div
      role="status"
      aria-label="Loading this page"
      className={`mx-auto mt-6 grid w-full max-w-[96rem] gap-6${bleed ? " px-4 sm:px-8" : ""}`}
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

type Section = { area: Area; href: string; label?: string };

const LIBRARY: Section = { area: "library", href: "/" };
const COVERAGE: Section = { area: "coverage", href: "/coverage" };
const RUNS: Section = { area: "run", href: "/runs", label: "Run activity" };
const SIGNAL: Section = { area: "signal", href: "/signal" };

/** A read-only preview shows the library and coverage; Signal is listed where a Signal service is set. */
function sectionsFor(readOnly: boolean, signal: boolean): Section[] {
  if (readOnly) return [LIBRARY, COVERAGE];
  return signal ? [LIBRARY, COVERAGE, RUNS, SIGNAL] : [LIBRARY, COVERAGE, RUNS];
}

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
  | { kind: "signal" }
  | { kind: "missing" };

/** `signal`: a Signal service is set and this is not a read-only preview; without it /signal is no page. */
function routeOf(path: string, signal: boolean): Route {
  if (path === "/" || path === "/index.html") return { kind: "library" };
  if (path === "/coverage" || path === "/coverage/") return { kind: "coverage" };
  if (path === "/runs" || path === "/runs/") return { kind: "run-list" };
  if (path === "/start" || path === "/start/") return { kind: "start" };
  if (signal && (path === "/signal" || path === "/signal/")) return { kind: "signal" };
  const run = RUN.exec(path)?.[1];
  if (run) return { kind: "run", id: run };
  const report = reportFolder(path);
  return report ? { kind: "report", id: report } : { kind: "missing" };
}

/**
 * Ask for the file that draws this route. For the library and reports, start their first data
 * request once the file arrives, while React draws the page.
 */
export function preloadPage(path: string, readOnly: boolean, signal = false): Promise<unknown> {
  const route = routeOf(path, signal && !readOnly);
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
  if (route.kind === "signal") return SignalLive.ask().catch(unloaded);
  return Promise.resolve();
}

function areaOf(route: Route): Area {
  if (route.kind === "signal") return "signal";
  if (route.kind === "coverage") return "coverage";
  return route.kind === "start" || route.kind === "run-list" || route.kind === "run"
    ? "run"
    : "library";
}

function routeTitle(route: Route) {
  if (route.kind === "start") return "Start a run";
  if (route.kind === "run-list") return "Run activity";
  if (route.kind === "run") return "Run progress";
  if (route.kind === "report") return "Credit report";
  if (route.kind === "signal") return "Signal";
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
  if (route.kind === "coverage") return <Coverage />;
  if (readOnly && route.kind === "run-list") return <RunReadOnly title="Run activity" />;
  if (readOnly && route.kind === "run") return <RunReadOnly title="Run progress" />;
  if (readOnly && route.kind === "start") return <RunReadOnly title="Start run" />;
  if (route.kind === "start")
    return <StartRun key={prior} mode={mode} navigate={navigate} from={prior ?? undefined} />;
  if (route.kind === "run-list") return <RunActivity mode={mode} />;
  if (route.kind === "run") return <RunProgress key={route.id} id={route.id} mode={mode} />;
  if (route.kind === "report") return <ReportReader key={route.id} id={route.id} mode={mode} />;
  if (route.kind === "signal") return <SignalLive />;
  return <PageHeader title="Page not found" actions={<Button href="/">Library</Button>} />;
}

export function ConnectedApp({
  path,
  search = window.location.search,
  mode,
  readOnly = false,
  signal = false,
  navigate = assign,
}: {
  path: string;
  search?: string;
  mode: Mode;
  readOnly?: boolean;
  /** A Signal service is set for this app: the page was served with its address. */
  signal?: boolean;
  navigate?: (path: string) => void;
}) {
  const route = routeOf(path, signal && !readOnly);
  const prior = new URLSearchParams(search).get("from");
  const title = routeTitle(route);
  useEffect(() => {
    document.title = `${title} — Credit OS`;
  }, [title]);
  // The Signal screens fill the page region edge to edge, as they do in the design reference.
  const bleed = route.kind === "signal";
  return (
    <Shell
      current={areaOf(route)}
      bleed={bleed}
      sections={sectionsFor(readOnly, signal)}
      symbol="/symbol.svg"
    >
      <Suspense fallback={<LoadingPage bleed={bleed} />}>
        <CurrentPage
          route={route}
          prior={prior}
          mode={mode}
          readOnly={readOnly}
          navigate={navigate}
        />
      </Suspense>
    </Shell>
  );
}
