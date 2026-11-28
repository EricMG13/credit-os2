import assert from "node:assert/strict";
import { request } from "node:http";
import { connect } from "node:net";
import { test } from "node:test";
import { createOfflineProxy, installOfflineGuard, isLoopbackRequest } from "./offline-network.mjs";

test("offline proof accepts only local resource schemes and loopback hosts", () => {
  for (const url of [
    "http://127.0.0.1:4321/",
    "http://127.12.3.4/",
    "http://localhost/",
    "http://[::1]/",
    "ws://127.0.0.1:4321/",
    "file:///tmp/report.html",
    "data:text/plain,local",
    "blob:http://127.0.0.1:4321/id",
  ])
    assert.equal(isLoopbackRequest(url), true, url);
  for (const url of [
    "https://example.invalid/resource",
    "http://localhost.example.invalid/",
    "http://127.0.0.1.example.invalid/",
    "http://127.0.0.1@example.invalid/",
    "http://192.168.1.1/",
    "wss://example.invalid/socket",
    "blob:https://example.invalid/id",
    "ftp://127.0.0.1/file",
    "file://server/share/report.html",
  ])
    assert.equal(isLoopbackRequest(url), false, url);
});

test("context guard records and aborts external requests and WebSockets", async () => {
  const listeners = new Map();
  const routes = new Map();
  const context = {
    on: (name, listener) => listeners.set(name, listener),
    route: (pattern, handler) => routes.set(pattern, handler),
    routeWebSocket: (pattern, handler) => routes.set(`ws:${pattern}`, handler),
  };
  const guard = await installOfflineGuard(context);
  let continued = 0;
  let aborted = 0;
  for (const url of ["http://127.0.0.1:4321/", "https://example.invalid/popup"]) {
    const request = { url: () => url, method: () => "GET", resourceType: () => "document" };
    listeners.get("request")(request);
    await routes.get("**/*")({
      request: () => request,
      fallback: () => {
        continued += 1;
      },
      abort: (reason) => {
        assert.equal(reason, "blockedbyclient");
        aborted += 1;
      },
    });
  }
  assert.equal(continued, 1);
  assert.equal(aborted, 1);
  for (const url of ["ws://127.0.0.1:4321/socket", "wss://example.invalid/socket"]) {
    routes.get("ws:**/*")({
      url: () => url,
      connectToServer: () => {
        continued += 1;
      },
      close: () => {
        aborted += 1;
      },
    });
  }
  assert.equal(continued, 2);
  assert.equal(aborted, 2);
  assert.deepEqual(
    guard.attempts.map(({ url }) => url),
    ["https://example.invalid/popup", "wss://example.invalid/socket"],
  );
  assert.throws(() => guard.assertOffline(), /Non-loopback requests attempted/u);
});

test("denial proxy terminates HTTP and CONNECT locally without an upstream", async () => {
  const proxy = await createOfflineProxy();
  try {
    const local = new URL(proxy.settings.server);
    for (const [method, target] of [
      ["GET", "http://example.invalid/path"],
      ["CONNECT", "example.invalid:443"],
    ]) {
      const status = await new Promise((resolve, reject) => {
        const outbound = request({
          hostname: local.hostname,
          port: local.port,
          method,
          path: target,
        });
        outbound.on("error", reject);
        outbound.on("response", (response) => {
          response.resume();
          resolve(response.statusCode);
        });
        outbound.on("connect", (response, socket) => {
          socket.destroy();
          resolve(response.statusCode);
        });
        outbound.end();
      });
      assert.equal(status, 403);
    }
    assert.deepEqual(proxy.attempts, [
      { target: "http://example.invalid/path", method: "GET" },
      { target: "example.invalid:443", method: "CONNECT" },
    ]);
  } finally {
    await proxy.close();
  }
});

test("denial proxy survives client TCP reset after rejecting HTTP and CONNECT", async () => {
  const proxy = await createOfflineProxy();
  try {
    const local = new URL(proxy.settings.server);
    for (const [target, rawRequest] of [
      [
        "http://example.invalid/path",
        "GET http://example.invalid/path HTTP/1.1\r\nHost: example.invalid\r\n\r\n",
      ],
      [
        "example.invalid:443",
        "CONNECT example.invalid:443 HTTP/1.1\r\nHost: example.invalid:443\r\n\r\n",
      ],
    ]) {
      const response = await new Promise((resolve, reject) => {
        let head = "";
        let settled = false;
        let errored = false;
        const client = connect({ host: local.hostname, port: Number(local.port) }, () => {
          client.write(rawRequest);
        });
        client.on("error", (error) => {
          if (!settled) {
            errored = true;
            settled = true;
            reject(error);
          }
        });
        client.once("close", () => {
          if (errored) return;
          if (!settled) {
            settled = true;
            reject(new Error(`Proxy closed before completing response head for ${target}`));
            return;
          }
          setTimeout(() => resolve(head), 10);
        });
        client.on("data", (chunk) => {
          if (settled) return;
          head += chunk.toString("utf8");
          if (head.includes("\r\n\r\n")) {
            settled = true;
            client.resetAndDestroy();
          }
        });
      });
      assert.match(response, /^HTTP\/1\.1 403 Forbidden\r\n/u, target);
    }
    assert.deepEqual(proxy.attempts, [
      { target: "http://example.invalid/path", method: "GET" },
      { target: "example.invalid:443", method: "CONNECT" },
    ]);
  } finally {
    await proxy.close();
  }
});
