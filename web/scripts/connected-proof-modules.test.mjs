import assert from "node:assert/strict";
import { once } from "node:events";
import path from "node:path";
import { test } from "node:test";
import { queryByRole, waitFor } from "@testing-library/dom";
import { JSDOM, VirtualConsole } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { checkCompactModules } from "./connected-proof.mjs";

// Use DOM roles and native clicks against the rendered page. jsdom has no responsive layout.
function domLocator(find, window) {
  function visible(node) {
    if (!node || (node.classList.contains("lg:hidden") && window.innerWidth >= 1024)) return false;
    const details = node.closest("details");
    return !details || details.open || node.closest("summary") !== null;
  }

  function required() {
    const node = find();
    assert.ok(node, "Locator did not match the rendered Modules page");
    return node;
  }

  return {
    getByRole: (role, options) =>
      domLocator(() => {
        const node = find();
        return node && queryByRole(node, role, { ...options, hidden: true });
      }, window),
    locator: (selector) => domLocator(() => find()?.querySelector(selector), window),
    filter: ({ hasText }) =>
      domLocator(() => {
        const node = find();
        return node && hasText.test(node.textContent) ? node : null;
      }, window),
    async click() {
      const node = required();
      assert.ok(visible(node), "Locator is hidden in the rendered disclosure");
      await act(async () => {
        const change =
          node.tagName === "A"
            ? once(window, "hashchange")
            : node.tagName === "SUMMARY"
              ? once(node.parentElement, "toggle")
              : undefined;
        node.click();
        await change;
      });
    },
    waitFor: ({ state = "visible" } = {}) =>
      waitFor(
        () => {
          const node = find();
          if (state === "attached") assert.ok(node);
          else assert.equal(visible(node), state === "visible");
        },
        { container: window.document },
      ),
  };
}

function output(id) {
  return {
    selected: true,
    output: { id, module: id, label: id, href: "", sha256: "a".repeat(64) },
    sections: [
      { heading: "Findings", level: 2, line: 1, blocks: [] },
      {
        heading: "Bottom line",
        level: 3,
        line: 3,
        blocks: [{ type: "text", line: 4, end: 4, text: "Synthetic finding." }],
      },
    ],
  };
}

test(
  "the connected proof selects a module and jumps in the rendered mobile navigator",
  { timeout: 15000 },
  async (t) => {
    const web = path.resolve(import.meta.dirname, "..");
    const vite = await createServer({
      root: web,
      configFile: false,
      resolve: { alias: { "@": path.join(web, "src") } },
      esbuild: { jsx: "automatic" },
      server: { middlewareMode: true, hmr: false, watch: null },
    });
    t.after(() => vite.close());

    const pageErrors = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("jsdomError", (error) => pageErrors.push(error));
    const { window } = new JSDOM("<main></main>", {
      url: "http://localhost/report/case#modules",
      virtualConsole,
    });
    let root;
    const globals = {
      window,
      document: window.document,
      HTMLElement: window.HTMLElement,
      HTMLInputElement: window.HTMLInputElement,
      HTMLTextAreaElement: window.HTMLTextAreaElement,
      SVGElement: window.SVGElement,
      Element: window.Element,
      Node: window.Node,
      CSS: {
        escape: (name) => {
          assert.match(name, /^[a-z][a-z0-9-]*$/u);
          return name;
        },
      },
      IS_REACT_ACT_ENVIRONMENT: true,
    };
    Object.assign(globalThis, globals);
    t.after(async () => {
      try {
        if (root) await act(async () => root.unmount());
      } finally {
        window.close();
        for (const key of Object.keys(globals)) Reflect.deleteProperty(globalThis, key);
      }
    });
    const viewportWidths = [];
    const matches = [];
    const scrolled = [];
    window.HTMLElement.prototype.scrollIntoView = function () {
      scrolled.push(this.id);
    };
    window.matchMedia = (query) => {
      const cutoff = /min-width: (\d+)px/u.exec(query)?.[1];
      const listeners = new Set();
      const media = {
        get matches() {
          return cutoff !== undefined && window.innerWidth >= Number(cutoff);
        },
        addEventListener: (_, listener) => listeners.add(listener),
        removeEventListener: (_, listener) => listeners.delete(listener),
        notify: () => listeners.forEach((listener) => listener()),
      };
      matches.push(media);
      return media;
    };
    const page = {
      viewportSize: () => ({ width: window.innerWidth, height: 844 }),
      setViewportSize: ({ width }) =>
        act(async () => {
          const previous = matches.map((media) => media.matches);
          viewportWidths.push(width);
          window.innerWidth = width;
          matches.forEach((media, index) => {
            if (media.matches !== previous[index]) media.notify();
          });
        }),
      waitForURL: (pattern) => waitFor(() => assert.match(window.location.href, pattern)),
      waitForFunction: (condition) => waitFor(() => assert.ok(condition())),
    };

    window.innerWidth = 1280;
    const { Modules } = await vite.ssrLoadModule("/src/pages/connected/report/Modules.tsx");
    const entries = [output("CP-0"), output("CP-1")];
    const view = {
      entries,
      modules: [
        { id: "CP-0", name: "Source readiness", state: "Delivered", outputs: [entries[0]] },
        { id: "CP-1", name: "Financial foundation", state: "Delivered", outputs: [entries[1]] },
      ],
      models: [],
    };
    const main = window.document.querySelector("main");
    root = createRoot(main);
    const draw = () =>
      root.render(
        createElement(Modules, {
          snapshot: { chips: {} },
          run: { folder: "case", issuer: "Synthetic", asOf: "2026-10-31" },
          view,
          module: window.location.hash.split("/")[1],
        }),
      );
    window.addEventListener("hashchange", draw);
    await act(async () => draw());
    const report = domLocator(() => main, window);
    let captured = false;
    await checkCompactModules(report, page, async () => {
      captured = true;
      assert.equal(window.innerWidth, 390);
      assert.equal(window.document.activeElement?.id, "module-bottom-line");
      assert.deepEqual(scrolled, ["module-bottom-line"]);
      assert.equal(window.document.querySelector("details").open, false);
    });
    assert.equal(captured, true);
    assert.equal(window.location.hash, "#modules/CP-0");
    assert.deepEqual(viewportWidths, [390, 1023, 1024, 1280]);
    assert.deepEqual(pageErrors, []);
  },
);
