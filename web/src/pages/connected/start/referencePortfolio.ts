import { useRef, useState } from "react";
import {
  nameReferencePortfolio,
  removeReferencePortfolio,
  RequestError,
  uploadReferenceFile,
  type ReferencePortfolio,
} from "../api";
import { asSentence } from "../useResource";
import { FieldProblem } from "./fields";
import { COMPARISON_NEEDS_NAME } from "./plain";

/** The service's own ceilings for a reference portfolio's files (a standing one's too). */
export const PORTFOLIO_FILE_SIZE_LIMIT = 20 * 1024 * 1024;
export const FILE_COUNT_LIMIT = 4;
export const FILE_TYPES = /\.(?:csv|xlsx)$/i;
export const COMPARISON_FILE_HINT = "CSV or Excel (.xlsx). Up to 4 files, 20 MB each.";

/**
 * The comparison portfolio as the Documents step draws it: a reference portfolio the analyst
 * supplies for this run only. It is optional, it is not one of the run's documents, and it is
 * sent on its own requests, never in the answers.
 */
export type ComparisonView = {
  name: string;
  holds: string;
  files: readonly File[];
  /** Files refused when chosen (type, size, count, a name already chosen). */
  fileProblem: string;
  /** What the service read from exactly this name, choice and files; undefined until it has. */
  result?: ReferencePortfolio;
  changeName: (value: string) => void;
  changeHolds: (value: string) => void;
  addFiles: (selected: Iterable<File> | null) => void;
  removeFile: (file: File) => void;
  /** Sends the files and the name, and shows what the service read. */
  read: () => void;
  /** Clears the name, the choice and the files. */
  remove: () => void;
};

/** A refusal of the portfolio's files or name, as a problem on its name box. */
function asProblem(failure: unknown) {
  return failure instanceof RequestError && failure.status === 400
    ? new FieldProblem("reference_portfolio", asSentence(failure.message))
    : failure;
}

/**
 * The comparison portfolio's inputs, and the two ways they reach the service: `send` (the Read
 * portfolio button) and `settle` (before a summary). Until one of them runs, nothing is sent, so
 * a run with no comparison portfolio sends exactly the requests it always did.
 */
export function useComparisonPortfolio(onChange: () => void) {
  const [name, setName] = useState("");
  const [holds, setHolds] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileProblem, setFileProblem] = useState("");
  const [result, setResult] = useState<ReferencePortfolio>();
  // The draft that holds a portfolio this form sent; it matches the inputs only while `result`
  // is set, and is replaced or removed by the next `send` or `settle`.
  const storedOn = useRef<string | null>(null);

  function changed() {
    setResult(undefined);
    setFileProblem("");
    onChange();
  }

  function addFiles(selected: Iterable<File> | null) {
    const names = new Set(files.map((file) => file.name.normalize("NFC").toLowerCase()));
    const added: File[] = [];
    const problems: string[] = [];
    for (const file of Array.from(selected ?? [])) {
      const key = file.name.normalize("NFC").toLowerCase();
      if (!FILE_TYPES.test(file.name)) problems.push(`${file.name} is not a CSV or Excel file.`);
      else if (file.size > PORTFOLIO_FILE_SIZE_LIMIT)
        problems.push(`${file.name} exceeds the 20 MB limit.`);
      else if (names.has(key)) problems.push(`${file.name} is already chosen.`);
      else if (names.size >= FILE_COUNT_LIMIT)
        problems.push(`${file.name} was not added: a portfolio is at most 4 files.`);
      else {
        names.add(key);
        added.push(file);
      }
    }
    changed();
    setFiles((previous) => [...previous, ...added]);
    setFileProblem(problems.join(" "));
  }

  /** Replaces whatever the draft holds with these inputs; a refusal is a problem on the name. */
  async function send(draftId: string) {
    if (!name.trim()) throw new FieldProblem("reference_portfolio", COMPARISON_NEEDS_NAME);
    try {
      if (storedOn.current === draftId) await removeReferencePortfolio(draftId);
      storedOn.current = draftId;
      for (const file of files) await uploadReferenceFile(draftId, file);
      const reading = await nameReferencePortfolio(draftId, name.trim(), holds);
      if (!reading.portfolio)
        throw new FieldProblem(
          "reference_portfolio",
          reading.error || "The portfolio's files could not be read.",
        );
      setResult(reading.portfolio);
    } catch (failure) {
      throw asProblem(failure);
    }
  }

  /** Before a summary: the draft holds exactly these inputs, or no portfolio when there is none. */
  async function settle(draftId: string) {
    if (files.length > 0) {
      if (!result || storedOn.current !== draftId) await send(draftId);
      return;
    }
    if (storedOn.current !== draftId) return;
    await removeReferencePortfolio(draftId);
    storedOn.current = null;
  }

  return {
    name,
    holds,
    files,
    fileProblem,
    result,
    changeName: (value: string) => {
      changed();
      setName(value);
    },
    changeHolds: (value: string) => {
      changed();
      setHolds(value);
    },
    addFiles,
    removeFile: (file: File) => {
      changed();
      setFiles((previous) => previous.filter((item) => item !== file));
    },
    remove: () => {
      changed();
      setName("");
      setHolds("");
      setFiles([]);
    },
    send,
    settle,
  };
}
