// Matching an address to a route, apart from the route table: a page that routes over one group's
// routes (Signal in the connected app) takes this without the other groups' pages.
import type { Route } from "./route-table";

function matchSegments(
  pattern: readonly string[],
  actual: readonly string[],
): Record<string, string> | null {
  if (pattern.length !== actual.length) return null;
  const params: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [index, want] of pattern.entries()) {
    const got = actual[index];
    if (got === undefined) return null;
    if (want.startsWith(":")) {
      if (got === "") return null;
      try {
        params[want.slice(1)] = decodeURIComponent(got);
      } catch {
        // A malformed escape is an address no route can own, so it matches nothing.
        return null;
      }
    } else if (want !== got) {
      return null;
    }
  }
  return params;
}

/**
 * `hash` is what useHashRoute returns. `:name` captures one non-empty segment (decoded), one
 * trailing slash is ignored and the first matching route wins. No wildcard, optional segment or query.
 */
export function matchRoute(
  hash: string,
  routes: readonly Route[],
): { route: Route; params: Record<string, string> } | null {
  const actual = (hash.endsWith("/") ? hash.slice(0, -1) : hash).split("/");
  for (const route of routes) {
    const params = matchSegments(route.path.split("/"), actual);
    if (params !== null) return { route, params };
  }
  return null;
}
