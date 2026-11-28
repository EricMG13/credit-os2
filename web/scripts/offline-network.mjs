import assert from "node:assert/strict";
import { createServer } from "node:http";

// R8: install before any page exists, so popup initial requests share the same guard.
export function isLoopbackRequest(address) {
  const url = new URL(address);
  if (["chrome:", "edge:"].includes(url.protocol)) {
    const localPath = url.searchParams.get("path") ?? "";
    return (
      url.host === "fileicon" &&
      url.pathname === "/" &&
      !url.username &&
      !url.password &&
      !url.hash &&
      url.searchParams.size === 1 &&
      /^(?:\/(?![/\\])|[A-Za-z]:[/\\](?![/\\]))/u.test(localPath) &&
      !/[\u0000-\u001f\u007f]/u.test(localPath)
    );
  }
  if (url.protocol === "blob:") return isLoopbackRequest(url.pathname);
  if (url.protocol === "file:") return url.hostname === "" || url.hostname === "localhost";
  if (["data:", "about:"].includes(url.protocol)) return true;
  if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol)) return false;
  return (
    url.hostname === "localhost" ||
    url.hostname === "[::1]" ||
    /^127(?:\.\d{1,3}){3}$/u.test(url.hostname)
  );
}

const PEER_RESET_CODES = new Set(["ECONNRESET", "EPIPE", "ECONNABORTED", "ECANCELED"]);

// Playwright routes do not intercept every redirected request. The browser proxy
// terminates those requests locally, without DNS lookup or an upstream connection.
export async function createOfflineProxy() {
  const attempts = [];
  const server = createServer((request, response) => {
    attempts.push({ target: request.url, method: request.method });
    response.writeHead(403);
    response.end("Blocked by the offline proof");
  });
  const sockets = new Set();
  server.on("connection", (socket) => {
    sockets.add(socket);
    // Node's http.Server detaches its internal error handler on "connect"; keep
    // one on every accepted socket so peer TCP resets (ECONNRESET) destroy cleanly.
    socket.on("error", (error) => {
      if (PEER_RESET_CODES.has(error?.code)) {
        socket.destroy();
        return;
      }
      throw error;
    });
    socket.once("close", () => sockets.delete(socket));
  });
  server.on("connect", (request, socket) => {
    attempts.push({ target: request.url, method: "CONNECT" });
    socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    attempts,
    settings: {
      server: `http://127.0.0.1:${String(server.address().port)}`,
      bypass: "localhost,127.0.0.1,[::1]",
    },
    async close() {
      for (const socket of sockets) socket.destroy();
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}

export async function installOfflineGuard(context) {
  const attempts = [];
  context.on("request", (request) => {
    if (!isLoopbackRequest(request.url()))
      attempts.push({
        url: request.url(),
        method: request.method(),
        resource: request.resourceType(),
      });
  });
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (isLoopbackRequest(request.url())) {
      await route.fallback();
      return;
    }
    await route.abort("blockedbyclient");
  });
  await context.routeWebSocket("**/*", (socket) => {
    if (isLoopbackRequest(socket.url())) {
      socket.connectToServer();
      return;
    }
    attempts.push({ url: socket.url(), method: "GET", resource: "websocket" });
    socket.close();
  });
  return {
    attempts,
    assertOffline() {
      assert.deepEqual(attempts, [], "Non-loopback requests attempted during the offline proof");
    },
  };
}
