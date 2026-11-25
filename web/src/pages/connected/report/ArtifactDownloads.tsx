import { useCallback } from "react";
import { Button } from "@/components/base/buttons/button";
import { GapText } from "@/pages/library/parts/GapText";
import { useResource } from "../useResource";
import { Tile } from "./overview/Tile";

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
    <Tile
      span={12}
      label="Model and calculation files"
      kicker="Delivered with the report"
      title="Model and calculation files"
    >
      {!value && !error && (
        <p role="status" className="text-text-secondary">
          Loading the model and calculation files…
        </p>
      )}
      {error && <p role="status">{error}</p>}
      {value && value.length > 0 && (
        <ul
          aria-label="Model and calculation file list"
          className="divide-y divide-border-hairline rounded-ds-md border border-border-hairline"
        >
          {value.map(({ label, href }) => (
            <li key={href} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
              <Button
                href={href}
                download
                color="tertiary"
                className="min-h-8 max-[480px]:min-h-11"
              >
                {label}
              </Button>
              <GapText>No hash published</GapText>
            </li>
          ))}
        </ul>
      )}
      {value?.some((file) => file.label === "Annual model handoff") && (
        <p className="text-small text-text-secondary">
          The annual model handoff is the Financial foundation handoff used as the model input.
        </p>
      )}
      {value && !value.some((file) => file.label === "HTML Model") && (
        <p className="text-small text-text-secondary">
          The original HTML Model is unavailable for this run.
        </p>
      )}
      {value?.length === 0 && (
        <p className="text-small text-text-secondary">
          The original calculation files are unavailable for this run.
        </p>
      )}
    </Tile>
  );
}
