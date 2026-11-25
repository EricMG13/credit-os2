import { Button } from "@/components/base/buttons/button";
import { PageHeader } from "../../shell/PageHeader";
import { GapNote } from "./report/overview/Tile";

const WHY = {
  "Run activity": "Runs are not available in a read-only preview. The library and reports are.",
  "Run progress": "Runs are not available in a read-only preview. The library and reports are.",
  "Start run":
    "This preview has no Credit OS service behind it, so it cannot start or follow a run. Library and Coverage show the saved reports.",
} as const;

/** A read-only preview holds no run records: the screen's own header and a gap that says why. */
export function RunReadOnly({ title }: { title: keyof typeof WHY }) {
  return (
    <>
      <PageHeader title={title} actions={<Button href="/">Back to Library</Button>} />
      <div className="mt-6">
        <GapNote>{WHY[title]}</GapNote>
      </div>
    </>
  );
}
