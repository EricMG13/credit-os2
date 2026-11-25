// The live page's logos: each source's logo is asked of the service at most once while the page
// is open, however often the snapshot is read again. A logo the service does not hold (404), a
// failed request and an answer that is no logo are all remembered as "none", so nothing is asked
// twice; a request given up because the page went is not remembered, and is asked again if the
// page comes back. At most four requests are out at a time; the rest wait their turn. An image
// the browser could not draw is "none" from then on, for every tile of that source. Nothing here
// is awaited by the feed: a tile draws its letters until its own logo arrives.
import { logoUrl } from "../logo-data";
import type { LogoStore } from "../logos";
import { readLogo } from "./service";

/** Requests out at once. */
export const LOGOS_AT_ONCE = 4;

export class LiveLogos implements LogoStore {
  /** What is known: a `data:` URL, or null for none. An id not here is not known yet. */
  private readonly known = new Map<string, string | null>();
  private readonly asked = new Set<string>();
  private readonly waiting: string[] = [];
  private readonly listeners = new Map<string, Set<() => void>>();
  private flying = 0;
  private stop = new AbortController();

  /** The page is drawn: requests may go out, and what was given up when it last went is asked again. */
  open() {
    this.stop = new AbortController();
    this.next();
  }

  /** The page has gone: what is out is given up, and nothing more goes out. */
  close() {
    this.stop.abort();
  }

  read = (id: string): string | null => this.known.get(id) ?? null;

  want = (id: string) => {
    if (this.asked.has(id)) return;
    this.asked.add(id);
    this.waiting.push(id);
    this.next();
  };

  subscribe = (id: string, listener: () => void) => {
    const held = this.listeners.get(id) ?? new Set();
    this.listeners.set(id, held.add(listener));
    return () => {
      held.delete(listener);
    };
  };

  broken = (id: string) => {
    if (this.known.get(id) == null) return;
    this.known.set(id, null);
    this.tell(id);
  };

  private tell(id: string) {
    for (const listener of this.listeners.get(id) ?? []) listener();
  }

  private next() {
    while (!this.stop.signal.aborted && this.flying < LOGOS_AT_ONCE) {
      const id = this.waiting.shift();
      if (id === undefined) return;
      this.flying += 1;
      void this.ask(id, this.stop.signal);
    }
  }

  private async ask(id: string, stop: AbortSignal) {
    const reply = await readLogo(id, stop);
    this.flying -= 1;
    if (stop.aborted) {
      // Given up, not answered: it waits to be asked again.
      this.waiting.push(id);
      return;
    }
    const url = reply === null ? null : logoUrl(reply.type, reply.data);
    this.known.set(id, url);
    if (url !== null) this.tell(id);
    this.next();
  }
}
