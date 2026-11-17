export type SourceFileReference = {
  name?: string;
  file?: string | null;
  sha256: string | null;
  href?: string | null;
  pageHref?: string | null;
};

const sourceSegment = (value: string) =>
  encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

function citedPageLabel(query: string) {
  const match = /^\?page=([1-9]\d*)(?:&end=([1-9]\d*))?$/.exec(query);
  if (!match) return null;
  const first = Number(match[1]);
  const last = Number(match[2] ?? match[1]);
  if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last) || last < first) return null;
  return first === last ? `page ${String(first)}` : `pages ${String(first)}–${String(last)}`;
}

/**
 * The supplied sources a trace cites, as text: each file's name and the pages cited, read from the
 * bridge addresses the trace already carries (decision 9: listed only, never opened).
 */
export function citedSourceNames(links: readonly { href: string }[]) {
  const sources = new Map<string, { name: string; pages: Set<string> }>();
  for (const { href } of links) {
    const [path = "", query] = href.split("?", 2);
    const pages = query === undefined ? null : citedPageLabel(`?${query}`);
    const name = decodeURIComponent(path.slice(path.lastIndexOf("/") + 1));
    const source = sources.get(path) ?? { name, pages: new Set<string>() };
    if (pages) source.pages.add(pages);
    sources.set(path, source);
  }
  return [...sources].map(([path, { name, pages }]) => ({
    path,
    text: pages.size ? `${name}, cited ${[...pages].join("; ")}` : name,
  }));
}

/** The bridge's address for this exact run, filename and digest, when the source carries it. */
function attestedSource(folder: string, source: SourceFileReference) {
  const name = source.file ?? source.name;
  if (!name || !source.sha256 || !/^[a-f0-9]{64}$/.test(source.sha256)) return null;
  const base = `/connected/sources/${sourceSegment(folder)}/${source.sha256}/${sourceSegment(name)}`;
  if (source.href !== base) return null;
  const page = source.pageHref?.startsWith(base) ? source.pageHref.slice(base.length) : "";
  return { name, base, pageLabel: page ? citedPageLabel(page) : null };
}

/** Only links attested by the bridge for this exact run, filename and digest are drawn. */
export function sourceFileLinks(folder: string, source: SourceFileReference) {
  const attested = attestedSource(folder, source);
  if (!attested) return [];
  const { name, base, pageLabel } = attested;
  const links = [{ label: `Open source file: ${name}`, href: base }];
  if (pageLabel && source.pageHref) {
    links.unshift({ label: `Open cited source ${pageLabel}: ${name}`, href: source.pageHref });
  }
  return links;
}

/**
 * The pages a citation names in the source supplied to this run, as text (decision 9: source files
 * are listed only, never opened from the report). Null when the bridge attests no page range.
 */
export function citedSourcePages(folder: string, source: SourceFileReference) {
  const pageLabel = attestedSource(folder, source)?.pageLabel;
  return pageLabel ? `Cited ${pageLabel}` : null;
}

export function sourceCitationNote(chip: { reason: string | null; quote_found?: boolean | null }) {
  return (
    [
      chip.reason,
      chip.quote_found === false
        ? "The recorded quote or value was not located on the cited page."
        : null,
    ]
      .filter(Boolean)
      .join(" ") || null
  );
}
