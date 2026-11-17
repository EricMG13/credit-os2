import { useId } from "react";
import type { SourceTable } from "./visualData";

const MAP = ["From", "Relationship", "Edge type", "To", "Evidence"];
const BOX = { width: 170, height: 64, column: 320, row: 104, pad: 20 };
const DASHES = [undefined, "7 4", "3 4", "10 4 2 4"];
type Edge = { from: string; to: string; type: string; relationship: string; evidence: string };
type Point = { x: number; y: number };

function layout(edges: Edge[]) {
  const names = [...new Set(edges.flatMap(({ from, to }) => [from, to]))];
  const out = new Map<string, string[]>();
  function reaches(from: string, to: string) {
    const pending = [from];
    const visited = new Set<string>();
    for (const name of pending) {
      if (name === to) return true;
      if (visited.has(name)) continue;
      visited.add(name);
      pending.push(...(out.get(name) ?? []));
    }
    return false;
  }
  const loops = edges.map(({ from, to }) => {
    if (reaches(to, from)) return true;
    out.set(from, [...(out.get(from) ?? []), to]);
    return false;
  });
  const depths = new Map(names.map((name) => [name, 0]));
  // Acyclic edges determine placement. Loop edges are still drawn.
  for (let pass = 0; pass < names.length; pass += 1) {
    let changed = false;
    for (const [name, targets] of out) {
      const next = (depths.get(name) ?? 0) + 1;
      for (const target of targets) {
        if ((depths.get(target) ?? 0) >= next) continue;
        depths.set(target, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const slots = new Map<number, number>();
  const nodes = new Map(
    names.map((name) => {
      const depth = depths.get(name) ?? 0;
      const slot = slots.get(depth) ?? 0;
      slots.set(depth, slot + 1);
      return [name, { x: BOX.pad + depth * BOX.column, y: BOX.pad + slot * BOX.row }] as const;
    }),
  );
  return {
    nodes,
    loops,
    width: BOX.pad * 2 + (slots.size - 1) * BOX.column + BOX.width,
    height: BOX.pad * 2 + (Math.max(...slots.values()) - 1) * BOX.row + BOX.height,
  };
}

function edgePath(from: Point, to: Point, loopDepth: number, offset: number) {
  if (loopDepth > 0) {
    const x = from.x + BOX.width / 2 - 25;
    const dest = to.x + BOX.width / 2 + 25;
    const y = from.y + BOX.height;
    const end = to.y + BOX.height;
    return {
      path: `M${String(x)},${String(y)} V${String(loopDepth)} H${String(dest)} V${String(end)}`,
      x: (x + dest) / 2,
      y: loopDepth,
    };
  }
  const x = from.x + BOX.width;
  const y = from.y + BOX.height / 2 + offset;
  const end = to.y + BOX.height / 2 + offset;
  const mid = (x + to.x) / 2;
  return {
    path: `M${String(x)},${String(y)} C${String(mid)},${String(y)} ${String(mid)},${String(end)} ${String(to.x)},${String(end)}`,
    x: mid,
    y: (y + end) / 2,
  };
}

function EdgeDiagram({ edges, evidenceInDrawer }: { edges: Edge[]; evidenceInDrawer?: boolean }) {
  const arrow = useId();
  const { nodes, width, height, loops } = layout(edges);
  const types = [...new Set(edges.map((edge) => edge.type))];
  const arcs = loops.filter(Boolean).length;
  const pairSizes = new Map<string, number>();
  for (const edge of edges) {
    const pair = JSON.stringify([edge.from, edge.to]);
    pairSizes.set(pair, (pairSizes.get(pair) ?? 0) + 1);
  }
  const pairPositions = new Map<string, number>();
  let loopPosition = 0;
  const routes = [];
  for (const [index, edge] of edges.entries()) {
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    if (!from || !to) continue;
    const pair = JSON.stringify([edge.from, edge.to]);
    const order = pairPositions.get(pair) ?? 0;
    pairPositions.set(pair, order + 1);
    const count = pairSizes.get(pair) ?? 1;
    const separation = Math.min(20, (BOX.height - 12) / count);
    if (loops[index]) loopPosition += 1;
    const route = edgePath(
      from,
      to,
      loops[index] ? height + loopPosition * 24 - 15 : 0,
      (order - (count - 1) / 2) * separation,
    );
    routes.push({ edge, index, route });
  }
  return (
    <div className="grid gap-4">
      <div
        className="overflow-x-auto"
        role="region"
        aria-label="Directed relationship map"
        // This region scrolls horizontally when the graph exceeds the card width.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <svg
          width={width}
          height={height + arcs * 30}
          className="block max-w-none"
          role="img"
          aria-label="Directed relationship graph. The connection key gives the exact wording."
        >
          <defs>
            <marker
              id={arrow}
              markerWidth="8"
              markerHeight="8"
              refX="8"
              refY="4"
              orient="auto"
              viewBox="0 0 8 8"
            >
              <path d="M0 0L8 4L0 8Z" fill="var(--color-text-secondary)" />
            </marker>
          </defs>
          {routes.map(({ edge, index, route }) => {
            return (
              <g key={index} data-map-edge={index + 1}>
                <title>
                  {edge.from} → {edge.to} · {edge.type} · {edge.relationship}
                </title>
                <path
                  d={route.path}
                  fill="none"
                  stroke="var(--color-text-secondary)"
                  strokeWidth="1.5"
                  strokeDasharray={DASHES[types.indexOf(edge.type) % DASHES.length]}
                  markerEnd={`url(#${arrow})`}
                />
                <circle
                  cx={route.x}
                  cy={route.y}
                  r="9"
                  fill="var(--color-surface-card)"
                  stroke="var(--color-border-control)"
                />
                <text
                  x={route.x}
                  y={route.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-text-primary text-caption"
                >
                  {index + 1}
                </text>
              </g>
            );
          })}
          {[...nodes].map(([name, { x, y }]) => (
            <g key={name} data-map-node={name}>
              <title>{name}</title>
              <foreignObject x={x} y={y} width={BOX.width} height={BOX.height}>
                <div className="flex h-full items-center justify-center rounded-ds-md border border-border-control bg-surface-card px-2 text-center text-small font-semibold break-words text-text-primary">
                  <span className="line-clamp-3">{name}</span>
                </div>
              </foreignObject>
            </g>
          ))}
        </svg>
      </div>
      <ol aria-label="Connection key" className="grid list-decimal gap-2 pl-5 text-small">
        {edges.map(({ from, relationship, type, to, evidence }, index) => (
          <li key={index}>
            <p>
              <strong>{from}</strong> → <strong>{to}</strong> · {type}
            </p>
            <p className="text-text-secondary">
              {relationship}
              {evidenceInDrawer ? "" : ` · ${evidence}`}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function edgeMap(table: SourceTable) {
  if (table.headers.join("\0") !== MAP.join("\0")) return null;
  const edges = table.rows.flatMap(
    ([from = "", relationship = "", type = "", to = "", evidence = ""]) =>
      [from, to, type, relationship].some((value) => !value || value.startsWith("Not supplied:"))
        ? []
        : [{ from, relationship, type, to, evidence }],
  );
  if (!edges.length || edges.length !== table.rows.length) return null;
  return <EdgeDiagram edges={edges} evidenceInDrawer={table.evidenceInDrawer} />;
}
