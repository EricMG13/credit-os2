// After sources/uui/tags.tsx, plain and non-interactive: a story's topic tags, as drawn.
// `written` names the tags a model wrote: drawn with a dashed edge (not colour alone) and named
// "Tag written by AI: <tag>" for a screen reader.
export function Tags({
  tags,
  label,
  written = [],
}: {
  tags: string[];
  label?: string;
  written?: string[];
}) {
  return (
    <ul aria-label={label} className="flex flex-wrap items-center gap-2">
      {tags.map((tag, index) => {
        const byAi = written.includes(tag);
        return (
          <li
            key={index}
            className={`rounded-md bg-surface-card px-2 py-[3px] text-xs font-medium text-text-secondary ring-1 ring-inset ${byAi ? "border border-dashed border-text-tertiary ring-transparent" : "ring-border-hairline"}`}
          >
            {byAi ? (
              <span role="img" aria-label={`Tag written by AI: ${tag}`}>
                {tag}
              </span>
            ) : (
              tag
            )}
          </li>
        );
      })}
    </ul>
  );
}
