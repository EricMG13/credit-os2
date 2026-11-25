import type { ReactElement } from "react";
import { SLICE_KEYS, type LibraryData, type SliceKey } from "../data";
import { libraryRoutes, readSlice as readLibrary } from "./library/routes";
import { modelRoutes, readSlice as readModel } from "./model/routes";
import { readSlice as readRun, runRoutes } from "./run/routes";
import { readSlice as readSignal, signalRoutes } from "./signal/routes";
import { matchRoute } from "./route-match";

export { matchRoute };

/**
 * `path` is a pattern with `:name` segments, for example `/library/:issuer/:run/overview`.
 *
 * `home` is a concrete address that `path` matches; the group's bare address (`#/signal`, or `#/`
 * for the library) draws the group's first route with a home as if it were that address, for
 * example path `/signal/:space/feed/:tab` with home `/signal/main/feed/for-you`.
 * - A home is a double-quoted string literal in the group's routes.tsx, like `path`: a constant,
 *   a template string or another file would hide it from the from-disk script, and a test fails.
 * - A home must not name anything that comes from the data file unless the fixture and the
 *   delivered library both guarantee it; a parameterless index route is the safe home.
 * - At the bare address the hash is not the home's, so a page reads its current tab and the like
 *   from `params`, never from the hash.
 *
 * `layout: "bleed"` draws the page edge to edge: no App header and no padding on `main`. The page
 * then owns what the shell would have given it:
 * - it restores its own padding where it needs one (`p-8` is the shell's);
 * - it draws its own `h1` (every page has exactly one);
 * - it keeps focus rings inside `main`: the unpadded `main` clips an outline at its edge, so use
 *   inner padding or an inset ring.
 * Absent means the padded layout with the title as the h1.
 *
 * `subject` is what the page is about, for its document title (the tab and the history list): the
 * title "Overview" is followed by the issuer and the run's date. It reads the data file the way the
 * page does and returns `undefined` when the address names nothing the data file holds.
 */
export type Route = {
  path: string;
  home?: string;
  layout?: "bleed";
  title: string;
  subject?: (params: Record<string, string>, data: LibraryData) => string | undefined;
  render: (params: Record<string, string>) => ReactElement;
};

export type SliceResult<T> =
  { kind: "ok"; data: T } | { kind: "absent" } | { kind: "invalid"; reason: string };

type SliceReader = (source: unknown) => SliceResult<unknown>;

/** Every route, and each group's reader for its member of the data file. */
export type RouteTable = {
  routes: readonly Route[];
  readers: Readonly<Record<SliceKey, SliceReader>>;
};

/** A route belongs to the group named by its first path segment, the library when none is. */
export function areaOf(routePath: string): SliceKey {
  const first = routePath.split("/")[1];
  return SLICE_KEYS.find((key) => key === first) ?? "library";
}

/**
 * One message per route whose `home` has a `:` segment or a `?`, is not matched to that route,
 * leaves its group (the one `areaOf` names), or is a second home in its group.
 */
export function homeProblems(routes: readonly Route[]): string[] {
  const problems: string[] = [];
  const firstHome = new Map<SliceKey, string>();
  for (const route of routes) {
    const home = route.home;
    if (home === undefined) continue;
    const group = areaOf(route.path);
    const earlier = firstHome.get(group);
    if (earlier === undefined) firstHome.set(group, route.path);
    else problems.push(`${route.path}: group ${group} already has a home, ${earlier}`);
    if (home.split("/").some((segment) => segment.startsWith(":")))
      problems.push(`${route.path}: home ${home} has a : segment`);
    else if (home.includes("?")) problems.push(`${route.path}: home ${home} has a ?`);
    else if (matchRoute(home, routes)?.route !== route)
      problems.push(`${route.path}: home ${home} is not matched to this route`);
    else if (!home.startsWith(`/${group}/`))
      problems.push(`${route.path}: home ${home} is outside /${group}/`);
  }
  return problems;
}

export const routeTable: RouteTable = {
  routes: [...libraryRoutes, ...modelRoutes, ...runRoutes, ...signalRoutes],
  readers: { library: readLibrary, model: readModel, run: readRun, signal: readSignal },
};
