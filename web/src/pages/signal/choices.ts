// A yes or no per id over the value the slice delivers: a story's save, a topic's follow, a
// reaction, a settings switch.
import { useRef, useState } from "react";

/** Null once the service has accepted the choice, else the sentence to show. */
type Write = (id: string, on: boolean) => Promise<string | null>;

/**
 * With no service (`write` null) a choice is kept in memory only. With one, a choice shows at once
 * and is sent; when its answer comes and no later press on the same id is still out, the page goes
 * back to the slice's value: the re-read one after a write the service accepted, the earlier one
 * after a write it refused (`onRefused` is given the sentence).
 */
export function useChoices(write: Write | null, onRefused: (sentence: string) => void) {
  const [chosen, setChosen] = useState<ReadonlyMap<string, boolean>>(new Map());
  const out = useRef(new Map<string, number>());
  const count = (id: string, change: 1 | -1) => {
    const left = (out.current.get(id) ?? 0) + change;
    out.current.set(id, left);
    return left;
  };
  const forget = (id: string) => {
    setChosen((held) => new Map([...held].filter(([key]) => key !== id)));
  };
  return {
    on: (id: string, delivered: boolean) => chosen.get(id) ?? delivered,
    toggle: (id: string, delivered: boolean) => {
      const next = !(chosen.get(id) ?? delivered);
      setChosen((held) => new Map(held).set(id, next));
      if (write === null) return;
      count(id, 1);
      void write(id, next).then((refusal) => {
        if (refusal !== null) onRefused(refusal);
        if (count(id, -1) === 0) forget(id);
      });
    },
  };
}
