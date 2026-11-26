// A yes or no per id over the value the slice delivers: a story's save, a topic's follow, a
// reaction, a settings switch.
import { useEffect, useRef, useState } from "react";
import { useSignalAsOf, type SignalAnswer } from "./actions";

/** What the service answered: `refusal` null once it has accepted the choice, else the sentence to show. */
type Write = (id: string, on: boolean) => Promise<Pick<SignalAnswer, "refusal" | "stale">>;

/**
 * `keep` is set when the service accepted a choice but the re-read failed: the value stays until a
 * later read arrives (the snapshot's `asOf` or the delivered value moves).
 */
type Entry = { value: boolean; keep: { asOf: string | null; delivered: boolean } | null };

/**
 * With no service (`write` null) a choice is kept in memory only. With one, a choice shows at once
 * and is sent; when its answer comes and no later press on the same id is still out, the page goes
 * back to the slice's value: the re-read one after a write the service accepted, the earlier one
 * after a write it refused (`onRefused` is given the sentence). When the write was accepted but
 * the re-read failed, the chosen value stays until a later read arrives.
 */
export function useChoices(write: Write | null, onRefused: (sentence: string) => void) {
  const [chosen, setChosen] = useState<ReadonlyMap<string, Entry>>(new Map());
  const asOf = useSignalAsOf();
  const latest = useRef(asOf);
  useEffect(() => {
    latest.current = asOf;
  }, [asOf]);
  const out = useRef(new Map<string, number>());
  const count = (id: string, change: 1 | -1) => {
    const left = (out.current.get(id) ?? 0) + change;
    out.current.set(id, left);
    return left;
  };
  const forget = (id: string) => {
    setChosen((held) => new Map([...held].filter(([key]) => key !== id)));
  };
  const current = (id: string, delivered: boolean): boolean => {
    const entry = chosen.get(id);
    if (entry === undefined) return delivered;
    const { keep } = entry;
    if (keep !== null && (keep.asOf !== asOf || keep.delivered !== delivered)) return delivered;
    return entry.value;
  };
  return {
    on: current,
    toggle: (id: string, delivered: boolean) => {
      const next = !current(id, delivered);
      setChosen((held) => new Map(held).set(id, { value: next, keep: null }));
      if (write === null) return;
      count(id, 1);
      void write(id, next).then((answer) => {
        if (answer.refusal !== null) onRefused(answer.refusal);
        if (count(id, -1) !== 0) return;
        if (answer.refusal === null && answer.stale === true) {
          const keep = { asOf: latest.current, delivered };
          setChosen((held) => new Map(held).set(id, { value: next, keep }));
        } else forget(id);
      });
    },
  };
}
