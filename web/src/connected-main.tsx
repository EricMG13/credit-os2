import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ConnectedLoadBoundary } from "./ConnectedLoadBoundary";
import "./index.css";

// How long React keeps a loading state it has shown before it draws what replaces it. A page file
// that takes longer than this is no longer waited for, so the application is drawn, with its own
// loading state for the page, when React would have drawn it.
const LOADING_HELD_MS = 300;

const container = document.getElementById("root");
if (container === null) throw new Error("connected.html has no #root element");

const mode = document.querySelector<HTMLMetaElement>('meta[name="credit-os-mode"]');
const path = window.location.pathname;
const readOnly = mode?.content === "preview";
// The server writes this meta into the page exactly when it hosts Signal.
const signal =
  document.querySelector<HTMLMetaElement>('meta[name="credit-os-signal"]')?.content === "on";
const signIn =
  document.querySelector<HTMLMetaElement>('meta[name="credit-os-sign-in"]')?.content === "on";
const root = createRoot(container);

function draw(page: ReactNode) {
  root.render(
    <StrictMode>
      <ConnectedLoadBoundary>{page}</ConnectedLoadBoundary>
    </StrictMode>,
  );
}

function Unloaded({ failure }: { failure: unknown }): never {
  throw failure;
}

// The application is drawn once its file and the file of the page at this address have loaded.
// Drawn as pending lazy components they would each show a loading state first, and React holds the
// page back while one is on screen.
draw(
  <main className="mx-auto w-full max-w-[96rem] p-6">
    <p className="text-text-secondary" role="status" aria-live="polite">
      Loading Credit OS…
    </p>
  </main>,
);
const held = new Promise((resolve) => setTimeout(resolve, LOADING_HELD_MS));
import("./pages/connected/ConnectedApp").then(
  async ({ ConnectedApp, preloadPage }) => {
    await Promise.race([preloadPage(path, readOnly, signal), held]);
    draw(
      <ConnectedApp
        path={path}
        readOnly={readOnly}
        signal={signal}
        signIn={signIn}
        mode={mode?.content === "synthetic" ? "synthetic" : "live"}
      />,
    );
  },
  (failure: unknown) => {
    draw(<Unloaded failure={failure} />);
  },
);
