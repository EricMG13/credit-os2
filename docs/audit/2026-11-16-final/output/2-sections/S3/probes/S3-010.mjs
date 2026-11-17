// S3-010: the static reader has eleven record kinds; the matrix names components that none of them can express.
import { readFileSync } from "node:fs";
import { run } from "./_lib.mjs";

await run(async ({ say, defect }) => {
  const read = readFileSync("web/src/pages/library/read.ts", "utf8");
  const kinds = [...read.matchAll(/^\s+"(matrix|watch|questions|edges|metrics|measures|facts|status|statement|chartTable|gap)",?$/gm)].map((m) => m[1]);
  say(`record kinds the static reader accepts (read.ts readRecord): ${[...new Set(kinds)].join(", ")}`);
  const csv = readFileSync("docs/audit/2026-11-16-final/output/1-rubrics/content-matrix.csv", "utf8").split("\n");
  const wanted = /\b(R4|R9|P6|C5|C8|C11|C13|C15|F6|C2|C3)\b|EventLane|EdgeMap|PairTile|LimitsChart/;
  const rows = csv.filter((l) => /^"CM-\d+"/.test(l) && /C3;S3|;S3/.test(l) && wanted.test(l.split('","')[5] ?? ""));
  say(`content-matrix rows with section S3 whose component is one of R4, R9, P6, C2, C3, C5, C8, C11, C13, C15, F6, EdgeMap, EventLane: ${rows.length}`);
  say(rows.slice(0, 5).map((r) => r.slice(0, 120)).join("\n"));
  if (rows.length > 0) defect("no record kind exists for dated lanes, case cards, the for-and-against board, trend and path charts, ranked bars, dumbbells, limits or rating pairs");
});
