import { useCallback } from "react";
import { DownloadButton } from "@/pages/library/parts/DownloadButton";
import { card, heading } from "../layout";
import { useResource } from "../useResource";

type FileLink = { label: string; href: string };

const NOT_LISTED = "The original model and calculation files could not be listed.";

export function ArtifactDownloads({ folder }: { folder: string }) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const response = await fetch(`/connected/artifacts/${encodeURIComponent(folder)}`, {
        signal,
      });
      if (!response.ok) throw new Error(NOT_LISTED);
      const data = (await response.json()) as { files?: FileLink[] };
      if (!Array.isArray(data.files)) throw new Error(NOT_LISTED);
      return data.files;
    },
    [folder],
  );
  const { value, error } = useResource(load);
  return (
    <section className={card}>
      <h3 className={heading}>Model and calculation files</h3>
      {!value && !error && (
        <p role="status" className="text-text-secondary">
          Loading the model and calculation files…
        </p>
      )}
      {error && <p role="status">{error}</p>}
      {value && (
        <div className="flex flex-wrap gap-3">
          {value.map(({ label, href }) => (
            <DownloadButton key={href} download={{ label, href, reason: null }} />
          ))}
        </div>
      )}
      {value?.some((file) => file.label === "Annual model handoff") && (
        <p className="text-sm text-text-secondary">
          The annual model handoff is the Financial foundation handoff used as the model input.
        </p>
      )}
      {value && !value.some((file) => file.label === "HTML Model") && (
        <p className="text-text-secondary">The original HTML Model is unavailable for this run.</p>
      )}
      {value?.length === 0 && (
        <p className="text-text-secondary">
          The original calculation files are unavailable for this run.
        </p>
      )}
    </section>
  );
}
