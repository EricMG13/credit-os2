import { useSyncExternalStore } from "react";
import type { LibraryData } from "@/data";
import { useSource } from "../../source";
import type { ModelRun } from "../slice/types";
import { runKey } from "./RunPage";

// A choice belongs to one run in one loaded library, survives page changes, and resets on reload.
const choices = new WeakMap<LibraryData, Map<string, number>>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCaseChoice(run: ModelRun): [number, (index: number) => void] {
  const source = useSource();
  const key = runKey(run);
  const chosen = useSyncExternalStore(subscribe, () => choices.get(source)?.get(key) ?? 0);
  return [
    chosen,
    (index) => {
      const runs = choices.get(source) ?? new Map<string, number>();
      runs.set(key, index);
      choices.set(source, runs);
      listeners.forEach((listener) => {
        listener();
      });
    },
  ];
}
