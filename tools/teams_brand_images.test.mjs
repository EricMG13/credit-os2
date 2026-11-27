import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("brand generation resolves Playwright from the web workspace", async () => {
  const web = createRequire(new URL("../web/package.json", import.meta.url));
  const playwright = web.resolve("playwright");
  const resolved = new Error(
    "Playwright resolved before running any asset generation",
  );
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      const resolution = nextResolve(specifier, context);
      if (specifier === "playwright") {
        assert.equal(fileURLToPath(resolution.url), playwright);
        throw resolved;
      }
      return resolution;
    },
  });
  try {
    await assert.rejects(
      import("./teams_brand_images.mjs"),
      (error) => error === resolved,
    );
  } finally {
    hooks.deregister();
  }
});
