import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { citedSourceNames, sourceFileLinks } = await import(
  pathToFileURL(path.resolve("web/src/pages/connected/sourceFiles.ts"))
);
const sha256 = "a".repeat(64);
const href = `/connected/sources/run/${sha256}/filing.txt`;
const second = href.replace(sha256, "b".repeat(64));
const links = [2, 7, 2].flatMap((page) =>
  sourceFileLinks("run", {
    name: "filing.txt",
    sha256,
    href,
    pageHref: `${href}?page=${page}`,
  }),
);
links.push(
  ...sourceFileLinks("run", {
    name: "filing.txt",
    sha256: "b".repeat(64),
    href: second,
    pageHref: `${second}?page=11`,
  }),
);
const result = citedSourceNames(links);
assert.deepEqual(result, [
  { path: href, text: "filing.txt, cited page 2; page 7" },
  { path: second, text: "filing.txt, cited page 11" },
]);
console.log(
  "PASS: all distinct page ranges retained, duplicates removed, digest identities separate.",
);
